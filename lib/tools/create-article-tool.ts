import { tool } from "ai";
import { z } from "zod";
import { createArticle, getCategories, getTags } from "@/lib/actions/dashboard-actions";

/**
 * 创建文章工具
 * 调用 dashboard-actions 中的 createArticle 函数
 */
export const createArticleTool = tool({
  description: `创建一篇新文章到博客系统。需要提供文章标题和内容，可选提供描述、分类、标签和状态。
使用场景：
- 用户要求根据抓取的网页内容创建文章
- 用户要求创建新文章
- 用户提供内容让你整理成文章`,
  inputSchema: z.object({
    title: z.string().min(1).max(200).describe("文章标题"),
    content: z.string().min(1).describe("文章正文内容（支持 Markdown 格式）"),
    description: z
      .string()
      .max(500)
      .optional()
      .describe("文章简短描述/摘要"),
    categoryId: z
      .number()
      .optional()
      .describe("分类 ID，可通过 getCategories 工具获取"),
    tagIds: z
      .array(z.number())
      .optional()
      .describe("标签 ID 数组，可通过 getTags 工具获取"),
    status: z
      .enum(["draft", "published"])
      .optional()
      .describe("文章状态：draft（草稿）或 published（已发布），默认为 draft"),
    image: z.string().url().optional().describe("文章封面图片 URL"),
  }),
  execute: async ({
    title,
    content,
    description = "",
    categoryId = null,
    tagIds = [],
    status = "draft",
    image = null,
  }) => {
    try {
      const result = await createArticle({
        title,
        content,
        description,
        category_id: categoryId,
        tag_ids: tagIds,
        status,
        image,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error,
          article: null,
        };
      }

      return {
        success: true,
        message: `文章「${title}」创建成功！状态：${status === "draft" ? "草稿" : "已发布"}`,
        article: {
          id: result.data?.id,
          title: result.data?.title,
          status: result.data?.status,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "创建文章时发生未知错误",
        article: null,
      };
    }
  },
});

/**
 * 获取分类列表工具
 * 用于获取可用的文章分类
 */
export const getCategoriesListTool = tool({
  description: "获取博客系统中所有可用的文章分类列表。在创建文章时可以使用返回的分类 ID。",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const result = await getCategories();

      if (result.error) {
        return {
          success: false,
          error: result.error,
          categories: [],
        };
      }

      return {
        success: true,
        categories: result.data?.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
        })),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "获取分类时发生未知错误",
        categories: [],
      };
    }
  },
});

/**
 * 获取标签列表工具
 * 用于获取可用的文章标签
 */
export const getTagsListTool = tool({
  description: "获取博客系统中所有可用的文章标签列表。在创建文章时可以使用返回的标签 ID。",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const result = await getTags();

      if (result.error) {
        return {
          success: false,
          error: result.error,
          tags: [],
        };
      }

      return {
        success: true,
        tags: result.data?.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
        })),
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "获取标签时发生未知错误",
        tags: [],
      };
    }
  },
});

