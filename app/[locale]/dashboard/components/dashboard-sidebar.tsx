"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    FileText,
    Tags,
    FolderOpen,
    LayoutDashboard,
    Home,
    User,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { useApp } from "@/app/[locale]/app"

export function DashboardSidebar() {
    const { locale, useT } = useApp()
    const t = useT()
    const pathname = usePathname()

    const menuItems = [
        {
            title: t("dashboard.overview"),
            url: `/${locale}/dashboard`,
            icon: LayoutDashboard,
        },
        {
            title: t("dashboard.articles"),
            url: `/${locale}/dashboard/articles`,
            icon: FileText,
        },
        {
            title: t("dashboard.tags"),
            url: `/${locale}/dashboard/tags`,
            icon: Tags,
        },
        {
            title: t("dashboard.categories"),
            url: `/${locale}/dashboard/categories`,
            icon: FolderOpen,
        },
        {
            title: t("dashboard.about_me"),
            url: `/${locale}/dashboard/about`,
            icon: User,
        },
    ]

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border h-14 flex justify-center">
                <div className="flex items-center gap-2 px-2">
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="font-semibold text-lg">{t("dashboard.title")}</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{t("dashboard.menu")}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        tooltip={item.title}
                                    >
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={t("nav.home")}>
                            <Link href={`/${locale}`}>
                                <Home />
                                <span>{t("nav.home")}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

