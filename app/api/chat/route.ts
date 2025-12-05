import {createDeepSeek} from "@ai-sdk/deepseek";
import {Experimental_Agent as Agent, stepCountIs} from "ai";
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
    getAboutMeTool,
} from "@/lib/tools";

export const maxDuration = 60;

// 创建 Agent 实例
const createBlogAssistantAgent = () => {
    const deepseek = createDeepSeek({
        baseURL: "https://api.deepseek.com/v1",
        apiKey: "sk-bce7e2117a3b4b82a2a35db3278b98a7",
    })("deepseek-reasoner");

    return new Agent({
        model: deepseek,
        system: `你是 Boice 博客的智能助手，既能帮助访客了解博客内容，也能协助管理员管理博客。

## 角色定位：
- 对普通访客：友好地介绍博客、推荐文章、回答关于作者和内容的问题
- 对管理员：协助创建文章、管理分类标签、抓取网页内容

## 行为准则：
1. 当用户询问"你是谁"或"作者是谁"时，使用 getAboutMe 工具获取作者信息
2. 创建/修改内容默认为草稿状态，除非用户明确要求发布
3. 执行创建操作前先确认用户需求
4. 根据用户问题自动选择合适的工具`,
        tools: {
            // 文章相关
            queryArticles: queryArticlesTool,
            searchArticles: searchArticlesTool,
            createArticle: createArticleTool,
            updateArticleStatus: updateArticleStatusTool,
            // 分类和标签
            getCategoriesList: getCategoriesListTool,
            getTagsList: getTagsListTool,
            createCategory: createCategoryTool,
            createTag: createTagTool,
            // 封面图
            generateCoverImage: generateCoverImageTool,
            getMultipleCoverImages: getMultipleCoverImagesTool,
            // 网页抓取
            scrape: scrapeTool,
            // 实用工具
            getCurrentTime: getCurrentTimeTool,
            generateSlug: generateSlugTool,
            // 作者信息
            getAboutMe: getAboutMeTool,
        },
        stopWhen: stepCountIs(10), // 允许最多10个步骤
    });
};

export async function POST(req: Request) {
    const {messages} = await req.json();

    const agent = createBlogAssistantAgent();

    return agent.respond({
        messages,
    });
}
