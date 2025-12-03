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
import { getTags, createTag, updateTag, deleteTag, type Tag } from "@/lib/actions/dashboard-actions"

export default function TagsPage() {
    const { useT } = useApp()
    const t = useT()
    const queryClient = useQueryClient()

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingTag, setEditingTag] = useState<Tag | null>(null)
    const [newTagName, setNewTagName] = useState("")
    const [newTagSlug, setNewTagSlug] = useState("")

    const { data: result, isLoading } = useQuery({
        queryKey: ["tags"],
        queryFn: getTags,
    })

    const createMutation = useMutation({
        mutationFn: ({ name, slug }: { name: string; slug: string }) => createTag(name, slug),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] })
            setIsCreateOpen(false)
            setNewTagName("")
            setNewTagSlug("")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, name, slug }: { id: number; name: string; slug: string }) =>
            updateTag(id, name, slug),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] })
            setEditingTag(null)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] })
        },
    })

    const tags = result?.data || []

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const slug = newTagSlug || newTagName.toLowerCase().replace(/\s+/g, "-")
        createMutation.mutate({ name: newTagName, slug })
    }

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (editingTag) {
            updateMutation.mutate({
                id: editingTag.id,
                name: editingTag.name,
                slug: editingTag.slug,
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.tags")}</h1>
                    <p className="text-muted-foreground mt-2">{t("dashboard.tags_page_description")}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t("dashboard.new_tag")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateSubmit}>
                            <DialogHeader>
                                <DialogTitle>{t("dashboard.create_tag")}</DialogTitle>
                                <DialogDescription>{t("dashboard.create_tag_description")}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t("dashboard.tag_name")}</Label>
                                    <Input
                                        id="name"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        placeholder={t("dashboard.tag_name_placeholder")}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">{t("dashboard.tag_slug")}</Label>
                                    <Input
                                        id="slug"
                                        value={newTagSlug}
                                        onChange={(e) => setNewTagSlug(e.target.value)}
                                        placeholder={t("dashboard.tag_slug_placeholder")}
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
                    <CardTitle>{t("dashboard.tag_list")}</CardTitle>
                    <CardDescription>{t("dashboard.tag_list_description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : tags.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">{t("dashboard.no_tags")}</p>
                            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("dashboard.create_first_tag")}
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("dashboard.tag_name")}</TableHead>
                                    <TableHead>{t("dashboard.tag_slug")}</TableHead>
                                    <TableHead>{t("dashboard.created_at")}</TableHead>
                                    <TableHead className="text-right">{t("dashboard.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tags.map((tag: Tag) => (
                                    <TableRow key={tag.id}>
                                        <TableCell>
                                            {editingTag?.id === tag.id ? (
                                                <Input
                                                    value={editingTag.name}
                                                    onChange={(e) =>
                                                        setEditingTag({ ...editingTag, name: e.target.value })
                                                    }
                                                    className="h-8"
                                                />
                                            ) : (
                                                <span className="font-medium">{tag.name}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingTag?.id === tag.id ? (
                                                <Input
                                                    value={editingTag.slug}
                                                    onChange={(e) =>
                                                        setEditingTag({ ...editingTag, slug: e.target.value })
                                                    }
                                                    className="h-8"
                                                />
                                            ) : (
                                                <code className="text-sm bg-muted px-1 py-0.5 rounded">
                                                    {tag.slug}
                                                </code>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(tag.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {editingTag?.id === tag.id ? (
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
                                                            onClick={() => setEditingTag(null)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setEditingTag(tag)}
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
                                                                        {t("dashboard.delete_tag_confirm_description")}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>
                                                                        {t("dashboard.cancel")}
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteMutation.mutate(tag.id)}
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


