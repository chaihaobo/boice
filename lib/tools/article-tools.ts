import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * 查询已发布文章的工具
 * 返回最多100条文章，按创建时间降序排列
 */
export const queryArticlesTool = tool({
  description:
    "查询已发布的文章列表，返回最多100条文章，按创建时间降序排列。用于回答用户关于文章的问题，如'最近有什么文章'、'有哪些文章'等。",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const supabase = await createClient();

      const { data: articles, error } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          description,
          author,
          publish_date,
          status,
          views,
          likes,
          created_at,
          categories(id, name, slug)
        `
        )
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return {
          success: false,
          error: error.message,
          articles: [],
          total: 0,
        };
      }

      return {
        success: true,
        articles: articles?.map((article) => ({
          id: article.id,
          title: article.title,
          description: article.description,
          author: article.author,
          publishDate: article.publish_date,
          status: article.status,
          views: article.views,
          likes: article.likes,
          createdAt: article.created_at,
          category: article.categories,
        })),
        total: articles?.length || 0,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "查询文章时发生未知错误",
        articles: [],
        total: 0,
      };
    }
  },
});

