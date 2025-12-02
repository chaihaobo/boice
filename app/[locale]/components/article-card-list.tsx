"use client";

import React, {use, useState} from 'react';
import {ArticleCard} from './article-card';
import {ArticleResult, getArticles} from "@/lib/actions/article-actions";
import {useQuery} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";

export interface ArticleCardListProps {
    initialArticles: Promise<ArticleResult>;
}

const ArticleCardList: React.FC<ArticleCardListProps> = ({initialArticles}) => {
    const initArticles = use(initialArticles);
    const [currentPage, setCurrentPage] = useState(1);
    const [likedArticles, setLikedArticles] = useState<Set<number>>(new Set());
    const {t} = useTranslation();

    const {
        data: articlesData,
        isLoading,
        isError
    } = useQuery<ArticleResult, Error>({
        queryKey: ['articles', currentPage],
        queryFn: () => getArticles(currentPage, 10)
    });

    // 使用实际数据或模拟数据
    const articles = articlesData?.articles || initArticles.articles;

    const handleLike = (articleId: number): void => {
        setLikedArticles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(articleId)) {
                newSet.delete(articleId);
            } else {
                newSet.add(articleId);
            }
            return newSet;
        });
    };

    if (isLoading && currentPage > 1) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            {t('article.title', '文章')}
                        </h1>
                        <p className="text-foreground">
                            {t('article.subtitle', '探索最新的技术趋势和开发实践')}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold text-red-600 mb-2">
                            {t('error.loading_failed', '加载失败')}
                        </h2>
                        <p className="text-gray-600">
                            {t('error.try_again_later', '请稍后重试')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!articles || articles.length === 0) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            {t('article.title', '文章')}
                        </h1>
                        <p className="text-foreground">
                            {t('article.subtitle', '探索最新的技术趋势和开发实践')}
                        </p>
                    </div>
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">
                            {t('article.no_articles', '暂无文章')}
                        </h2>
                        <p className="text-gray-500">
                            {t('article.coming_soon', '敬请期待')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        {t('article.title', '文章')}
                    </h1>
                    <p className="text-foreground">
                        {t('article.subtitle', '探索最新的技术趋势和开发实践')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            liked={likedArticles.has(article.id)}
                            onLike={handleLike}
                        />
                    ))}
                </div>

                {/* 分页控制 */}
                {articlesData && articlesData.total > 10 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            {t('pagination.previous', '上一页')}
                        </button>
                        <span className="px-4 py-2">
                            {t('pagination.page', '第 {{page}} 页', {page: currentPage})}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={articles.length < 10}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            {t('pagination.next', '下一页')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArticleCardList;