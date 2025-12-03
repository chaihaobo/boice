"use client"

import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "./components/dashboard-sidebar"
import { Separator } from "@/components/ui/separator"
import { useApp } from "@/app/[locale]/app"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Home, LogOut } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { useUser, locale, useT } = useApp()
    const { user, refresh } = useUser()
    const router = useRouter()
    const t = useT()
    const supabaseClient = createClient()

    useEffect(() => {
        if (!user) {
            router.push(`/${locale}`)
        }
    }, [user, router, locale])

    const handleLogout = async () => {
        const { error } = await supabaseClient.auth.signOut()
        console.log("logout result:", error)
        await refresh()
        router.push(`/${locale}`)
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>{t("dashboard.redirecting")}</p>
            </div>
        )
    }

    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-40">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarImage src={user.user_metadata['avatar_url']} alt={user.email} />
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/${locale}`}>
                                        <Home className="h-4 w-4 mr-2" />
                                        {t("nav.home")}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {t("dashboard.logout")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

