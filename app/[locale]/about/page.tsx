import { getAboutMe } from "@/lib/actions/dashboard-actions"
import AboutContent from "./about-content"

interface AboutPageProps {
    params: Promise<{ locale: string }>
}

export default async function AboutPage({ params }: AboutPageProps) {
    const { locale } = await params
    const { data: aboutMe } = await getAboutMe(locale)

    return <AboutContent content={aboutMe?.content || null} locale={locale} />
}






