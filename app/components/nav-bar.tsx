'use client';

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem, NavigationMenuLink,
    NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import React from "react";
import Link from "next/link";
import {useTranslation} from "react-i18next";
import {ThemeToggle} from "@/components/theme-toggle";

export const NavBar: React.FC = () => {
    const {t} = useTranslation();

    return (

        <>
            <NavigationMenu className={""}>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/">{t('nav.home')}</Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/">{t('nav.about')}</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </>
    )
}