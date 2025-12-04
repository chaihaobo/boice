"use client";
import React, {useState} from "react";
import {ThemeProvider} from "@/components/theme-provider";
import {Header} from "@/app/[locale]/components/header";
import TranslationsProvider from "@/components/translations-provider";
import {Resource, type TFunction} from "i18next";
import {useTranslation} from "react-i18next";
import {useTheme, UseThemeProps} from "next-themes";
import {User} from "@supabase/auth-js";
import {createClient} from "@/lib/supabase/client";
import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import Script from "next/script";
import {AssistantRuntimeProvider} from "@assistant-ui/react";
import {useChatRuntime, AssistantChatTransport} from "@assistant-ui/react-ai-sdk";
import {AssistantModal} from "@/components/assistant-ui/assistant-modal";
import {
    QueryArticlesToolUI,
    ScrapeToolUI,
    CreateArticleToolUI,
    GetCategoriesToolUI,
    GetTagsToolUI,
    GenerateCoverImageToolUI,
    GetMultipleCoverImagesToolUI,
    CreateTagToolUI,
    CreateCategoryToolUI,
    UpdateArticleStatusToolUI,
    GetCurrentTimeToolUI,
    GenerateSlugToolUI,
    SearchArticlesToolUI,
} from "@/components/assistant-ui/tool-ui";


export interface App {
    locale: string;
    useT: () => TFunction
    useTheme: () => UseThemeProps;
    useUser: () => {
        user: User | null,
        refresh: () => Promise<void>
    };
}


export interface AppProviderProps extends React.PropsWithChildren {
    locale: string,
    i18nResource: Resource,
    authUser: User | null
}

const AppContext = React.createContext<App | null>(null)

function createApp(authUser: User | null, locale: string) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [user, setUser] = useState<User | null>(authUser)
    const app: App = {
        locale: locale,
        useT: () => useTranslation().t,
        useTheme: () => useTheme(),
        useUser: () => {
            return {
                user: user,
                refresh: async () => {
                    const supabaseClient = await createClient();
                    const {data: {user: authUser}} = await supabaseClient.auth.getUser()
                    setUser(authUser)
                }
            }
        }

    }
    return app;
}

export const AppProvider: React.FC<AppProviderProps> = ({locale, i18nResource, children, authUser}) => {
    const app = createApp(authUser, locale);
    const runtime = useChatRuntime({
        transport: new AssistantChatTransport({
            api: "/api/chat",
        }),
    });
    return <>
        <AppContext.Provider value={app}>
            <TranslationsProvider
                namespaces={['common']}
                locale={locale}
                resources={i18nResource}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange>
                    <QueryClientProvider client={new QueryClient()}>
                        <Header/>
                        {children}
                        <AssistantRuntimeProvider runtime={runtime}>
                            <QueryArticlesToolUI />
                            <ScrapeToolUI />
                            <CreateArticleToolUI />
                            <GetCategoriesToolUI />
                            <GetTagsToolUI />
                            <GenerateCoverImageToolUI />
                            <GetMultipleCoverImagesToolUI />
                            <CreateTagToolUI />
                            <CreateCategoryToolUI />
                            <UpdateArticleStatusToolUI />
                            <GetCurrentTimeToolUI />
                            <GenerateSlugToolUI />
                            <SearchArticlesToolUI />
                            <AssistantModal/>
                        </AssistantRuntimeProvider>
                    </QueryClientProvider>
                </ThemeProvider>
            </TranslationsProvider>
        </AppContext.Provider>
    </>
}

export function useApp() {
    const app = React.useContext(AppContext);
    if (!app) {
        throw new Error("useApp must be used within a AppProvider");
    }
    return app;
}