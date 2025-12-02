"use client";
import {NavBar} from "@/app/[locale]/components/nav-bar";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageToggle} from "@/components/language-toggle";
import React from "react";
import {Button} from "@/components/ui/button";
import {Github} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import {useApp} from "@/app/[locale]/app";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Header: React.FC = () => {
    const {user, refresh} = useApp().useUser();
    const supabaseClient = createClient()
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


    return (
        <>
            <header
                className={"bg-background sticky top-0 z-50 w-full flex items-center justify-center  p-2 relative "}>
                <NavBar/>
                <div className={"flex px-1 gap-1 absolute right-1"}>
                    <ThemeToggle/>
                    <LanguageToggle/>
                    {
                        user ?
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar>
                                        <AvatarImage src={user.user_metadata['avatar_url']} alt={user.email}/>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            : <Button onClick={handleLogin}><Github/>Login</Button>
                    }

                </div>
            </header>
        </>
    )

}