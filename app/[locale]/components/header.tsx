"use client";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageToggle} from "@/components/language-toggle";
import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Github, LayoutDashboard, Menu, Home, Info, LogOut, X, MessageSquare} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {useApp} from "@/app/[locale]/app";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import Link from "next/link";
import {usePathname} from "next/navigation";
import {checkDashboardAccess} from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";

export const Header: React.FC = () => {
    const {user, refresh} = useApp().useUser();
    const {locale, useT} = useApp();
    const t = useT();
    const supabaseClient = createClient()
    const pathname = usePathname();
    
    // 检查用户是否有 dashboard 权限
    const [hasDashboardAccess, setHasDashboardAccess] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    useEffect(() => {
        if (user) {
            checkDashboardAccess().then(setHasDashboardAccess);
        } else {
            setHasDashboardAccess(false);
        }
    }, [user]);
    
    // Hide header on dashboard and assistant pages
    const isDashboard = pathname.includes('/dashboard');
    const isAssistant = pathname.includes('/assistant');
    if (isDashboard || isAssistant) {
        return null;
    }

    const handleLogin = async () => {
        const callbackURL = `${window.location.origin}/auth/callback`
        const {data, error} = await supabaseClient.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: callbackURL,
            }
        })
        console.log("auth result:", callbackURL, data, error)
    }

    const handleLogout = async () => {
        const {error} = await supabaseClient.auth.signOut()
        console.log("logout result:", error)
        await refresh()
    }

    const navItems = [
        { href: `/${locale}`, label: t('nav.home'), icon: Home },
        { href: `/${locale}/about`, label: t('nav.about'), icon: Info },
        { href: `/${locale}/assistant`, label: t('nav.assistant'), icon: MessageSquare },
    ];

    const isActive = (href: string) => {
        if (href === `/${locale}`) {
            return pathname === `/${locale}` || pathname === '/';
        }
        return pathname.startsWith(href);
    };

    return (
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b">
            <div className="max-w-7xl mx-auto flex h-14 items-center px-4 md:px-6 w-full">
                {/* Logo / Brand */}
                <Link href={`/${locale}`} className="flex items-center gap-2 mr-4">
                    <span className="font-bold text-lg hidden sm:inline-block">Boice</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive(item.href)
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right side actions */}
                <div className="flex items-center gap-1 ml-auto">
                    {/* Desktop: Theme & Language */}
                    <div className="hidden sm:flex items-center gap-1">
                        <ThemeToggle />
                        <LanguageToggle />
                    </div>

                    {/* User section */}
                    {user ? (
                        <>
                            {/* Desktop: Dashboard button */}
                            {hasDashboardAccess && (
                                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                                    <Link href={`/${locale}/dashboard`}>
                                        <LayoutDashboard className="h-4 w-4 mr-1" />
                                        {t("dashboard.title")}
                                    </Link>
                                </Button>
                            )}
                            
                            {/* User dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.user_metadata['avatar_url']} alt={user.email} />
                                            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <div className="px-2 py-1.5">
                                        <p className="text-sm font-medium truncate">{user.user_metadata['name'] || user.email}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <DropdownMenuSeparator />
                                    {hasDashboardAccess && (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/${locale}/dashboard`}>
                                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                                {t("dashboard.title")}
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="h-4 w-4 mr-2" />
                                        {t("dashboard.logout")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Button size="sm" onClick={handleLogin} className="hidden sm:flex">
                            <Github className="h-4 w-4 mr-1" />
                            {t("dashboard.login")}
                        </Button>
                    )}

                    {/* Mobile menu button */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-4 mt-6">
                                {/* Mobile Navigation */}
                                <nav className="flex flex-col gap-1">
                                    {navItems.map((item) => (
                                        <SheetClose asChild key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                    isActive(item.href)
                                                        ? "bg-accent text-accent-foreground"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                )}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                {item.label}
                                            </Link>
                                        </SheetClose>
                                    ))}
                                    {hasDashboardAccess && (
                                        <SheetClose asChild>
                                            <Link
                                                href={`/${locale}/dashboard`}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                    "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                )}
                                            >
                                                <LayoutDashboard className="h-4 w-4" />
                                                {t("dashboard.title")}
                                            </Link>
                                        </SheetClose>
                                    )}
                                </nav>

                                {/* Mobile: Theme & Language */}
                                <div className="flex items-center gap-2 px-3">
                                    <ThemeToggle />
                                    <LanguageToggle />
                                </div>

                                {/* Mobile: Login/Logout */}
                                {user ? (
                                    <div className="px-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.user_metadata['avatar_url']} alt={user.email} />
                                                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.user_metadata['name'] || user.email}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                                            <LogOut className="h-4 w-4 mr-2" />
                                            {t("dashboard.logout")}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="px-3">
                                        <Button size="sm" className="w-full" onClick={handleLogin}>
                                            <Github className="h-4 w-4 mr-2" />
                                            {t("dashboard.login")}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}