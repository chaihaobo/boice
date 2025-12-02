'use client';

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem, NavigationMenuLink,
    NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import React from "react";
import Link from "next/link";
import {useApp} from "@/app/[locale]/app";

export const NavBar: React.FC = () => {
    const t = useApp().useT();


    return (

        <>
            <NavigationMenu className={""}>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/">{t('nav.home')}</Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/about">{t('nav.about')}</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </>
    )
}