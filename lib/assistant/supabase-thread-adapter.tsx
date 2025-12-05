"use client";

import {SupabaseClient} from "@supabase/supabase-js";
import type {
    unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
    ThreadMessage,
    ExportedMessageRepository,
    AssistantApi,
    MessageFormatAdapter,
    MessageStorageEntry,
    Attachment,
    PendingAttachment,
    CompleteAttachment,
    AttachmentAdapter,
    ThreadUserMessagePart,
} from "@assistant-ui/react";
import {createAssistantStream} from "assistant-stream";
import {FC, PropsWithChildren, useMemo, useState} from "react";
import {RuntimeAdapterProvider, useAssistantApi} from "@assistant-ui/react";

// 生成或获取匿名用户的 session_id
export function getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "";

    const storageKey = "chat_session_id";
    let sessionId = localStorage.getItem(storageKey);

    if (!sessionId) {
        sessionId = `anon_${crypto.randomUUID()}`;
        localStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
}

export interface ChatThread {
    id: string;
    user_id: string | null;
    session_id: string | null;
    title: string | null;
    status: "regular" | "archived";
    external_id: string | null;
    created_at: string;
    updated_at: string;
}

// JSONB 消息内容类型
export type MessageContent =
    | string
    | { type: string; text?: string; [key: string]: unknown }[]
    | Record<string, unknown>;

export interface ChatMessage {
    id: string;
    thread_id: string;
    role: "user" | "assistant" | "system";
    content: MessageContent;
    created_at: string;
}

// 存储消息的数据库格式
interface StoredMessage {
    id: string;
    thread_id: string;
    parent_id: string | null;
    format: string;
    content: unknown;
    created_at: string;
}

// ==================== 自定义格式适配器（支持附件）====================

// 自定义存储格式 - 保留所有 parts 包括文件
export type CustomAISDKStorageFormat = {
    role: string;
    parts: unknown[];
};

/**
 * 自定义的 AI SDK 格式适配器
 * 与官方 aiSDKV5FormatAdapter 的区别：不会过滤掉 file 类型的 parts
 */
export const customAISDKFormatAdapter: MessageFormatAdapter<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    CustomAISDKStorageFormat
> = {
    format: "ai-sdk/v5-with-files",  // 使用不同的格式名称

    encode({ message }: { parentId: string | null; message: { id: string; role: string; parts: unknown[] } }): CustomAISDKStorageFormat {
        // 保留所有 parts，不过滤文件
        return {
            role: message.role,
            parts: message.parts,
        };
    },

    decode(stored: MessageStorageEntry<CustomAISDKStorageFormat>): { parentId: string | null; message: { id: string; role: string; parts: unknown[] } } {
        return {
            parentId: stored.parent_id,
            message: {
                id: stored.id,
                role: stored.content.role,
                parts: stored.content.parts,
            },
        };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getId(message: any): string {
        return message.id;
    },
};

// 格式化的 History Adapter - 用于 withFormat
class FormattedSupabaseHistoryAdapter<TMessage, TStorageFormat> {
    constructor(
        private parent: SupabaseThreadHistoryAdapter,
        private formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
    ) {}

    async append(item: { parentId: string | null; message: TMessage }) {
        const encoded = this.formatAdapter.encode(item);
        const messageId = this.formatAdapter.getId(item.message);
        
        return this.parent._appendWithFormat(
            item.parentId,
            messageId,
            this.formatAdapter.format,
            encoded,
        );
    }

    async load() {
        return this.parent._loadWithFormat(
            this.formatAdapter.format,
            (message: MessageStorageEntry<TStorageFormat>) =>
                this.formatAdapter.decode(message),
        );
    }
}

// ThreadHistoryAdapter 实现 - 使用 AssistantApi
class SupabaseThreadHistoryAdapter {
    constructor(
        private supabase: SupabaseClient,
        private store: AssistantApi,
    ) {}

    // 实现 withFormat 方法
    withFormat<TMessage, TStorageFormat>(
        formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
    ) {
        return new FormattedSupabaseHistoryAdapter(this, formatAdapter);
    }

    // 内部方法：带格式的 append
    async _appendWithFormat<T>(
        parentId: string | null,
        messageId: string,
        format: string,
        content: T,
    ) {
        console.log("_appendWithFormat", { parentId, messageId, format, content });
        const { remoteId } = await this.store.threadListItem().initialize();

        // 从 content 中解析 role
        let role: string | null = null;
        if (content && typeof content === 'object') {
            const contentObj = content as Record<string, unknown>;
            if ('role' in contentObj && typeof contentObj.role === 'string') {
                role = contentObj.role;
            }
        }

        const { error } = await this.supabase.from("chat_messages").insert({
            id: messageId,
            thread_id: remoteId,
            parent_id: parentId,
            format,
            role,
            content,
        });

        if (error) {
            console.error("Error appending message:", error);
            throw error;
        }
    }

    // 内部方法：带格式的 load
    async _loadWithFormat<TMessage, TStorageFormat>(
        format: string,
        decoder: (message: MessageStorageEntry<TStorageFormat>) => { parentId: string | null; message: TMessage },
    ): Promise<{ messages: { parentId: string | null; message: TMessage }[] }> {
        console.log("_loadWithFormat", { format });
        const remoteId = this.store.threadListItem().getState().remoteId;
        if (!remoteId) return { messages: [] };

        const { data, error } = await this.supabase
            .from("chat_messages")
            .select("*")
            .eq("thread_id", remoteId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error loading messages:", error);
            return { messages: [] };
        }

        return {
            messages: (data || [])
                .filter((m: StoredMessage) => m.format === format)
                .map((m: StoredMessage) =>
                    decoder({
                        id: m.id,
                        parent_id: m.parent_id,
                        format: m.format,
                        content: m.content as TStorageFormat,
                    })
                ),
        };
    }

    // 保留原有的直接方法（作为后备）
    async append({parentId, message}: { parentId: string | null; message: ThreadMessage }) {
        console.log("append (direct)");
        const {remoteId} = await this.store.threadListItem().initialize();

        const {error} = await this.supabase.from("chat_messages").insert({
            id: message.id,
            thread_id: remoteId,
            parent_id: parentId,
            format: "aui/default",
            role: message.role,
            content: message.content,
        });

        if (error) {
            console.error("Error appending message:", error);
            throw error;
        }
    }

    async load(): Promise<ExportedMessageRepository> {
        console.log("load (direct)");
        const remoteId = this.store.threadListItem().getState().remoteId;
        if (!remoteId) return {messages: []};

        const {data, error} = await this.supabase
            .from("chat_messages")
            .select("*")
            .eq("thread_id", remoteId)
            .order("created_at", {ascending: true});

        if (error) {
            console.error("Error loading messages:", error);
            return {messages: []};
        }

        return {
            messages: (data || []).map((m: StoredMessage) => ({
                parentId: m.parent_id,
                message: {
                    id: m.id,
                    role: "user" as const,
                    content: m.content as ThreadMessage["content"],
                    createdAt: new Date(m.created_at),
                    status: {type: "complete" as const},
                    metadata: {},
                } as ThreadMessage,
            })),
        };
    }
}

// 创建 History Adapter 的 hook - 使用 useAssistantApi
function useSupabaseThreadHistoryAdapter(supabase: SupabaseClient) {
    const store = useAssistantApi();

    const [adapter] = useState(
        () => new SupabaseThreadHistoryAdapter(supabase, store)
    );

    return adapter;
}

// ==================== Attachment Adapter ====================

// 根据 MIME 类型猜测附件类型
const guessAttachmentType = (
    contentType: string,
): "image" | "document" | "file" => {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("text/")) return "document";
    if (contentType.startsWith("application/pdf")) return "document";
    return "file";
};

// Supabase Storage 附件适配器
export class SupabaseAttachmentAdapter implements AttachmentAdapter {
    public accept = "*";
    
    // 存储上传后的 URL 映射
    private uploadedUrls = new Map<string, string>();
    
    constructor(
        private supabase: SupabaseClient,
        private bucketName: string = "chat-attachments"
    ) {}

    public async *add({
        file,
    }: {
        file: File;
    }): AsyncGenerator<PendingAttachment, void> {
        const id = crypto.randomUUID();
        const type = guessAttachmentType(file.type);
        
        let attachment: PendingAttachment = {
            id,
            type,
            name: file.name,
            contentType: file.type,
            file,
            status: { type: "running", reason: "uploading", progress: 0 },
        };
        
        yield attachment;

        try {
            // 生成唯一的文件路径
            const fileExt = file.name.split('.').pop() || '';
            const filePath = `${id}${fileExt ? `.${fileExt}` : ''}`;
            
            // 上传到 Supabase Storage
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: false,
                });

            if (error) {
                throw error;
            }

            // 获取公开 URL
            const { data: urlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(data.path);

            const publicUrl = urlData.publicUrl;
            this.uploadedUrls.set(id, publicUrl);

            attachment = {
                ...attachment,
                status: { type: "requires-action", reason: "composer-send" },
            };
            
            yield attachment;
        } catch (error) {
            console.error("Error uploading attachment:", error);
            attachment = {
                ...attachment,
                status: { type: "incomplete", reason: "error" },
            };
            yield attachment;
        }
    }

    public async remove(attachment: Attachment): Promise<void> {
        // 从 URL map 中移除
        this.uploadedUrls.delete(attachment.id);
        
        // 可选：从 Storage 中删除文件
        // const fileExt = attachment.name.split('.').pop() || '';
        // const filePath = `${attachment.id}${fileExt ? `.${fileExt}` : ''}`;
        // await this.supabase.storage.from(this.bucketName).remove([filePath]);
    }

    public async send(
        attachment: PendingAttachment,
    ): Promise<CompleteAttachment> {
        const url = this.uploadedUrls.get(attachment.id);
        if (!url) throw new Error("Attachment not uploaded");
        
        this.uploadedUrls.delete(attachment.id);

        let content: ThreadUserMessagePart[];
        
        if (attachment.type === "image") {
            content = [{ 
                type: "image", 
                image: url, 
                filename: attachment.name 
            }];
        } else {
            content = [
                {
                    type: "file",
                    data: url,
                    mimeType: attachment.contentType,
                    filename: attachment.name,
                },
            ];
        }

        return {
            ...attachment,
            status: { type: "complete" },
            content,
        };
    }
}

// 创建 Attachment Adapter 的 hook
function useSupabaseAttachmentAdapter(
    supabase: SupabaseClient,
    bucketName: string = "chat-attachments"
) {
    const [adapter] = useState(
        () => new SupabaseAttachmentAdapter(supabase, bucketName)
    );
    return adapter;
}

// ==================== Provider ====================

// Supabase History Provider 组件
function SupabaseHistoryProvider({
    children,
    supabase,
    attachmentBucketName = "chat-attachments",
}: PropsWithChildren<{ 
    supabase: SupabaseClient;
    attachmentBucketName?: string;
}>) {
    const history = useSupabaseThreadHistoryAdapter(supabase);
    const attachments = useSupabaseAttachmentAdapter(supabase, attachmentBucketName);

    const adapters = useMemo(
        () => ({
            history,
            attachments,
        }),
        [history, attachments]
    );

    return (
        <RuntimeAdapterProvider adapters={adapters}>
            {children}
        </RuntimeAdapterProvider>
    );
}

export function createSupabaseThreadListAdapter(
    supabase: SupabaseClient,
    userId: string | null
): RemoteThreadListAdapter {
    const sessionId = getOrCreateSessionId();

    // Provider 组件，注入 history adapter
    const unstable_Provider: FC<PropsWithChildren> = ({children}) => {
        return (
            <SupabaseHistoryProvider supabase={supabase}>
                {children}
            </SupabaseHistoryProvider>
        );
    };

    return {
        unstable_Provider,

        // 列出所有线程
        async list() {
            let query = supabase
                .from("chat_threads")
                .select("*")
                .order("updated_at", {ascending: false});

            if (userId) {
                query = query.eq("user_id", userId);
            } else {
                query = query.is("user_id", null).eq("session_id", sessionId);
            }

            const {data, error} = await query;

            if (error) {
                console.error("Error listing threads:", error);
                return {threads: []};
            }

            return {
                threads: (data || []).map((thread: ChatThread) => ({
                    remoteId: thread.id,
                    externalId: thread.external_id ?? undefined,
                    status: thread.status,
                    title: thread.title ?? undefined,
                })),
            };
        },

        // 初始化新线程
        async initialize(localId: string) {
            const {data, error} = await supabase
                .from("chat_threads")
                .insert({
                    user_id: userId,
                    session_id: userId ? null : sessionId,
                    title: null,
                    status: "regular",
                    external_id: localId,
                })
                .select()
                .single();

            if (error) {
                console.error("Error initializing thread:", error);
                throw error;
            }

            return {
                remoteId: data.id,
                externalId: data.external_id,
            };
        },

        // 重命名线程
        async rename(remoteId: string, title: string) {
            const {error} = await supabase
                .from("chat_threads")
                .update({title})
                .eq("id", remoteId);

            if (error) {
                console.error("Error renaming thread:", error);
                throw error;
            }
        },

        // 归档线程
        async archive(remoteId: string) {
            const {error} = await supabase
                .from("chat_threads")
                .update({status: "archived"})
                .eq("id", remoteId);

            if (error) {
                console.error("Error archiving thread:", error);
                throw error;
            }
        },

        // 取消归档
        async unarchive(remoteId: string) {
            const {error} = await supabase
                .from("chat_threads")
                .update({status: "regular"})
                .eq("id", remoteId);

            if (error) {
                console.error("Error unarchiving thread:", error);
                throw error;
            }
        },

        // 删除线程
        async delete(remoteId: string) {
            const {error} = await supabase
                .from("chat_threads")
                .delete()
                .eq("id", remoteId);

            if (error) {
                console.error("Error deleting thread:", error);
                throw error;
            }
        },

        // 获取线程详情
        async fetch(remoteId: string) {
            const {data, error} = await supabase
                .from("chat_threads")
                .select("*")
                .eq("id", remoteId)
                .single();

            if (error) {
                console.error("Error fetching thread:", error);
                throw error;
            }

            return {
                remoteId: data.id,
                status: data.status,
                title: data.title ?? undefined,
            };
        },

        // 生成标题
        async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
            return createAssistantStream(async (controller) => {
                const firstUserMessage = messages.find((m) => m.role === "user");
                if (firstUserMessage) {
                    let textContent = "";
                    for (const part of firstUserMessage.content) {
                        if (part.type === "text") {
                            textContent = part.text;
                            break;
                        }
                    }

                    if (textContent) {
                        const title = textContent.slice(0, 50) + (textContent.length > 50 ? "..." : "");
                        await supabase
                            .from("chat_threads")
                            .update({title})
                            .eq("id", remoteId);
                        controller.appendText(title);
                        controller.close();
                    }
                }
            });
        },
    };
}

// 保留原有的辅助函数
export async function saveMessage(
    supabase: SupabaseClient,
    threadId: string,
    role: "user" | "assistant" | "system",
    content: MessageContent
) {
    const {error} = await supabase.from("chat_messages").insert({
        thread_id: threadId,
        role,
        content,
    });

    if (error) {
        console.error("Error saving message:", error);
        throw error;
    }
}

export async function getMessages(
    supabase: SupabaseClient,
    threadId: string
): Promise<ChatMessage[]> {
    const {data, error} = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", {ascending: true});

    if (error) {
        console.error("Error getting messages:", error);
        return [];
    }

    return data || [];
}

export async function clearMessages(
    supabase: SupabaseClient,
    threadId: string
) {
    const {error} = await supabase
        .from("chat_messages")
        .delete()
        .eq("thread_id", threadId);

    if (error) {
        console.error("Error clearing messages:", error);
        throw error;
    }
}


