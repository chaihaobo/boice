"use client";
import React from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { usePathname } from "next/navigation";
import { useApp } from "@/app/[locale]/app";

// Tech stack icons as SVG components
const NextJsIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 180 180" fill="currentColor" className={className}>
        <mask height="180" id="mask0_408_134" maskUnits="userSpaceOnUse" width="180" x="0" y="0">
            <circle cx="90" cy="90" fill="currentColor" r="90"/>
        </mask>
        <g mask="url(#mask0_408_134)">
            <circle cx="90" cy="90" fill="currentColor" r="90"/>
            <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="url(#paint0_linear_408_134)"/>
            <rect fill="url(#paint1_linear_408_134)" height="72" width="12" x="115" y="54"/>
        </g>
        <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_408_134" x1="109" x2="144.5" y1="116.5" y2="160.5">
                <stop stopColor="white"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_408_134" x1="121" x2="120.799" y1="54" y2="106.875">
                <stop stopColor="white"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
            </linearGradient>
        </defs>
    </svg>
);

const VercelIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 76 65" fill="currentColor" className={className}>
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/>
    </svg>
);

const ShadcnIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="20" className={className}>
        <line x1="208" y1="128" x2="128" y2="208"/>
        <line x1="192" y1="40" x2="40" y2="192"/>
    </svg>
);

const SupabaseIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 109 113" fill="none" className={className}>
        <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
        <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint1_linear)" fillOpacity="0.2"/>
        <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
        <defs>
            <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                <stop stopColor="#249361"/>
                <stop offset="1" stopColor="#3ECF8E"/>
            </linearGradient>
            <linearGradient id="paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
                <stop/>
                <stop offset="1" stopOpacity="0"/>
            </linearGradient>
        </defs>
    </svg>
);

const AIIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
    </svg>
);

interface TechItemProps {
    icon: React.ReactNode;
    name: string;
    href: string;
}

const TechItem: React.FC<TechItemProps> = ({ icon, name, href }) => (
    <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
        <span className="shrink-0 w-4 h-4 flex items-center justify-center">
            {icon}
        </span>
        <span className="text-sm font-medium">{name}</span>
    </Link>
);

export const Footer: React.FC = () => {
    const pathname = usePathname();
    const { useT } = useApp();
    const t = useT();
    
    // Hide footer on dashboard and assistant pages
    const isDashboard = pathname.includes('/dashboard');
    const isAssistant = pathname.includes('/assistant');
    if (isDashboard || isAssistant) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    const techStack = [
        {
            icon: <NextJsIcon className="w-4 h-4" />,
            name: "Next.js",
            href: "https://nextjs.org"
        },
        {
            icon: <VercelIcon className="w-3.5 h-3.5" />,
            name: "Vercel",
            href: "https://vercel.com"
        },
        {
            icon: <ShadcnIcon className="w-4 h-4" />,
            name: "shadcn/ui",
            href: "https://ui.shadcn.com"
        },
        {
            icon: <SupabaseIcon className="w-4 h-4" />,
            name: "Supabase",
            href: "https://supabase.com"
        },
        {
            icon: <AIIcon className="w-4 h-4" />,
            name: "Vercel AI SDK",
            href: "https://sdk.vercel.ai"
        }
    ];

    return (
        <footer className="border-t bg-muted/30 mt-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Tech Stack */}
                <div className="flex flex-col items-center gap-4 mb-6">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('footer.builtWith')}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {techStack.map((tech) => (
                            <TechItem key={tech.name} {...tech} />
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border/50 my-6" />

                {/* Bottom Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Brand & Copyright */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Boice</span>
                        <span className="text-border">|</span>
                        <span>© {currentYear}</span>
                    </div>

                    {/* GitHub Link */}
                    <Link
                        href="https://github.com/chaihaobo/boice"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="h-4 w-4" />
                        <span>{t('footer.viewOnGithub')}</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
};

