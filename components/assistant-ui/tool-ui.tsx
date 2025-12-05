"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  FileTextIcon,
  GlobeIcon,
  PlusCircleIcon,
  FolderIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  ExternalLinkIcon,
  ImageIcon,
  ImagesIcon,
  ClockIcon,
  LinkIcon,
  SearchIcon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react";

// 文章类型定义
type Article = {
  id: number;
  title: string;
  description?: string;
  author?: string;
  publishDate?: string;
  status: string;
  views: number;
  likes: number;
  createdAt: string;
  category?: { id: number; name: string; slug: string };
};

type QueryArticlesResult = {
  success: boolean;
  error?: string;
  articles: Article[];
  total: number;
};

// 查询文章工具 UI
export const QueryArticlesToolUI = makeAssistantToolUI<
  Record<string, never>,
  QueryArticlesResult
>({
  toolName: "queryArticles",
  render: ({ result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <FileTextIcon className="h-4 w-4 text-blue-500" />
          <span>查询文章</span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在查询文章...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>找到 {result.total} 篇文章</span>
                </div>
                {result.articles.length > 0 && (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {result.articles.slice(0, 5).map((article) => (
                      <div
                        key={article.id}
                        className="rounded bg-muted/50 px-2 py-1 text-xs"
                      >
                        <div className="font-medium">{article.title}</div>
                        {article.category && (
                          <span className="text-muted-foreground">
                            {article.category.name}
                          </span>
                        )}
                      </div>
                    ))}
                    {result.articles.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ...还有 {result.articles.length - 5} 篇文章
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "查询失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 网页抓取结果类型
type ScrapeResult = {
  success: boolean;
  error?: string;
  url?: string;
  title?: string;
  description?: string;
  content?: string | null;
  paragraphs?: string[];
  wordCount?: number;
};

// 网页抓取工具 UI
export const ScrapeToolUI = makeAssistantToolUI<{ url: string }, ScrapeResult>({
  toolName: "scrape",
  render: ({ args, result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <GlobeIcon className="h-4 w-4 text-purple-500" />
          <span>抓取网页</span>
        </div>

        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLinkIcon className="h-3 w-3" />
          <a
            href={args.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:underline"
          >
            {args.url}
          </a>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在抓取网页内容...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>抓取成功</span>
                </div>
                {result.title && (
                  <div className="text-sm font-medium">{result.title}</div>
                )}
                {result.description && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {result.description}
                  </div>
                )}
                {result.wordCount && (
                  <div className="text-xs text-muted-foreground">
                    内容长度: {result.wordCount} 字符
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "抓取失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 创建文章结果类型
type CreateArticleResult = {
  success: boolean;
  error?: string;
  message?: string;
  article?: {
    id: number;
    title: string;
    status: string;
  } | null;
};

type CreateArticleArgs = {
  title: string;
  content: string;
  description?: string;
  categoryId?: number;
  tagIds?: number[];
  status?: "draft" | "published";
  image?: string;
};

// 创建文章工具 UI
export const CreateArticleToolUI = makeAssistantToolUI<
  CreateArticleArgs,
  CreateArticleResult
>({
  toolName: "createArticle",
  render: ({ args, result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <PlusCircleIcon className="h-4 w-4 text-green-500" />
          <span>创建文章</span>
        </div>

        <div className="mb-2 text-sm">
          <span className="font-medium">{args.title}</span>
          {args.status && (
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
              {args.status === "draft" ? "草稿" : "已发布"}
            </span>
          )}
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在创建文章...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>{result.message || "文章创建成功"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "创建失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 分类列表结果类型
type GetCategoriesResult = {
  success: boolean;
  error?: string;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
  }>;
};

// 获取分类工具 UI
export const GetCategoriesToolUI = makeAssistantToolUI<
  Record<string, never>,
  GetCategoriesResult
>({
  toolName: "getCategoriesList",
  render: ({ result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <FolderIcon className="h-4 w-4 text-orange-500" />
          <span>获取分类列表</span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在获取分类...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>找到 {result.categories?.length || 0} 个分类</span>
                </div>
                {result.categories && result.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "获取失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 标签列表结果类型
type GetTagsResult = {
  success: boolean;
  error?: string;
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
};

// 获取标签工具 UI
export const GetTagsToolUI = makeAssistantToolUI<
  Record<string, never>,
  GetTagsResult
>({
  toolName: "getTagsList",
  render: ({ result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <TagIcon className="h-4 w-4 text-cyan-500" />
          <span>获取标签列表</span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在获取标签...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>找到 {result.tags?.length || 0} 个标签</span>
                </div>
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded bg-cyan-100 px-2 py-0.5 text-xs text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "获取失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 生成封面图结果类型
type GenerateCoverImageResult = {
  success: boolean;
  error?: string;
  imageUrl?: string | null;
  message?: string;
};

// 生成封面图工具 UI
export const GenerateCoverImageToolUI = makeAssistantToolUI<
  Record<string, never>,
  GenerateCoverImageResult
>({
  toolName: "generateCoverImage",
  render: ({ result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-pink-500" />
          <span>生成封面图</span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在生成封面图...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success && result.imageUrl ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{result.message || "封面图生成成功"}</span>
                </div>
                <div className="relative overflow-hidden rounded-md">
                  <img
                    src={result.imageUrl}
                    alt="生成的封面图"
                    className="h-32 w-full object-cover"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "生成失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 获取多张封面图结果类型
type GetMultipleCoverImagesResult = {
  success: boolean;
  error?: string;
  images?: Array<{
    url: string;
    index: number;
  }>;
  count?: number;
  message?: string;
};

type GetMultipleCoverImagesArgs = {
  count?: number;
};

// 获取多张封面图工具 UI
export const GetMultipleCoverImagesToolUI = makeAssistantToolUI<
  GetMultipleCoverImagesArgs,
  GetMultipleCoverImagesResult
>({
  toolName: "getMultipleCoverImages",
  render: ({ args, result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ImagesIcon className="h-4 w-4 text-violet-500" />
          <span>生成多张封面图</span>
          {args.count && (
            <span className="text-xs text-muted-foreground">
              ({args.count}张)
            </span>
          )}
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在生成封面图...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success && result.images && result.images.length > 0 ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{result.message || `已生成 ${result.count} 张封面图`}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {result.images.map((image) => (
                    <div key={image.index} className="relative overflow-hidden rounded-md">
                      <img
                        src={image.url}
                        alt={`封面图 ${image.index}`}
                        className="h-20 w-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-xs text-white">
                        #{image.index}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "生成失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 创建标签结果类型
type CreateTagResult = {
  success: boolean;
  error?: string;
  message?: string;
  tag?: { id: number; name: string; slug: string } | null;
};

// 创建标签工具 UI
export const CreateTagToolUI = makeAssistantToolUI<
  { name: string; slug?: string },
  CreateTagResult
>({
  toolName: "createTag",
  render: ({ args, result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <TagIcon className="h-4 w-4 text-cyan-500" />
          <span>创建标签</span>
          <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
            {args.name}
          </span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在创建标签...</span>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-1 text-sm">
            {result.success ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{result.message}</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-red-500">{result.error}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 创建分类结果类型
type CreateCategoryResult = {
  success: boolean;
  error?: string;
  message?: string;
  category?: { id: number; name: string; slug: string } | null;
};

// 创建分类工具 UI
export const CreateCategoryToolUI = makeAssistantToolUI<
  { name: string; slug?: string; description?: string },
  CreateCategoryResult
>({
  toolName: "createCategory",
  render: ({ args, result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <FolderIcon className="h-4 w-4 text-orange-500" />
          <span>创建分类</span>
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            {args.name}
          </span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在创建分类...</span>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-1 text-sm">
            {result.success ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{result.message}</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-red-500">{result.error}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 更新文章状态结果类型
type UpdateArticleStatusResult = {
  success: boolean;
  error?: string;
  message?: string;
  article?: { id: number; title: string; status: string };
};

// 更新文章状态工具 UI
export const UpdateArticleStatusToolUI = makeAssistantToolUI<
  { articleId: number; status: string },
  UpdateArticleStatusResult
>({
  toolName: "updateArticleStatus",
  render: ({ args, result, status }) => {
    const statusText: Record<string, string> = {
      draft: "草稿",
      published: "已发布",
      archived: "已归档",
    };
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <RefreshCwIcon className="h-4 w-4 text-blue-500" />
          <span>更新文章状态</span>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            → {statusText[args.status] || args.status}
          </span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在更新状态...</span>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-1 text-sm">
            {result.success ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{result.message}</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span className="text-red-500">{result.error}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 获取当前时间结果类型
type GetCurrentTimeResult = {
  success: boolean;
  timestamp: number;
  iso: string;
  formatted: string;
  date: string;
  time: string;
  weekday: string;
  timezone: string;
};

// 获取当前时间工具 UI
export const GetCurrentTimeToolUI = makeAssistantToolUI<
  Record<string, never>,
  GetCurrentTimeResult
>({
  toolName: "getCurrentTime",
  render: ({ result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <ClockIcon className="h-4 w-4 text-indigo-500" />
          <span>获取当前时间</span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>获取中...</span>
          </div>
        )}

        {result && (
          <div className="space-y-1 text-sm">
            <div className="font-medium">{result.formatted}</div>
            <div className="text-xs text-muted-foreground">
              时区: {result.timezone}
            </div>
          </div>
        )}
      </div>
    );
  },
});

// 生成 Slug 结果类型
type GenerateSlugResult = {
  success: boolean;
  original: string;
  slug: string;
};

// 生成 Slug 工具 UI
export const GenerateSlugToolUI = makeAssistantToolUI<
  { text: string },
  GenerateSlugResult
>({
  toolName: "generateSlug",
  render: ({ result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <LinkIcon className="h-4 w-4 text-emerald-500" />
          <span>生成 Slug</span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>生成中...</span>
          </div>
        )}

        {result && (
          <div className="space-y-1 text-sm">
            <div className="text-muted-foreground">原文: {result.original}</div>
            <div className="font-mono rounded bg-muted px-2 py-1">
              {result.slug}
            </div>
          </div>
        )}
      </div>
    );
  },
});

// 搜索文章结果类型
type SearchArticlesResult = {
  success: boolean;
  error?: string;
  keyword: string;
  articles: Array<{
    id: number;
    title: string;
    description?: string;
    matchedSnippet?: string;
    category?: { name: string };
  }>;
  total: number;
  message: string;
};

// 搜索文章工具 UI
export const SearchArticlesToolUI = makeAssistantToolUI<
  { keyword: string; limit?: number },
  SearchArticlesResult
>({
  toolName: "searchArticles",
  render: ({ args, result, status }) => {
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <SearchIcon className="h-4 w-4 text-amber-500" />
          <span>搜索文章</span>
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {args.keyword}
          </span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在搜索...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{result.message}</span>
                </div>
                {result.articles.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {result.articles.slice(0, 5).map((article) => (
                      <div
                        key={article.id}
                        className="rounded bg-muted/50 px-2 py-1 text-xs"
                      >
                        <div className="font-medium">{article.title}</div>
                        {article.matchedSnippet && (
                          <div className="text-muted-foreground line-clamp-2">
                            {article.matchedSnippet}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});

// 获取作者信息结果类型
type GetAboutMeResult = {
  success: boolean;
  error?: string;
  message?: string;
  aboutMe?: {
    content: string;
    locale: string;
    updatedAt: string;
  } | null;
};

// 获取作者信息工具 UI
export const GetAboutMeToolUI = makeAssistantToolUI<
  { locale?: "zh" | "en" },
  GetAboutMeResult
>({
  toolName: "getAboutMe",
  render: ({ args, result, status }) => {
    const localeText = args.locale === "en" ? "英文" : "中文";
    return (
      <div className="my-2 rounded-lg border bg-card p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <UserIcon className="h-4 w-4 text-teal-500" />
          <span>获取作者信息</span>
          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
            {localeText}
          </span>
        </div>

        {status.type === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>正在获取作者信息...</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            {result.success ? (
              <>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>{result.message}</span>
                </div>
                {result.aboutMe?.content && (
                  <div className="max-h-32 overflow-y-auto rounded bg-muted/50 px-3 py-2 text-sm">
                    <div className="line-clamp-4 whitespace-pre-wrap">
                      {result.aboutMe.content.substring(0, 200)}
                      {result.aboutMe.content.length > 200 && "..."}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-500">
                <XCircleIcon className="h-4 w-4" />
                <span>{result.error || "获取失败"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
});
