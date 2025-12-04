import { createDeepSeek } from "@ai-sdk/deepseek";
import { Experimental_Agent as Agent, stepCountIs } from "ai";
import {
  queryArticlesTool,
  scrapeTool,
  createArticleTool,
  getCategoriesListTool,
  getTagsListTool,
  generateCoverImageTool,
  getMultipleCoverImagesTool,
  createTagTool,
  createCategoryTool,
  updateArticleStatusTool,
  getCurrentTimeTool,
  generateSlugTool,
  searchArticlesTool,
} from "@/lib/tools";

export const maxDuration = 60;

// 创建 Agent 实例
const createBlogAssistantAgent = () => {
  const deepseek = createDeepSeek({
    baseURL: "https://api.deepseek.com/v1",
    apiKey: "sk-bce7e2117a3b4b82a2a35db3278b98a7",
  })("deepseek-chat");

  return new Agent({
    model: deepseek,
    system: `你是一个智能博客助手，拥有多种能力帮助用户管理博客文章。

## 你的能力：

### 1. 文章查询
- 使用 queryArticles 工具查询博客中已发布的文章
- 可以列出最近的文章、统计文章数量、根据文章内容回答问题

### 2. 网页抓取
- 使用 scrape 工具抓取任意网页的内容
- 可以获取网页的标题、描述、正文等信息
- 适用于用户想要参考某个网页内容创建文章的场景

### 3. 文章创建
- 使用 createArticle 工具创建新文章
- 使用 getCategoriesList 获取可用的分类列表
- 使用 getTagsList 获取可用的标签列表
- 创建文章时可以设置标题、内容、描述、分类、标签和状态

### 4. 封面图生成
- 使用 generateCoverImage 工具生成一张随机封面图（无需参数）
- 使用 getMultipleCoverImages 工具获取多张封面图供选择（可选指定数量1-6张）

### 5. 标签和分类管理
- 使用 createTag 创建新标签
- 使用 createCategory 创建新分类
- 使用 updateArticleStatus 更新文章状态（draft/published/archived）

### 6. 实用工具
- 使用 getCurrentTime 获取当前时间
- 使用 generateSlug 生成 URL 友好的 slug
- 使用 searchArticles 通过关键词全文搜索文章内容

## 工作流程示例：

### 根据网页创建文章：
1. 先使用 scrape 抓取用户提供的网页
2. 根据抓取的内容整理成文章格式
3. 询问用户是否需要选择分类和标签（可以先获取列表）
4. 如果用户没有提供封面图，使用 generateCoverImage 生成一张
5. 使用 createArticle 创建文章

### 查询文章：
1. 使用 queryArticles 获取文章列表
2. 根据用户问题分析和回答

## 使用规则：
1. 根据用户问题选择合适的工具
2. 创建文章默认为草稿状态，除非用户明确要求发布
3. 请用中文回答所有问题
4. 回答要简洁明了，重点突出
5. 创建文章前最好先确认用户的需求`,
    tools: {
      // 文章查询
      queryArticles: queryArticlesTool,
      // 网页抓取
      scrape: scrapeTool,
      // 文章创建
      createArticle: createArticleTool,
      getCategoriesList: getCategoriesListTool,
      getTagsList: getTagsListTool,
      // 封面图生成
      generateCoverImage: generateCoverImageTool,
      getMultipleCoverImages: getMultipleCoverImagesTool,
      // 标签和分类管理
      createTag: createTagTool,
      createCategory: createCategoryTool,
      updateArticleStatus: updateArticleStatusTool,
      // 实用工具
      getCurrentTime: getCurrentTimeTool,
      generateSlug: generateSlugTool,
      searchArticles: searchArticlesTool,
    },
    stopWhen: stepCountIs(10), // 允许最多10个步骤
  });
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  const agent = createBlogAssistantAgent();

  return agent.respond({
    messages,
  });
}
