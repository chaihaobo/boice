'use client';

import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import {initTranslations} from '@/app/i18n';
import { createInstance, i18n, Resource } from 'i18next';

interface TranslationsProviderProps {
    children: ReactNode;
    locale: string;
    namespaces: string[];
    resources?: Resource; // 可根据你实际返回类型调整
}

export default function TranslationsProvider({
                                                 children,
                                                 locale,
                                                 namespaces,
                                                 resources
                                             }: TranslationsProviderProps) {
    const i18nInstance: i18n = createInstance();

    initTranslations(locale, namespaces, i18nInstance, resources);

    return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}