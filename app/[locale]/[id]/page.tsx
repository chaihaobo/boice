import {getArticleById} from "@/lib/actions/article-actions";
import {notFound} from "next/navigation";
import {Suspense} from "react";
import ArticleContent from "./components/article-content";
import ArticleSkeleton from "./components/article-skeleton";

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
    
    // 不 await，直接传递 Promise
    const articlePromise = getArticleById(articleId);

    return (
        <Suspense fallback={<ArticleSkeleton />}>
            <ArticleContent articlePromise={articlePromise} locale={locale} />
        </Suspense>
    );
}