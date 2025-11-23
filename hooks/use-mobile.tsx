// hooks/use-mobile.ts
import {useEffect, useState} from "react";

export function useIsMobile(breakpoint = 768): boolean {
    // 默认先假设是桌面端，避免 SSR 报错
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const checkMobile = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        // 初始化判断
        checkMobile();

        // 监听窗口变化
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, [breakpoint]);

    return isMobile;
}