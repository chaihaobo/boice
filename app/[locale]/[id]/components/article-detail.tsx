"use client";

import React, {useEffect, useState, useCallback} from 'react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Calendar, Clock, User, Eye, Heart, ArrowLeft, ListTree} from 'lucide-react';
import {ArticleEntity} from "@/lib/entity/article";
import {useRouter} from "next/navigation";
import {useTranslation} from "react-i18next";
import TiptapEditor from "@/components/tiptap-editor";
import { cn } from "@/lib/utils";

// TOC Anchor 类型定义
interface TocAnchor {
    id: string
    level: number
    textContent: string
    isActive: boolean
    isScrolledOver: boolean
    itemIndex: number
    pos: number
}

interface ArticleDetailProps {
    article: ArticleEntity;
    locale: string;
}

export default function ArticleDetail({article}: ArticleDetailProps) {
    const router = useRouter();
    const {t} = useTranslation();
    const [liked, setLiked] = useState(false);
    const [tocAnchors, setTocAnchors] = useState<TocAnchor[]>([]);
    const [showToc, setShowToc] = useState(true);

    useEffect(() => {
        // 这里可以添加实际的点赞状态检查逻辑
        // 比如从 localStorage 或服务器获取用户的点赞状态
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
        // 使用 setTimeout 避免在 effect 中直接调用 setState
        setTimeout(() => {
            setLiked(likedArticles.includes(article.id));
        }, 0);
    }, [article.id]);

    const handleTocUpdate = useCallback((anchors: TocAnchor[]) => {
        setTocAnchors(anchors);
    }, []);

    const scrollToHeading = useCallback((id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

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
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 返回按钮 */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGoBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4"/>
                        {t('article.back', '返回')}
                    </Button>

                    {tocAnchors.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowToc(!showToc)}
                            className="flex items-center gap-2 lg:hidden"
                        >
                            <ListTree className="w-4 h-4"/>
                            {t('article.toc', '目录')}
                        </Button>
                    )}
                </div>

                <div className="flex gap-8">
                    {/* 主内容区域 */}
                    <div className="flex-1 min-w-0">
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
                        <div className="mb-8">
                            {article.content ? (
                                <TiptapEditor
                                    content={article.content}
                                    editable={false}
                                    className="border-none"
                                    onTocUpdate={handleTocUpdate}
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

                    {/* TOC 侧边栏 - 桌面端固定显示 */}
                    {tocAnchors.length > 0 && (
                        <aside className={cn(
                            "w-64 shrink-0",
                            "hidden lg:block",
                            !showToc && "lg:hidden"
                        )}>
                            <div className="sticky top-20">
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <ListTree className="w-4 h-4" />
                                        {t('article.toc', '目录')}
                                    </h4>
                                    <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                                        {tocAnchors.map((anchor) => (
                                            <button
                                                key={anchor.id}
                                                type="button"
                                                onClick={() => scrollToHeading(anchor.id)}
                                                className={cn(
                                                    "block w-full text-left text-sm py-1.5 px-2 rounded hover:bg-muted transition-colors truncate",
                                                    anchor.isActive && "bg-muted font-medium text-primary",
                                                    anchor.isScrolledOver && !anchor.isActive && "text-muted-foreground"
                                                )}
                                                style={{ paddingLeft: `${(anchor.level - 1) * 12 + 8}px` }}
                                            >
                                                {anchor.textContent || `Heading ${anchor.itemIndex}`}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                        </aside>
                    )}
                </div>

                {/* 移动端 TOC 抽屉 */}
                {tocAnchors.length > 0 && showToc && (
                    <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowToc(false)}>
                        <div className="absolute inset-0 bg-black/50" />
                        <div 
                            className="absolute right-0 top-0 h-full w-72 bg-background border-l p-4 overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <ListTree className="w-4 h-4" />
                                    {t('article.toc', '目录')}
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowToc(false)}
                                >
                                    ✕
                                </Button>
                            </div>
                            <nav className="space-y-1">
                                {tocAnchors.map((anchor) => (
                                    <button
                                        key={anchor.id}
                                        type="button"
                                        onClick={() => {
                                            scrollToHeading(anchor.id);
                                            setShowToc(false);
                                        }}
                                        className={cn(
                                            "block w-full text-left text-sm py-2 px-2 rounded hover:bg-muted transition-colors",
                                            anchor.isActive && "bg-muted font-medium text-primary",
                                            anchor.isScrolledOver && !anchor.isActive && "text-muted-foreground"
                                        )}
                                        style={{ paddingLeft: `${(anchor.level - 1) * 12 + 8}px` }}
                                    >
                                        {anchor.textContent || `Heading ${anchor.itemIndex}`}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}