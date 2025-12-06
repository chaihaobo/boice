"use client";

import { use } from "react";
import ArticleDetail from "./article-detail";
import { ArticleEntity } from "@/lib/entity/article";
import { notFound } from "next/navigation";

interface ArticleContentProps {
    articlePromise: Promise<ArticleEntity | null>;
    locale: string;
}

export default function ArticleContent({ articlePromise, locale }: ArticleContentProps) {
    const article = use(articlePromise);
    
    if (!article) {
        notFound();
    }

    return <ArticleDetail article={article} locale={locale} />;
}





