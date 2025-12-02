import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {ThemeProvider} from "@/components/theme-provider";
import '../globals.css'
import {NavBar} from "@/app/[locale]/components/nav-bar";
import React from "react";
import TranslationsProvider from "@/components/translations-provider";
import {initTranslations} from "@/app/i18n";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageToggle} from "@/components/language-toggle";
import {Header} from "@/app/[locale]/components/header";
import {AppProvider} from "@/app/[locale]/app";
import {createClient} from "@/lib/supabase/server";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Home",
};

const i18nNamespaces = ['common'];

export default async function RootLayout({
                                             children,
                                             params,
                                         }: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    console.log("RootLayout")
    const locale = (await params).locale;
    const {t, resources} = await initTranslations(locale);
    const supabaseClient = await createClient();
    const currentUser = await supabaseClient.auth.getUser();

    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col w-full h-full`}>
        <AppProvider locale={locale} i18nResource={resources} authUser={currentUser.data.user}>
            {children}
        </AppProvider>
        </body>
        </html>
    );
}
