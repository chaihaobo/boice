"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Article {
    id: number
    user_id: string
    category_id: number | null
    title: string
    description: string | null
    content: string | null
    author: string
    publish_date: string
    read_time: string | null
    views: number
    likes: number
    image: string | null
    status: "draft" | "published" | "archived"
    created_at: string
    updated_at: string
    category?: Category | null
    tags?: Tag[]
}

export interface Tag {
    id: number
    name: string
    slug: string
    created_at: string
    updated_at: string
}

export interface Category {
    id: number
    name: string
    slug: string
    description: string | null
    created_at: string
    updated_at: string
}

export interface ArticleFormData {
    title: string
    description: string
    content: string
    category_id: number | null
    status: "draft" | "published" | "archived"
    tag_ids: number[]
    image: string | null
}

// Articles
export async function getArticles() {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data, error } = await supabase
        .from("articles")
        .select(`
            *,
            category:categories(id, name, slug)
        `)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })

    if (error) {
        return { error: error.message, data: null }
    }

    return { data, error: null }
}

export async function getArticleById(id: number) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data: article, error: articleError } = await supabase
        .from("articles")
        .select(`
            *,
            category:categories(id, name, slug)
        `)
        .eq("id", id)
        .eq("user_id", user.user.id)
        .single()

    if (articleError) {
        return { error: articleError.message, data: null }
    }

    // Get article tags
    const { data: articleTags } = await supabase
        .from("article_tags")
        .select("tag_id, tags(id, name, slug, created_at, updated_at)")
        .eq("article_id", id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = articleTags?.map((at: any) => at.tags).filter(Boolean) || []

    return { data: { ...article, tags }, error: null }
}

export async function createArticle(formData: ArticleFormData) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data: article, error: articleError } = await supabase
        .from("articles")
        .insert({
            user_id: user.user.id,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            category_id: formData.category_id,
            status: formData.status,
            image: formData.image,
            author: user.user.user_metadata?.name || user.user.email || "Unknown",
        })
        .select()
        .single()

    if (articleError) {
        return { error: articleError.message, data: null }
    }

    // Add tags
    if (formData.tag_ids.length > 0) {
        const tagInserts = formData.tag_ids.map((tagId) => ({
            article_id: article.id,
            tag_id: tagId,
        }))

        await supabase.from("article_tags").insert(tagInserts)
    }

    revalidatePath("/dashboard/articles")
    return { data: article, error: null }
}

export async function updateArticle(id: number, formData: ArticleFormData) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data: article, error: articleError } = await supabase
        .from("articles")
        .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            category_id: formData.category_id,
            status: formData.status,
            image: formData.image,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.user.id)
        .select()
        .single()

    if (articleError) {
        return { error: articleError.message, data: null }
    }

    // Update tags - delete existing and add new
    await supabase.from("article_tags").delete().eq("article_id", id)

    if (formData.tag_ids.length > 0) {
        const tagInserts = formData.tag_ids.map((tagId) => ({
            article_id: id,
            tag_id: tagId,
        }))

        await supabase.from("article_tags").insert(tagInserts)
    }

    revalidatePath("/dashboard/articles")
    revalidatePath(`/dashboard/articles/${id}/edit`)
    return { data: article, error: null }
}

export async function deleteArticle(id: number) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized" }
    }

    // Delete article tags first
    await supabase.from("article_tags").delete().eq("article_id", id)

    const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", id)
        .eq("user_id", user.user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/articles")
    return { error: null }
}

export async function deleteArticles(ids: number[]) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized" }
    }

    if (ids.length === 0) {
        return { error: "No articles selected" }
    }

    // Delete article tags first
    await supabase.from("article_tags").delete().in("article_id", ids)

    const { error } = await supabase
        .from("articles")
        .delete()
        .in("id", ids)
        .eq("user_id", user.user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/articles")
    return { error: null, deletedCount: ids.length }
}

// Tags
export async function getTags() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true })

    if (error) {
        return { error: error.message, data: null }
    }

    return { data, error: null }
}

export async function createTag(name: string, slug: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data, error } = await supabase
        .from("tags")
        .insert({ name, slug })
        .select()
        .single()

    if (error) {
        return { error: error.message, data: null }
    }

    revalidatePath("/dashboard/tags")
    return { data, error: null }
}

export async function updateTag(id: number, name: string, slug: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data, error } = await supabase
        .from("tags")
        .update({ name, slug, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { error: error.message, data: null }
    }

    revalidatePath("/dashboard/tags")
    return { data, error: null }
}

export async function deleteTag(id: number) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized" }
    }

    // Delete article_tags associations first
    await supabase.from("article_tags").delete().eq("tag_id", id)

    const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/tags")
    return { error: null }
}

// Categories
export async function getCategories() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })

    if (error) {
        return { error: error.message, data: null }
    }

    return { data, error: null }
}

export async function createCategory(name: string, slug: string, description: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data, error } = await supabase
        .from("categories")
        .insert({ name, slug, description })
        .select()
        .single()

    if (error) {
        return { error: error.message, data: null }
    }

    revalidatePath("/dashboard/categories")
    return { data, error: null }
}

export async function updateCategory(id: number, name: string, slug: string, description: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data, error } = await supabase
        .from("categories")
        .update({ name, slug, description, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { error: error.message, data: null }
    }

    revalidatePath("/dashboard/categories")
    return { data, error: null }
}

export async function deleteCategory(id: number) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized" }
    }

    // Set articles with this category to null
    await supabase
        .from("articles")
        .update({ category_id: null })
        .eq("category_id", id)

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/categories")
    return { error: null }
}

// About Me
export interface AboutMe {
    id: number
    locale: string
    content: string
    created_at: string
    updated_at: string
}

export async function getAboutMe(locale: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("about_me")
        .select("*")
        .eq("locale", locale)
        .maybeSingle()

    if (error) {
        return { error: error.message, data: null }
    }

    return { data, error: null }
}

export async function getAllAboutMe() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("about_me")
        .select("*")
        .order("locale", { ascending: true })

    if (error) {
        return { error: error.message, data: null }
    }

    return { data, error: null }
}

export async function upsertAboutMe(locale: string, content: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized", data: null }
    }

    const { data, error } = await supabase
        .from("about_me")
        .upsert(
            {
                locale,
                content,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "locale",
            }
        )
        .select()
        .single()

    if (error) {
        return { error: error.message, data: null }
    }

    revalidatePath("/dashboard/about")
    revalidatePath(`/${locale}/about`)
    return { data, error: null }
}

export async function deleteAboutMe(locale: string) {
    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()
    
    if (!user.user) {
        return { error: "Unauthorized" }
    }

    const { error } = await supabase
        .from("about_me")
        .delete()
        .eq("locale", locale)

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/dashboard/about")
    revalidatePath(`/${locale}/about`)
    return { error: null }
}

