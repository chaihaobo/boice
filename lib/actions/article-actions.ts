"use server";

import {createClient} from "@/lib/supabase/server";
import {ArticleEntity} from "@/lib/entity/article";

export interface ArticleResult {
    total: number;
    articles: ArticleEntity[];
}

export async function getArticles(pageNo: number, pageSize: number): Promise<ArticleResult> {
    const supabaseClient = await createClient();
    const from = (pageNo - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 只获取已发布的文章
    const {
        data: articles,
        error
    } = await supabaseClient.from("articles")
        .select(`
        *,
        categories( id, name, slug ),
        tags(
            id,
            name,
            slug
        )
        `)
        .eq("status", "published")
        .range(from, to)
        .order("created_at", {ascending: false});
        
    if (error) {
        console.error("Supabase query articles error:", error);
        return {
            total: 0,
            articles: []
        }
    }
    
    // 查询总数
    const {count, error: countError} = await supabaseClient
        .from("articles")
        .select("*", {count: "exact", head: true})
        .eq("status", "published");

    if (countError) {
        console.error("Supabase count error:", countError);
        return {
            total: 0,
            articles: []
        }
    }

    return {
        total: count || 0,
        articles: articles || [],
    }
}

export async function getArticleById(id: number): Promise<ArticleEntity | null> {
    const supabaseClient = await createClient();
    
    const {data: article, error} = await supabaseClient
        .from("articles")
        .select(`
        *,
        categories( id, name, slug ),
        tags(
            id,
            name,
            slug
        )
        `)
        .eq("id", id)
        .eq("status", "published")
        .single();
        
    if (error) {
        console.error("Supabase query article by id error:", error);
        return null;
    }
    
    return article;
}