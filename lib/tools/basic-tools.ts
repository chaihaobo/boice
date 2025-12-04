import { tool } from "ai";
import { z } from "zod";
import {
  createTag,
  createCategory,
} from "@/lib/actions/dashboard-actions";
import { createClient } from "@/lib/supabase/server";

/**
 * 创建标签工具
 */
export const createTagTool = tool({
  description: `创建一个新的文章标签。
使用场景：
- 用户想要添加新标签
- 创建文章时需要的标签不存在`,
  inputSchema: z.object({
    name: z.string().min(1).max(50).describe("标签名称"),
    slug: z.string().optional().describe("标签别名（URL友好，可选，不填则自动生成）"),
  }),
  execute: async ({ name, slug }) => {
    try {
      const finalSlug = slug || generateSlugFromText(name);
      const result = await createTag(name, finalSlug);

      if (result.error) {
        return {
          success: false,
          error: result.error,
          tag: null,
        };
      }

      return {
        success: true,
        message: `标签「${name}」创建成功`,
        tag: {
          id: result.data?.id,
          name: result.data?.name,
          slug: result.data?.slug,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "创建标签时发生未知错误",
        tag: null,
      };
    }
  },
});

/**
 * 创建分类工具
 */
export const createCategoryTool = tool({
  description: `创建一个新的文章分类。
使用场景：
- 用户想要添加新分类
- 创建文章时需要的分类不存在`,
  inputSchema: z.object({
    name: z.string().min(1).max(50).describe("分类名称"),
    slug: z.string().optional().describe("分类别名（URL友好，可选，不填则自动生成）"),
    description: z.string().optional().describe("分类描述（可选）"),
  }),
  execute: async ({ name, slug, description }) => {
    try {
      const finalSlug = slug || generateSlugFromText(name);
      const finalDescription = description || "";
      const result = await createCategory(name, finalSlug, finalDescription);

      if (result.error) {
        return {
          success: false,
          error: result.error,
          category: null,
        };
      }

      return {
        success: true,
        message: `分类「${name}」创建成功`,
        category: {
          id: result.data?.id,
          name: result.data?.name,
          slug: result.data?.slug,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "创建分类时发生未知错误",
        category: null,
      };
    }
  },
});

/**
 * 更新文章状态工具
 */
export const updateArticleStatusTool = tool({
  description: `更新文章的发布状态。
使用场景：
- 将草稿发布为正式文章
- 将文章设为草稿
- 归档文章`,
  inputSchema: z.object({
    articleId: z.number().describe("文章 ID"),
    status: z
      .enum(["draft", "published", "archived"])
      .describe("新状态：draft(草稿)、published(已发布)、archived(已归档)"),
  }),
  execute: async ({ articleId, status }) => {
    try {
      const supabase = await createClient();

      const { data: article, error } = await supabase
        .from("articles")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", articleId)
        .select("id, title, status")
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const statusText = {
        draft: "草稿",
        published: "已发布",
        archived: "已归档",
      };

      return {
        success: true,
        message: `文章状态已更新为「${statusText[status]}」`,
        article: {
          id: article?.id,
          title: article?.title,
          status: article?.status,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "更新文章状态时发生未知错误",
      };
    }
  },
});

/**
 * 获取当前时间工具
 */
export const getCurrentTimeTool = tool({
  description: `获取当前时间信息。
使用场景：
- 用户询问现在几点
- 需要知道当前日期
- 计算时间相关的问题`,
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long",
    };

    const formatter = new Intl.DateTimeFormat("zh-CN", options);
    const parts = formatter.formatToParts(now);

    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";

    return {
      success: true,
      timestamp: now.getTime(),
      iso: now.toISOString(),
      formatted: `${getPart("year")}年${getPart("month")}月${getPart("day")}日 ${getPart("weekday")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}`,
      date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
      time: `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`,
      weekday: getPart("weekday"),
      timezone: "Asia/Shanghai",
    };
  },
});

/**
 * 生成 Slug 工具
 */
export const generateSlugTool = tool({
  description: `生成 URL 友好的 slug。将中文或其他文本转换为适合 URL 使用的格式。
使用场景：
- 创建分类/标签时需要 slug
- 需要将标题转换为 URL 友好的格式`,
  inputSchema: z.object({
    text: z.string().min(1).describe("要转换的文本"),
  }),
  execute: async ({ text }) => {
    const slug = generateSlugFromText(text);
    return {
      success: true,
      original: text,
      slug,
    };
  },
});

/**
 * 全文搜索文章工具
 */
export const searchArticlesTool = tool({
  description: `通过关键词全文搜索文章内容。可以搜索文章标题、描述和正文。
使用场景：
- 用户想要查找包含特定内容的文章
- 进行知识库查询
- 查找相关文章`,
  inputSchema: z.object({
    keyword: z.string().min(1).describe("搜索关键词"),
    limit: z.number().optional().describe("返回结果数量限制，默认10条"),
  }),
  execute: async ({ keyword, limit = 10 }) => {
    try {
      const supabase = await createClient();

      // 使用 ilike 进行模糊搜索（标题、描述、内容）
      const { data: articles, error } = await supabase
        .from("articles")
        .select(
          `
          id,
          title,
          description,
          content,
          author,
          status,
          views,
          likes,
          created_at,
          categories(id, name, slug)
        `
        )
        .or(
          `title.ilike.%${keyword}%,description.ilike.%${keyword}%,content.ilike.%${keyword}%`
        )
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: error.message,
          articles: [],
          total: 0,
        };
      }

      // 提取匹配的片段
      const results = articles?.map((article) => {
        // 在内容中查找关键词周围的文本
        let matchedSnippet = "";
        const content = article.content || "";
        const keywordIndex = content.toLowerCase().indexOf(keyword.toLowerCase());
        
        if (keywordIndex !== -1) {
          const start = Math.max(0, keywordIndex - 50);
          const end = Math.min(content.length, keywordIndex + keyword.length + 100);
          matchedSnippet = (start > 0 ? "..." : "") + 
            content.substring(start, end) + 
            (end < content.length ? "..." : "");
        }

        return {
          id: article.id,
          title: article.title,
          description: article.description,
          matchedSnippet,
          author: article.author,
          status: article.status,
          views: article.views,
          likes: article.likes,
          createdAt: article.created_at,
          category: article.categories,
        };
      });

      return {
        success: true,
        keyword,
        articles: results,
        total: results?.length || 0,
        message: results?.length
          ? `找到 ${results.length} 篇包含「${keyword}」的文章`
          : `未找到包含「${keyword}」的文章`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "搜索文章时发生未知错误",
        articles: [],
        total: 0,
      };
    }
  },
});

/**
 * 辅助函数：生成 slug
 */
function generateSlugFromText(text: string): string {
  // 使用拼音或直接转换
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, "-") // 空格转连字符
    .replace(/[^\w\u4e00-\u9fa5-]/g, "") // 保留字母数字中文和连字符
    .replace(/--+/g, "-") // 多个连字符合并
    .replace(/^-|-$/g, ""); // 去除首尾连字符
}

