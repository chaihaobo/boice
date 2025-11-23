import {Button} from "@/components/ui/button";
import {initTranslations} from '../i18n';


export default async function Home({params}: { params: Promise<{ locale: string }> }) {
    const locale = (await params).locale;
    const {t} = await initTranslations(locale, ['common']);
    return (
        <>
            <h1>{t('nav.home')}</h1>
            <Button>Click me</Button>
        </>
    );
}
