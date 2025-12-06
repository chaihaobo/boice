"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/app/[locale]/app";

export default function AccessDeniedPage() {
    const router = useRouter();
    const { locale, useT } = useApp();
    const t = useT();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">
                        {t("access_denied.title", "访问被拒绝")}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {t("access_denied.description", "您没有权限访问管理后台。如果您认为这是一个错误，请联系管理员。")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Button
                        variant="default"
                        className="w-full"
                        onClick={() => router.push(`/${locale}`)}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        {t("access_denied.go_home", "返回首页")}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t("access_denied.go_back", "返回上一页")}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}





