"use client";
import React, {useState, useMemo} from "react";
import {ThemeProvider} from "@/components/theme-provider";
import {Header} from "@/app/[locale]/components/header";
import {Footer} from "@/app/[locale]/components/footer";
import TranslationsProvider from "@/components/translations-provider";
import {Resource, type TFunction} from "i18next";
import {useTranslation} from "react-i18next";
import {useTheme, UseThemeProps} from "next-themes";
import {User} from "@supabase/auth-js";
import {createClient} from "@/lib/supabase/client";
import {
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import {
    AssistantRuntimeProvider,
    unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
} from "@assistant-ui/react";
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
    GetAboutMeToolUI,
} from "@/components/assistant-ui/tool-ui";
import {createSupabaseThreadListAdapter} from "@/lib/assistant/supabase-thread-adapter";


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

// 创建一个稳定的 QueryClient 实例
const queryClient = new QueryClient();

export const AppProvider: React.FC<AppProviderProps> = ({locale, i18nResource, children, authUser}) => {
    const app = createApp(authUser, locale);

    return (
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
                    <QueryClientProvider client={queryClient}>
                        <Header/>
                        <AssistantProvider userId={authUser?.id ?? null}>
                            <AssistantModal/>
                            <main className="flex-1">
                                {children}
                            </main>
                        </AssistantProvider>
                    </QueryClientProvider>
                    <Footer/>
                </ThemeProvider>
            </TranslationsProvider>
        </AppContext.Provider>
    );
};

// 单独的 Assistant Provider 组件
function AssistantProvider({
                               children,
                               userId,
                           }: {
    children: React.ReactNode;
    userId: string | null;
}) {
    const supabase = useMemo(() => createClient(), []);

    const threadListAdapter = useMemo(
        () => createSupabaseThreadListAdapter(supabase, userId),
        [supabase, userId]
    );
    useChatRuntime()

    const runtime = useRemoteThreadListRuntime({
        runtimeHook: () =>
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useChatRuntime({
                transport: new AssistantChatTransport({
                    api: "/api/chat",
                }),
            }),
        adapter: threadListAdapter,
    });

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <QueryArticlesToolUI/>
            <ScrapeToolUI/>
            <CreateArticleToolUI/>
            <GetCategoriesToolUI/>
            <GetTagsToolUI/>
            <GenerateCoverImageToolUI/>
            <GetMultipleCoverImagesToolUI/>
            <CreateTagToolUI/>
            <CreateCategoryToolUI/>
            <UpdateArticleStatusToolUI/>
            <GetCurrentTimeToolUI/>
            <GenerateSlugToolUI/>
            <SearchArticlesToolUI/>
            <GetAboutMeToolUI/>
            {children}
        </AssistantRuntimeProvider>
    );
}

export function useApp() {
    const app = React.useContext(AppContext);
    if (!app) {
        throw new Error("useApp must be used within a AppProvider");
    }
    return app;
}