import {i18nRouter} from 'next-i18n-router';
import i18nConfig from './i18nConfig';
import {NextRequest} from "next/server";
import {updateSession} from "@/lib/supabase/middleware";

// name this function 'middleware' instead in Next 15 or earlier
export function proxy(request: NextRequest) {
    return updateSession(request, i18nRouter(request, i18nConfig))
}

// runs this function only on requests to pages in our app directory
export const config = {
    matcher: '/((?!api|static|.*\\..*|_next).*)'
};