import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkDashboardAccess } from "@/lib/actions/auth-actions";

/**
 * 生成随机封面图工具
 * 下载随机图片并上传到 Supabase Storage
 */

// Picsum 随机图片 API (免费，无需 API Key，稳定可靠)
const PICSUM_URL = "https://picsum.photos";

// 默认尺寸
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 630;

// Storage bucket 名称
const STORAGE_BUCKET = "article-images";

/**
 * 从 URL 下载图片并上传到 Supabase
 */
async function downloadAndUploadImage(imageSourceUrl: string): Promise<string> {
  const supabase = await createClient();

  // 下载图片
  const response = await fetch(imageSourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BlogAssistant/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status}`);
  }

  // 获取图片数据
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const filePath = `covers/${timestamp}-${randomStr}.jpg`;

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, uint8Array, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });

  if (error) {
    throw new Error(`上传图片失败: ${error.message}`);
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error("获取图片 URL 失败");
  }

  return urlData.publicUrl;
}

export const generateCoverImageTool = tool({
  description: `生成一张随机封面图并保存到服务器。无需任何参数，直接调用即可。
使用场景：
- 创建文章时需要封面图但用户没有提供
- 用户要求自动生成封面图`,
  inputSchema: z.object({}),
  execute: async () => {
    try {
      // 检查管理员权限
      const hasAccess = await checkDashboardAccess();
      if (!hasAccess) {
        return {
          success: false,
          error: "没有权限执行此操作，需要管理员权限",
          imageUrl: null,
        };
      }

      // 生成随机图片 URL
      const timestamp = Date.now();
      const seed = `${timestamp}-${Math.random().toString(36).substring(7)}`;
      const sourceUrl = `${PICSUM_URL}/seed/${seed}/${DEFAULT_WIDTH}/${DEFAULT_HEIGHT}`;

      // 下载并上传到 Supabase
      const imageUrl = await downloadAndUploadImage(sourceUrl);

      return {
        success: true,
        imageUrl,
        message: "已生成并保存封面图",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "生成封面图时发生未知错误",
        imageUrl: null,
      };
    }
  },
});

/**
 * 获取多个随机封面图供选择
 */
export const getMultipleCoverImagesTool = tool({
  description: `获取多张随机封面图供用户选择，图片会保存到服务器。默认返回4张不同的图片。
使用场景：
- 用户想要从多张图片中选择一张作为封面`,
  inputSchema: z.object({
    count: z.number().min(1).max(6).optional().describe("生成图片数量，1-6张，默认4张"),
  }),
  execute: async ({ count = 4 }) => {
    try {
      // 检查管理员权限
      const hasAccess = await checkDashboardAccess();
      if (!hasAccess) {
        return {
          success: false,
          error: "没有权限执行此操作，需要管理员权限",
          images: [],
        };
      }

      const images: Array<{
        url: string;
        index: number;
      }> = [];

      for (let i = 0; i < count; i++) {
        const timestamp = Date.now() + i * 100; // 确保每张图片的 seed 不同
        const seed = `${timestamp}-${Math.random().toString(36).substring(7)}`;
        const sourceUrl = `${PICSUM_URL}/seed/${seed}/${DEFAULT_WIDTH}/${DEFAULT_HEIGHT}`;

        // 下载并上传到 Supabase
        const imageUrl = await downloadAndUploadImage(sourceUrl);

        images.push({
          url: imageUrl,
          index: i + 1,
        });
      }

      return {
        success: true,
        images,
        count: images.length,
        message: `已生成并保存 ${images.length} 张封面图`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "生成封面图时发生未知错误",
        images: [],
      };
    }
  },
});

