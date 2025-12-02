export enum ArticleStatus {
    Draft = 'draft',
    Published = 'published',
    Archived = 'archived',
}

export interface CategoryEntity {
    id: number;
    name: string;
    slug: string;
}

export interface TagEntity {
    id: number;
    name: string;
    slug: string;
}

export interface ArticleEntity {
    id: number;                   // bigserial -> number
    user_id: string;              // uuid -> string
    category_id?: number | null;  // bigint -> number, 可为空
    title: string;                // text -> string
    description?: string | null;  // text -> string, 可为空
    content?: string | null;      // text -> string, 可为空
    author: string;               // text -> string
    publish_date: string;         // date -> string (ISO日期)
    read_time?: string | null;    // text -> string, 可为空
    views?: number | null;        // integer -> number, 可为空
    likes?: number | null;        // integer -> number, 可为空
    image?: string | null;        // text -> string, 可为空
    status?: ArticleStatus;       // 使用枚举
    created_at?: string | null;   // timestamp with time zone -> string (ISO)
    updated_at?: string | null;   // timestamp with time zone -> string (ISO)
    categories?: CategoryEntity | null;
    tags?: TagEntity[] | null;
}