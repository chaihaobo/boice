"use client";
import {useRouter} from 'next/navigation';
import {usePathname} from 'next/navigation';
import {useTranslation} from 'react-i18next';
import i18nConfig from '@/i18nConfig';
import {Button} from "@/components/ui/button";
import {Languages} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export const LanguageToggle: React.FC = () => {
    const {i18n} = useTranslation();
    const currentLocale = i18n.language;
    const router = useRouter();
    const currentPathname = usePathname();

    const handleChange = (newLocale: string) => {
        // set cookie for next-i18n-router
        const days = 30;
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = date.toUTCString();
        document.cookie = `NEXT_LOCALE=${newLocale};expires=${expires};path=/`;

        // redirect to the new locale path
        if (
            currentLocale === i18nConfig.defaultLocale
        ) {
            router.push('/' + newLocale + currentPathname);
        } else {
            router.push(
                currentPathname.replace(`/${currentLocale}`, `/${newLocale}`)
            );
        }

        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem 
                    onClick={() => handleChange("zh")}
                    className={currentLocale === "zh" ? "bg-accent" : ""}
                >
                    中文
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleChange("en")}
                    className={currentLocale === "en" ? "bg-accent" : ""}
                >
                    English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};