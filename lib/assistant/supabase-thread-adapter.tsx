"use client";

import {SupabaseClient} from "@supabase/supabase-js";
import type {
    unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
    ThreadMessage,
    ExportedMessageRepository,
    AssistantApi,
    MessageFormatAdapter,
    MessageStorageEntry,
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

// Supabase History Provider 组件
function SupabaseHistoryProvider({
    children,
    supabase,
}: PropsWithChildren<{ supabase: SupabaseClient }>) {
    const history = useSupabaseThreadHistoryAdapter(supabase);

    const adapters = useMemo(
        () => ({
            history,
        }),
        [history]
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


