import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {ThemeProvider} from "@/components/theme-provider";
import '../globals.css'
import {NavBar} from "@/app/components/nav-bar";
import React from "react";
import TranslationsProvider from "@/components/TranslationsProvider";
import {initTranslations} from "@/app/i18n";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageToggle} from "@/components/language-toggle";

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
    const locale = (await params).locale;
    const {t, resources} = await initTranslations(locale, i18nNamespaces);


    return (

        <html lang="en" suppressHydrationWarning>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col`}>
        <TranslationsProvider
            namespaces={i18nNamespaces}
            locale={locale}
            resources={resources}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <header
                    className={"bg-background sticky top-0 z-50 w-full flex items-center justify-center  p-2 relative "}>
                    <NavBar/>
                    <div className={"flex px-1 gap-1 absolute right-1"}>
                        <ThemeToggle/>
                        <LanguageToggle/>
                    </div>
                </header>
                {children}
            </ThemeProvider>
        </TranslationsProvider>


        </body>
        </html>
    );
}
