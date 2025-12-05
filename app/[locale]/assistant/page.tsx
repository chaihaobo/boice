"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { useApp } from "@/app/[locale]/app";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Home, LogOut, Github, Menu, MessageSquare, PanelLeft } from "lucide-react";
import { useState } from "react";

export default function AssistantPage() {
    const { user, refresh } = useApp().useUser();
    const { locale, useT } = useApp();
    const t = useT();
    const supabaseClient = createClient();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogin = async () => {
        const callbackURL = `${window.location.origin}/auth/callback`;
        await supabaseClient.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: callbackURL,
            }
        });
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        await refresh();
    };

    return (
        <div className="flex h-screen bg-background">
            {/* 移动端侧边栏 */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-3 left-3 z-50"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            {t("assistant.welcome_title")}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-[calc(100%-60px)]">
                        <div className="flex-1 overflow-y-auto p-2">
                            <ThreadList />
                        </div>
                        <MobileSidebarFooter
                            user={user}
                            locale={locale}
                            t={t}
                            onLogin={handleLogin}
                            onLogout={handleLogout}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* 桌面端侧边栏 */}
            <div
                className={`hidden md:flex flex-col border-r bg-muted/30 transition-all duration-300 ${
                    sidebarOpen ? "w-64" : "w-0 overflow-hidden"
                }`}
            >
                {/* 侧边栏头部 */}
                <div className="flex items-center justify-between p-4 border-b">
                    <Link href={`/${locale}`} className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-semibold">Boice AI</span>
                    </Link>
                </div>

                {/* 对话列表 */}
                <div className="flex-1 overflow-y-auto p-2">
                    <ThreadList />
                </div>

                {/* 侧边栏底部 */}
                <div className="border-t p-3 space-y-3">
                    {/* 导航链接 */}
                    <Link
                        href={`/${locale}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                        <Home className="h-4 w-4" />
                        {t("nav.home")}
                    </Link>

                    {/* 主题和语言切换 */}
                    <div className="flex items-center gap-2 px-2">
                        <ThemeToggle />
                        <LanguageToggle />
                    </div>

                    {/* 用户区域 */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 px-2"
                                >
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage
                                            src={user.user_metadata['avatar_url']}
                                            alt={user.email}
                                        />
                                        <AvatarFallback>
                                            {user.email?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-sm">
                                        {user.user_metadata['name'] || user.email}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium truncate">
                                        {user.user_metadata['name'] || user.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {t("dashboard.logout")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={handleLogin}
                        >
                            <Github className="h-4 w-4 mr-2" />
                            {t("dashboard.login")}
                        </Button>
                    )}
                </div>
            </div>

            {/* 侧边栏切换按钮（桌面端） */}
            <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex fixed top-3 left-3 z-50"
                style={{ left: sidebarOpen ? '17rem' : '0.75rem' }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                <PanelLeft className="h-5 w-5" />
            </Button>

            {/* 主聊天区域 */}
            <div className="flex-1 flex flex-col h-full">
                <Thread showHeader={false} />
            </div>
        </div>
    );
}

// 移动端侧边栏底部组件
function MobileSidebarFooter({
    user,
    locale,
    t,
    onLogin,
    onLogout,
}: {
    user: any;
    locale: string;
    t: (key: string) => string;
    onLogin: () => void;
    onLogout: () => void;
}) {
    return (
        <div className="border-t p-3 space-y-3">
            <Link
                href={`/${locale}`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
                <Home className="h-4 w-4" />
                {t("nav.home")}
            </Link>

            <div className="flex items-center gap-2 px-2">
                <ThemeToggle />
                <LanguageToggle />
            </div>

            {user ? (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={user.user_metadata['avatar_url']}
                                alt={user.email}
                            />
                            <AvatarFallback>
                                {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user.user_metadata['name'] || user.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={onLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("dashboard.logout")}
                    </Button>
                </div>
            ) : (
                <Button size="sm" className="w-full" onClick={onLogin}>
                    <Github className="h-4 w-4 mr-2" />
                    {t("dashboard.login")}
                </Button>
            )}
        </div>
    );
}
