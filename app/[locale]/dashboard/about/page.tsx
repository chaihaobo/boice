"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useApp } from "@/app/[locale]/app"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllAboutMe, upsertAboutMe, AboutMe } from "@/lib/actions/dashboard-actions"
import { Save, Loader2, User } from "lucide-react"
import { TiptapEditor } from "@/components/tiptap-editor"

export default function AboutPage() {
    const { useT } = useApp()
    const t = useT()
    
    const [activeTab, setActiveTab] = useState("zh")
    const [zhContent, setZhContent] = useState("")
    const [enContent, setEnContent] = useState("")
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [aboutMeData, setAboutMeData] = useState<AboutMe[]>([])

    const loadData = useCallback(async () => {
        setLoading(true)
        const { data } = await getAllAboutMe()
        if (data) {
            setAboutMeData(data)
            const zhData = data.find((item: AboutMe) => item.locale === "zh")
            const enData = data.find((item: AboutMe) => item.locale === "en")
            if (zhData) setZhContent(zhData.content)
            if (enData) setEnContent(enData.content)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleSave = async (locale: string) => {
        setSaving(true)
        const content = locale === "zh" ? zhContent : enContent
        const { error } = await upsertAboutMe(locale, content)
        if (!error) {
            await loadData()
        }
        setSaving(false)
    }

    const handleContentChange = (locale: string, content: string) => {
        if (locale === "zh") {
            setZhContent(content)
        } else {
            setEnContent(content)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <User className="h-6 w-6" />
                    {t("dashboard.about_me")}
                </h1>
                <p className="text-muted-foreground">
                    {t("dashboard.about_me_description")}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="zh">
                        🇨🇳 {t("dashboard.chinese")}
                        {aboutMeData.find(item => item.locale === "zh") && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="en">
                        🇺🇸 {t("dashboard.english")}
                        {aboutMeData.find(item => item.locale === "en") && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="zh" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.about_me_content")}</CardTitle>
                            <CardDescription>
                                {t("dashboard.about_me_content_description_zh")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="min-h-[400px] border rounded-md">
                                <TiptapEditor
                                    content={zhContent}
                                    onChange={(content) => handleContentChange("zh", content)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSave("zh")} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {t("dashboard.save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="en" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("dashboard.about_me_content")}</CardTitle>
                            <CardDescription>
                                {t("dashboard.about_me_content_description_en")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="min-h-[400px] border rounded-md">
                                <TiptapEditor
                                    content={enContent}
                                    onChange={(content) => handleContentChange("en", content)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => handleSave("en")} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {t("dashboard.save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}






