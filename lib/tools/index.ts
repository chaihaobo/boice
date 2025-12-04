/**
 * AI Agent 工具集合
 * 导出所有可用的工具供 Agent 使用
 */

// 文章查询工具
export { queryArticlesTool } from "./article-tools";

// 网页抓取工具
export { scrapeTool } from "./scrape-tool";

// 文章创建工具
export {
  createArticleTool,
  getCategoriesListTool,
  getTagsListTool,
} from "./create-article-tool";

// 封面图生成工具
export {
  generateCoverImageTool,
  getMultipleCoverImagesTool,
} from "./cover-image-tool";

// 基础工具
export {
  createTagTool,
  createCategoryTool,
  updateArticleStatusTool,
  getCurrentTimeTool,
  generateSlugTool,
  searchArticlesTool,
} from "./basic-tools";

