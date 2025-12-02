"use client";

import React, {useEffect, useState} from 'react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Calendar, Clock, User, Eye, Heart, ArrowLeft} from 'lucide-react';
import {ArticleEntity} from "@/lib/entity/article";
import {useRouter} from "next/navigation";
import {useTranslation} from "react-i18next";

interface ArticleDetailProps {
    article: ArticleEntity;
    locale: string;
}

export default function ArticleDetail({article}: ArticleDetailProps) {
    const router = useRouter();
    const {t} = useTranslation();
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        // 这里可以添加实际的点赞状态检查逻辑
        // 比如从 localStorage 或服务器获取用户的点赞状态
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
        // 使用 setTimeout 避免在 effect 中直接调用 setState
        setTimeout(() => {
            setLiked(likedArticles.includes(article.id));
        }, 0);
    }, [article.id]);

    const formatDate = (dateString: string) => {
        // 使用ISO格式确保服务器和客户端一致
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const handleLike = () => {
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
        if (liked) {
            const newLiked = likedArticles.filter((id: number) => id !== article.id);
            localStorage.setItem('likedArticles', JSON.stringify(newLiked));
            setLiked(false);
        } else {
            likedArticles.push(article.id);
            localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
            setLiked(true);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* 返回按钮 */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGoBack}
                    className="mb-6 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4"/>
                    {t('article.back', '返回')}
                </Button>

                {/* 文章头部 */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags?.map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-sm">
                                {tag.name}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        {article.title}
                    </h1>

                    <p className="text-xl text-muted-foreground mb-6">
                        {article.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-slate-600 mb-6">
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4"/>
                            <span>{article.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4"/>
                            <span>{formatDate(article.publish_date)}</span>
                        </div>
                        {article.read_time && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4"/>
                                <span>{article.read_time}</span>
                            </div>
                        )}
                        {article.categories && (
                            <div className="flex items-center gap-1">
                                <Badge variant="secondary">
                                    {article.categories.name}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                        <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4"/>
                            <span>{article.views || 0} {t('article.views', '阅读')}</span>
                        </div>
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                            <Heart
                                className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`}
                            />
                            <span>{article.likes || 0} {t('article.likes', '点赞')}</span>
                        </button>
                    </div>
                </div>

                {/* 文章图片 */}
                {article.image && (
                    <div className="mb-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-96 object-cover rounded-lg"
                        />
                    </div>
                )}

                {/* 文章内容 */}
                <div className="prose prose-lg max-w-none mb-8">
                    {article.content ? (
                        <div 
                            className="text-foreground leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{__html: article.content}}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                {t('article.no_content', '暂无内容')}
                            </p>
                        </div>
                    )}
                </div>

                {/* 底部操作 */}
                <div className="flex items-center justify-between py-6 border-t border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGoBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4"/>
                        {t('article.back', '返回')}
                    </Button>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLike}
                            className={`${liked ? 'border-red-500 text-red-500' : ''}`}
                        >
                            <Heart
                                className={`w-4 h-4 mr-1 ${liked ? 'fill-red-500' : ''}`}
                            />
                            {liked ? t('article.unlike', '取消点赞') : t('article.like', '点赞')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}