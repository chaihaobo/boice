"use client"

import React, { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import TiptapEditor from "@/components/tiptap-editor"
import { cn } from "@/lib/utils"
import { ListTree, User, Github, Mail, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TocAnchor {
    id: string
    level: number
    textContent: string
    isActive: boolean
    isScrolledOver: boolean
    itemIndex: number
    pos: number
}

interface AboutContentProps {
    content: string | null
    locale: string
}

export default function AboutContent({ content, locale }: AboutContentProps) {
    const { t } = useTranslation()
    const [tocAnchors, setTocAnchors] = useState<TocAnchor[]>([])
    const [showToc, setShowToc] = useState(false)

    const handleTocUpdate = useCallback((anchors: TocAnchor[]) => {
        setTocAnchors(anchors)
    }, [])

    const scrollToHeading = useCallback((id: string) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }, [])

    if (!content) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 py-16">
                    <div className="text-center">
                        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h1 className="text-3xl font-bold mb-4">{t("about.title")}</h1>
                        <p className="text-muted-foreground">{t("about.no_content")}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 页面头部 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{t("about.title")}</h1>
                                <p className="text-muted-foreground">{t("about.subtitle")}</p>
                            </div>
                        </div>

                        {tocAnchors.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowToc(!showToc)}
                                className="flex items-center gap-2 lg:hidden"
                            >
                                <ListTree className="w-4 h-4" />
                                {t("article.toc")}
                            </Button>
                        )}
                    </div>

                    {/* 社交链接 */}
                    <div className="flex items-center gap-4 mt-6">
                        <a
                            href="https://github.com/chaihaobo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                        <span className="text-muted-foreground">•</span>
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            {locale === "zh" ? "全栈工程师" : "Full Stack Engineer"}
                        </span>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* 主内容区域 */}
                    <div className="flex-1 min-w-0">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <TiptapEditor
                                content={content}
                                editable={false}
                                className="border-none"
                                onTocUpdate={handleTocUpdate}
                            />
                        </div>
                    </div>

                    {/* TOC 侧边栏 - 桌面端固定显示 */}
                    {tocAnchors.length > 0 && (
                        <aside className={cn("w-64 shrink-0", "hidden lg:block")}>
                            <div className="sticky top-20">
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <ListTree className="w-4 h-4" />
                                        {t("article.toc")}
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
                                                    anchor.isScrolledOver &&
                                                        !anchor.isActive &&
                                                        "text-muted-foreground"
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
                                    {t("article.toc")}
                                </h4>
                                <Button variant="ghost" size="sm" onClick={() => setShowToc(false)}>
                                    ✕
                                </Button>
                            </div>
                            <nav className="space-y-1">
                                {tocAnchors.map((anchor) => (
                                    <button
                                        key={anchor.id}
                                        type="button"
                                        onClick={() => {
                                            scrollToHeading(anchor.id)
                                            setShowToc(false)
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
    )
}


