"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Tags, FolderOpen, Eye } from "lucide-react"
import { useApp } from "@/app/[locale]/app"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
    articles: number
    tags: number
    categories: number
    views: number
}

async function fetchDashboardStats(): Promise<DashboardStats> {
    const supabase = createClient()
    
    const [articlesResult, tagsResult, categoriesResult, viewsResult] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("tags").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("views"),
    ])

    const totalViews = viewsResult.data?.reduce((sum, article) => sum + (article.views || 0), 0) || 0

    return {
        articles: articlesResult.count || 0,
        tags: tagsResult.count || 0,
        categories: categoriesResult.count || 0,
        views: totalViews,
    }
}

export default function DashboardPage() {
    const { useT } = useApp()
    const t = useT()

    const { data: stats, isLoading } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: fetchDashboardStats,
    })

    const statCards = [
        {
            title: t("dashboard.total_articles"),
            value: stats?.articles || 0,
            icon: FileText,
            description: t("dashboard.articles_description"),
        },
        {
            title: t("dashboard.total_tags"),
            value: stats?.tags || 0,
            icon: Tags,
            description: t("dashboard.tags_description"),
        },
        {
            title: t("dashboard.total_categories"),
            value: stats?.categories || 0,
            icon: FolderOpen,
            description: t("dashboard.categories_description"),
        },
        {
            title: t("dashboard.total_views"),
            value: stats?.views || 0,
            icon: Eye,
            description: t("dashboard.views_description"),
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.welcome")}</h1>
                <p className="text-muted-foreground mt-2">{t("dashboard.welcome_description")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <div className="text-2xl font-bold">{card.value}</div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}


