"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useApp } from "@/app/[locale]/app"
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    type Category,
} from "@/lib/actions/dashboard-actions"

export default function CategoriesPage() {
    const { useT } = useApp()
    const t = useT()
    const queryClient = useQueryClient()

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategorySlug, setNewCategorySlug] = useState("")
    const [newCategoryDescription, setNewCategoryDescription] = useState("")

    const { data: result, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    })

    const createMutation = useMutation({
        mutationFn: ({ name, slug, description }: { name: string; slug: string; description: string }) =>
            createCategory(name, slug, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            setIsCreateOpen(false)
            setNewCategoryName("")
            setNewCategorySlug("")
            setNewCategoryDescription("")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            name,
            slug,
            description,
        }: {
            id: number
            name: string
            slug: string
            description: string
        }) => updateCategory(id, name, slug, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            setEditingCategory(null)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        },
    })

    const categories = result?.data || []

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const slug = newCategorySlug || newCategoryName.toLowerCase().replace(/\s+/g, "-")
        createMutation.mutate({ name: newCategoryName, slug, description: newCategoryDescription })
    }

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingCategory) {
            updateMutation.mutate({
                id: editingCategory.id,
                name: editingCategory.name,
                slug: editingCategory.slug,
                description: editingCategory.description || "",
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.categories")}</h1>
                    <p className="text-muted-foreground mt-2">{t("dashboard.categories_page_description")}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t("dashboard.new_category")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateSubmit}>
                            <DialogHeader>
                                <DialogTitle>{t("dashboard.create_category")}</DialogTitle>
                                <DialogDescription>{t("dashboard.create_category_description")}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("dashboard.category_name")}</Label>
                                    <Input
                                        id="name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder={t("dashboard.category_name_placeholder")}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">{t("dashboard.category_slug")}</Label>
                                    <Input
                                        id="slug"
                                        value={newCategorySlug}
                                        onChange={(e) => setNewCategorySlug(e.target.value)}
                                        placeholder={t("dashboard.category_slug_placeholder")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">{t("dashboard.category_description")}</Label>
                                    <Textarea
                                        id="description"
                                        value={newCategoryDescription}
                                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                                        placeholder={t("dashboard.category_description_placeholder")}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending ? t("dashboard.creating") : t("dashboard.create")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("dashboard.category_list")}</CardTitle>
                    <CardDescription>{t("dashboard.category_list_description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">{t("dashboard.no_categories")}</p>
                            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("dashboard.create_first_category")}
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("dashboard.category_name")}</TableHead>
                                    <TableHead>{t("dashboard.category_slug")}</TableHead>
                                    <TableHead>{t("dashboard.category_description")}</TableHead>
                                    <TableHead>{t("dashboard.created_at")}</TableHead>
                                    <TableHead className="text-right">{t("dashboard.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category: Category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            {editingCategory?.id === category.id ? (
                                                <Input
                                                    value={editingCategory.name}
                                                    onChange={(e) =>
                                                        setEditingCategory({ ...editingCategory, name: e.target.value })
                                                    }
                                                    className="h-8"
                                                />
                                            ) : (
                                                <span className="font-medium">{category.name}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingCategory?.id === category.id ? (
                                                <Input
                                                    value={editingCategory.slug}
                                                    onChange={(e) =>
                                                        setEditingCategory({ ...editingCategory, slug: e.target.value })
                                                    }
                                                    className="h-8"
                                                />
                                            ) : (
                                                <code className="text-sm bg-muted px-1 py-0.5 rounded">
                                                    {category.slug}
                                                </code>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {editingCategory?.id === category.id ? (
                                                <Input
                                                    value={editingCategory.description || ""}
                                                    onChange={(e) =>
                                                        setEditingCategory({
                                                            ...editingCategory,
                                                            description: e.target.value,
                                                        })
                                                    }
                                                    className="h-8"
                                                />
                                            ) : (
                                                category.description || "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(category.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingCategory?.id === category.id ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={handleUpdateSubmit}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setEditingCategory(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setEditingCategory(category)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        {t("dashboard.delete_confirm_title")}
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {t("dashboard.delete_category_confirm_description")}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>
                                                                        {t("dashboard.cancel")}
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteMutation.mutate(category.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        {t("dashboard.delete")}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
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


