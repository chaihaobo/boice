"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useApp } from "@/app/[locale]/app"
import { getArticles, deleteArticle, deleteArticles, type Article } from "@/lib/actions/dashboard-actions"

export default function ArticlesPage() {
    const { locale, useT } = useApp()
    const t = useT()
    const queryClient = useQueryClient()
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false)

    const { data: result, isLoading } = useQuery({
        queryKey: ["dashboard-articles"],
        queryFn: getArticles,
    })

    const deleteMutation = useMutation({
        mutationFn: deleteArticle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboard-articles"] })
            setDeletingId(null)
        },
    })

    const batchDeleteMutation = useMutation({
        mutationFn: deleteArticles,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboard-articles"] })
            setSelectedIds([])
            setShowBatchDeleteDialog(false)
        },
    })

    const articles = result?.data || []

    const toggleSelectAll = () => {
        if (selectedIds.length === articles.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(articles.map((a: Article) => a.id))
        }
    }

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id]
        )
    }

    const isAllSelected = articles.length > 0 && selectedIds.length === articles.length
    const isPartialSelected = selectedIds.length > 0 && selectedIds.length < articles.length

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "published":
                return "default"
            case "draft":
                return "secondary"
            case "archived":
                return "outline"
            default:
                return "secondary"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.articles")}</h1>
                    <p className="text-muted-foreground mt-2">{t("dashboard.articles_page_description")}</p>
                </div>
                <Button asChild>
                    <Link href={`/${locale}/dashboard/articles/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("dashboard.new_article")}
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t("dashboard.article_list")}</CardTitle>
                            <CardDescription>{t("dashboard.article_list_description")}</CardDescription>
                        </div>
                        {selectedIds.length > 0 && (
                            <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t("dashboard.delete_selected")} ({selectedIds.length})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t("dashboard.delete_confirm_title")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t("dashboard.delete_batch_confirm_description", { count: selectedIds.length })}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => batchDeleteMutation.mutate(selectedIds)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={batchDeleteMutation.isPending}
                                        >
                                            {batchDeleteMutation.isPending ? t("dashboard.deleting") : t("dashboard.delete")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">{t("dashboard.no_articles")}</p>
                            <Button asChild className="mt-4">
                                <Link href={`/${locale}/dashboard/articles/new`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("dashboard.create_first_article")}
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={isAllSelected}
                                            ref={(el) => {
                                                if (el) {
                                                    (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isPartialSelected
                                                }
                                            }}
                                            onCheckedChange={toggleSelectAll}
                                            aria-label={t("dashboard.select_all")}
                                        />
                                    </TableHead>
                                    <TableHead>{t("dashboard.article_title")}</TableHead>
                                    <TableHead>{t("dashboard.category")}</TableHead>
                                    <TableHead>{t("dashboard.status")}</TableHead>
                                    <TableHead>{t("dashboard.views")}</TableHead>
                                    <TableHead>{t("dashboard.created_at")}</TableHead>
                                    <TableHead className="text-right">{t("dashboard.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {articles.map((article: Article) => (
                                    <TableRow key={article.id} data-state={selectedIds.includes(article.id) ? "selected" : undefined}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.includes(article.id)}
                                                onCheckedChange={() => toggleSelect(article.id)}
                                                aria-label={t("dashboard.select_article")}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                            {article.title}
                                        </TableCell>
                                        <TableCell>
                                            {article.category?.name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(article.status)}>
                                                {t(`dashboard.status_${article.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{article.views}</TableCell>
                                        <TableCell>
                                            {new Date(article.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/${locale}/${article.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/${locale}/dashboard/articles/${article.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("dashboard.delete_confirm_title")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("dashboard.delete_confirm_description")}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteMutation.mutate(article.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {t("dashboard.delete")}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

