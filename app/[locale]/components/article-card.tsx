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
            <div className="relative h-40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={article.image || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop"}
                    alt={article.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {article.categories && (
                    <Badge className="absolute top-3 left-3 bg-blue-600 text-xs">
                        {article.categories.name}
                    </Badge>
                )}
            </div>

            <CardHeader className="h-24 py-3 px-4">
                <CardTitle 
                    className="text-base hover:text-blue-600 cursor-pointer transition-colors line-clamp-2"
                    onClick={handleReadMore}
                >
                    {article.title}
                </CardTitle>
                <CardDescription className="text-xs mt-1 line-clamp-2">
                    {article.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="h-16 py-2 px-4">
                <div className="flex flex-wrap gap-1.5 mb-2 overflow-hidden max-h-5">
                    {article.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs py-0 px-1.5">
                            {tag.name}
                        </Badge>
                    ))}
                    {article.tags && article.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs py-0 px-1.5">
                            +{article.tags.length - 3}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                        <User className="w-3 h-3"/>
                        <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3"/>
                        <span>{formatDate(article.publish_date)}</span>
                    </div>
                    {article.read_time && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3"/>
                            <span>{article.read_time}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t py-2.5 px-4">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5"/>
                        <span>{article.views || 0}</span>
                    </div>
                    <button
                        onClick={() => onLike(article.id)}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                        <Heart
                            className={`w-3.5 h-3.5 ${liked ? 'fill-red-500 text-red-500' : ''}`}
                        />
                        <span>{article.likes || 0}</span>
                    </button>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" onClick={handleReadMore}>
                    {t('article.read_more', '阅读更多')}
                </Button>
            </CardFooter>
        </Card>
    );
};