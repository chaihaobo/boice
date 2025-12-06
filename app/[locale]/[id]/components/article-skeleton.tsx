"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 返回按钮骨架 */}
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-9 w-20" />
                </div>

                <div className="flex gap-8">
                    {/* 主内容区域骨架 */}
                    <div className="flex-1 min-w-0">
                        {/* 文章头部骨架 */}
                        <div className="mb-8">
                            {/* 标签骨架 */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-6 w-14" />
                            </div>

                            {/* 标题骨架 */}
                            <Skeleton className="h-12 w-3/4 mb-4" />

                            {/* 描述骨架 */}
                            <Skeleton className="h-6 w-full mb-2" />
                            <Skeleton className="h-6 w-2/3 mb-6" />

                            {/* 元信息骨架 */}
                            <div className="flex items-center gap-6 mb-6">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-28" />
                                <Skeleton className="h-5 w-20" />
                            </div>

                            {/* 统计信息骨架 */}
                            <div className="flex items-center gap-4 mb-6">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                        </div>

                        {/* 封面图骨架 */}
                        <Skeleton className="w-full h-96 rounded-lg mb-8" />

                        {/* 文章内容骨架 */}
                        <div className="space-y-4 mb-8">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-4/5" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                            <Skeleton className="h-6 w-2/3" />
                        </div>

                        {/* 底部操作骨架 */}
                        <div className="flex items-center justify-between py-6 border-t border-border">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>

                    {/* TOC 侧边栏骨架 - 桌面端 */}
                    <aside className="w-64 shrink-0 hidden lg:block">
                        <div className="sticky top-20">
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <Skeleton className="h-5 w-24 mb-3" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6 ml-3" />
                                    <Skeleton className="h-4 w-4/5 ml-3" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4 ml-3" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}






