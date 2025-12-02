import ArticleCardList from "@/app/[locale]/components/article-card-list";
import {Suspense} from "react";
import {Skeleton} from "@/components/ui/skeleton";
import {getArticles} from "@/lib/actions/article-actions";

export default async function Home({params}: { params: Promise<{ locale: string }> }) {
    const initArticles = getArticles(1, 10);

    return (
        <>
            <Suspense
                fallback={
                    <div className="space-y-6">
                        <div className="flex items-baseline justify-between">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </div>
                }
            >
                <ArticleCardList initialArticles={initArticles}/>
            </Suspense>
        </>
    );
}
