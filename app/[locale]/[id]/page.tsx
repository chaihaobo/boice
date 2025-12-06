import {getArticleById} from "@/lib/actions/article-actions";
import {notFound} from "next/navigation";
import {Suspense} from "react";
import ArticleContent from "./components/article-content";
import ArticleSkeleton from "./components/article-skeleton";
import {Metadata} from "next";
import {cache} from "react";

type Props = {
    params: Promise<{ id: string; locale: string }>;
};

// 使用 cache 缓存文章查询，避免 generateMetadata 和页面组件重复查询
const getCachedArticle = cache(async (id: number) => {
    return getArticleById(id);
});

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {id} = await params;
    const articleId = parseInt(id);
    
    if (isNaN(articleId)) {
        return {title: "文章不存在"};
    }
    
    const article = await getCachedArticle(articleId);
    
    if (!article) {
        return {title: "文章不存在"};
    }
    
    const metadata: Metadata = {
        title: article.title,
        description: article.description || undefined,
        openGraph: {
            title: article.title,
            description: article.description || undefined,
            type: "article",
            authors: article.author ? [article.author] : undefined,
            publishedTime: article.publish_date || undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.description || undefined,
        },
    };
    
    // 如果文章有图片，添加到 Open Graph 和 Twitter 卡片
    if (article.image) {
        metadata.openGraph = {
            ...metadata.openGraph,
            images: [article.image],
        };
        metadata.twitter = {
            ...metadata.twitter,
            images: [article.image],
        };
    }
    
    return metadata;
}

export default async function ArticlePage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const {id, locale} = await params;
    const articleId = parseInt(id);
    
    if (isNaN(articleId)) {
        notFound();
    }
    
    // 使用缓存的查询，与 generateMetadata 共享结果
    const articlePromise = getCachedArticle(articleId);

    return (
        <Suspense fallback={<ArticleSkeleton />}>
            <ArticleContent articlePromise={articlePromise} locale={locale} />
        </Suspense>
    );
}