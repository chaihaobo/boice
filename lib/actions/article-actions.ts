"use server";

import {createClient, createServiceRoleClient} from "@/lib/supabase/server";
import {ArticleEntity} from "@/lib/entity/article";

export interface ArticleResult {
    total: number;
    articles: ArticleEntity[];
}

export interface LikeResult {
    success: boolean;
    liked: boolean;
    likesCount: number;
    error?: string;
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

/**
 * 增加文章阅读数
 * 使用 service role 绕过 RLS
 */
export async function incrementViews(articleId: number): Promise<{ success: boolean; views: number }> {
    const supabase = createServiceRoleClient();
    
    // 先获取当前阅读数
    const { data: article, error: fetchError } = await supabase
        .from("articles")
        .select("views")
        .eq("id", articleId)
        .single();
    
    if (fetchError) {
        console.error("Error fetching article views:", fetchError);
        return { success: false, views: 0 };
    }
    
    const newViews = (article.views || 0) + 1;
    
    // 更新阅读数
    const { error: updateError } = await supabase
        .from("articles")
        .update({ views: newViews })
        .eq("id", articleId);
    
    if (updateError) {
        console.error("Error updating article views:", updateError);
        return { success: false, views: article.views || 0 };
    }
    
    return { success: true, views: newViews };
}

/**
 * 检查用户是否已点赞文章
 */
export async function checkUserLiked(articleId: number): Promise<{ liked: boolean; userId: string | null }> {
    const supabaseClient = await createClient();
    
    // 获取当前用户
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        return { liked: false, userId: null };
    }
    
    // 检查是否已点赞
    const { data: like, error } = await supabaseClient
        .from("article_likes")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();
    
    if (error) {
        console.error("Error checking user like:", error);
        return { liked: false, userId: user.id };
    }
    
    return { liked: !!like, userId: user.id };
}

/**
 * 切换点赞状态
 * 使用 service role 绕过 RLS
 */
export async function toggleLike(articleId: number): Promise<LikeResult> {
    const supabaseClient = await createClient();
    const supabaseAdmin = createServiceRoleClient();
    
    // 获取当前用户
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        return { 
            success: false, 
            liked: false, 
            likesCount: 0, 
            error: "请先登录后再点赞" 
        };
    }
    
    // 检查是否已点赞
    const { data: existingLike, error: checkError } = await supabaseAdmin
        .from("article_likes")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle();
    
    if (checkError) {
        console.error("Error checking existing like:", checkError);
        return { 
            success: false, 
            liked: false, 
            likesCount: 0, 
            error: "检查点赞状态失败" 
        };
    }
    
    // 获取当前点赞数
    const { data: article, error: articleError } = await supabaseAdmin
        .from("articles")
        .select("likes")
        .eq("id", articleId)
        .single();
    
    if (articleError) {
        console.error("Error fetching article likes:", articleError);
        return { 
            success: false, 
            liked: false, 
            likesCount: 0, 
            error: "获取文章信息失败" 
        };
    }
    
    const currentLikes = article.likes || 0;
    
    if (existingLike) {
        // 已点赞，取消点赞
        const { error: deleteError } = await supabaseAdmin
            .from("article_likes")
            .delete()
            .eq("id", existingLike.id);
        
        if (deleteError) {
            console.error("Error deleting like:", deleteError);
            return { 
                success: false, 
                liked: true, 
                likesCount: currentLikes, 
                error: "取消点赞失败" 
            };
        }
        
        // 减少点赞数
        const newLikes = Math.max(0, currentLikes - 1);
        await supabaseAdmin
            .from("articles")
            .update({ likes: newLikes })
            .eq("id", articleId);
        
        return { success: true, liked: false, likesCount: newLikes };
    } else {
        // 未点赞，添加点赞
        const { error: insertError } = await supabaseAdmin
            .from("article_likes")
            .insert({
                article_id: articleId,
                user_id: user.id
            });
        
        if (insertError) {
            console.error("Error inserting like:", insertError);
            return { 
                success: false, 
                liked: false, 
                likesCount: currentLikes, 
                error: "点赞失败" 
            };
        }
        
        // 增加点赞数
        const newLikes = currentLikes + 1;
        await supabaseAdmin
            .from("articles")
            .update({ likes: newLikes })
            .eq("id", articleId);
        
        return { success: true, liked: true, likesCount: newLikes };
    }
}