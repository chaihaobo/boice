import { tool } from "ai";
import { z } from "zod";

/**
 * 网页抓取工具
 * 使用 fetch 获取网页内容并提取关键信息
 */
export const scrapeTool = tool({
  description:
    "抓取指定网页的内容。可以获取网页的标题、描述和正文内容。适用于需要获取网页信息用于创建文章或了解内容的场景。",
  inputSchema: z.object({
    url: z.string().url().describe("要抓取的网页 URL"),
  }),
  execute: async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP 错误: ${response.status} ${response.statusText}`,
          content: null,
        };
      }

      const html = await response.text();

      // 提取标题
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // 提取 meta description
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
      );
      const description = descMatch ? descMatch[1].trim() : "";

      // 提取 og:description 作为备选
      const ogDescMatch = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
      );
      const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : "";

      // 移除 script 和 style 标签
      let cleanHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "");

      // 尝试提取文章主体内容
      let content = "";

      // 尝试从 article 标签提取
      const articleMatch = cleanHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        content = articleMatch[1];
      } else {
        // 尝试从 main 标签提取
        const mainMatch = cleanHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (mainMatch) {
          content = mainMatch[1];
        } else {
          // 尝试从 body 标签提取
          const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            content = bodyMatch[1];
          }
        }
      }

      // 移除所有 HTML 标签，保留文本
      const textContent = content
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 10000); // 限制长度

      // 提取所有段落
      const paragraphs: string[] = [];
      const pMatches = content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      for (const match of pMatches) {
        const text = match[1].replace(/<[^>]+>/g, "").trim();
        if (text.length > 20) {
          paragraphs.push(text);
        }
      }

      return {
        success: true,
        url,
        title,
        description: description || ogDescription,
        content: textContent,
        paragraphs: paragraphs.slice(0, 20), // 最多返回20个段落
        wordCount: textContent.length,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "抓取网页时发生未知错误",
        content: null,
      };
    }
  },
});




