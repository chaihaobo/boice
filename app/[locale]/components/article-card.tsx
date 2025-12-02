"use client";

import React from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Calendar, Clock, User, Eye, Heart} from 'lucide-react';
import {ArticleEntity} from "@/lib/entity/article";
import {useRouter} from "next/navigation";
import {useTranslation} from "react-i18next";

interface ArticleCardProps {
    article: ArticleEntity;
    liked: boolean;
    onLike: (articleId: number) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({article, liked, onLike}) => {
    const router = useRouter();
    const {t} = useTranslation();

    const handleReadMore = () => {
        // 获取当前语言环境
        const currentPath = window.location.pathname;
        const localeMatch = currentPath.match(/^\/([^\/]+)/);
        const currentLocale = localeMatch ? localeMatch[1] : 'zh';
        router.push(`/${currentLocale}/${article.id}`);
    };

    const formatDate = (dateString: string) => {
        // 使用ISO格式确保服务器和客户端一致
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative h-48 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={article.image || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop"}
                                alt={article.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                {article.categories && (
                    <Badge className="absolute top-4 left-4 bg-blue-600">
                        {article.categories.name}
                    </Badge>
                )}
            </div>

            <CardHeader>
                <CardTitle 
                    className="text-xl hover:text-blue-600 cursor-pointer transition-colors"
                    onClick={handleReadMore}
                >
                    {article.title}
                </CardTitle>
                <CardDescription className="text-sm mt-2">
                    {article.description}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags?.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.name}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600">
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
                </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4"/>
                        <span>{article.views || 0}</span>
                    </div>
                    <button
                        onClick={() => onLike(article.id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                        <Heart
                            className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`}
                        />
                        <span>{article.likes || 0}</span>
                    </button>
                </div>
                <Button variant="outline" size="sm" onClick={handleReadMore}>
                    {t('article.read_more', '阅读更多')}
                </Button>
            </CardFooter>
        </Card>
    );
};