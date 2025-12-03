"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/app/[locale]/app"
import {
    createArticle,
    getCategories,
    getTags,
    type ArticleFormData,
    type Category,
    type Tag,
} from "@/lib/actions/dashboard-actions"
import { TiptapEditor } from "@/components/tiptap-editor"
import { CoverImageUpload } from "@/components/cover-image-upload"

export default function NewArticlePage() {
    const { locale, useT } = useApp()
    const t = useT()
    const router = useRouter()

    const [formData, setFormData] = useState<ArticleFormData>({
        title: "",
        description: "",
        content: "",
        category_id: null,
        status: "draft",
        tag_ids: [],
        image: null,
    })

    const { data: categoriesResult } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    })

    const { data: tagsResult } = useQuery({
        queryKey: ["tags"],
        queryFn: getTags,
    })

    const categories = categoriesResult?.data || []
    const tags = tagsResult?.data || []

    const createMutation = useMutation({
        mutationFn: createArticle,
        onSuccess: (result) => {
            if (!result.error) {
                router.push(`/${locale}/dashboard/articles`)
            }
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        createMutation.mutate(formData)
    }

    const toggleTag = (tagId: number) => {
        setFormData((prev) => ({
            ...prev,
            tag_ids: prev.tag_ids.includes(tagId)
                ? prev.tag_ids.filter((id) => id !== tagId)
                : [...prev.tag_ids, tagId],
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${locale}/dashboard/articles`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.new_article")}</h1>
                    <p className="text-muted-foreground mt-2">{t("dashboard.new_article_description")}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("dashboard.article_content")}</CardTitle>
                                <CardDescription>{t("dashboard.article_content_description")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">{t("dashboard.article_title")}</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t("dashboard.article_title_placeholder")}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">{t("dashboard.article_description")}</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={t("dashboard.article_description_placeholder")}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="content">{t("dashboard.article_body")}</Label>
                                    <TiptapEditor
                                        content={formData.content}
                                        onChange={(content) => setFormData({ ...formData, content })}
                                        placeholder={t("dashboard.article_body_placeholder")}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("dashboard.cover_image")}</CardTitle>
                                <CardDescription>{t("dashboard.cover_image_description")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CoverImageUpload
                                    value={formData.image}
                                    onChange={(image) => setFormData({ ...formData, image })}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("dashboard.publish_settings")}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">{t("dashboard.status")}</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: "draft" | "published" | "archived") =>
                                            setFormData({ ...formData, status: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">{t("dashboard.status_draft")}</SelectItem>
                                            <SelectItem value="published">{t("dashboard.status_published")}</SelectItem>
                                            <SelectItem value="archived">{t("dashboard.status_archived")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">{t("dashboard.category")}</Label>
                                    <Select
                                        value={formData.category_id?.toString() || "none"}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                category_id: value === "none" ? null : parseInt(value),
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("dashboard.select_category")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t("dashboard.no_category")}</SelectItem>
                                            {categories.map((category: Category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t("dashboard.tags")}</CardTitle>
                                <CardDescription>{t("dashboard.select_tags")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag: Tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant={formData.tag_ids.includes(tag.id) ? "default" : "outline"}
                                            className="cursor-pointer"
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                        </Badge>
                                    ))}
                                    {tags.length === 0 && (
                                        <p className="text-sm text-muted-foreground">{t("dashboard.no_tags")}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={createMutation.isPending}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {createMutation.isPending ? t("dashboard.saving") : t("dashboard.save_article")}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}

