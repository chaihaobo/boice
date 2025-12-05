import {SupabaseClient} from "@supabase/supabase-js";
import type {
    unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
    ThreadMessage,
} from "@assistant-ui/react";
import {createAssistantStream} from "assistant-stream";

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

export function createSupabaseThreadListAdapter(
    supabase: SupabaseClient,
    userId: string | null
): RemoteThreadListAdapter {
    const sessionId = getOrCreateSessionId();

    return {
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

        // 获取线程详情（可选）
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

        // 生成标题（简单实现，返回空流）
        // 实际可以调用 AI 来生成标题
        async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
            return createAssistantStream(async (controller) => {
                // 简单实现：使用第一条用户消息作为标题
                const firstUserMessage = messages.find((m) => m.role === "user");
                if (firstUserMessage) {
                    // 从消息内容中提取文本
                    let textContent = "";
                    for (const part of firstUserMessage.content) {
                        if (part.type === "text") {
                            textContent = part.text;
                            break;
                        }
                    }

                    if (textContent) {
                        const title = textContent.slice(0, 50) + (textContent.length > 50 ? "..." : "");
                        // 更新标题
                        await supabase
                            .from("chat_threads")
                            .update({title})
                            .eq("id", remoteId);
                        controller.appendText(title)
                        controller.close()
                    }
                }
            });
        },
    };
}

// 消息历史管理函数
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
