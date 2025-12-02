import {getArticleById} from "@/lib/actions/article-actions";
import {notFound} from "next/navigation";
import {Suspense} from "react";
import ArticleDetail from "./components/article-detail";

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
    
    const article = await getArticleById(articleId);
    
    if (!article) {
        notFound();
    }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ArticleDetail article={article} locale={locale} />
        </Suspense>
    );
}