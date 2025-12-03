import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'

// 从环境变量获取允许访问 dashboard 的邮箱列表
// 支持多个邮箱，用逗号分隔
function getAdminEmails(): string[] {
    const adminEmails = process.env.ADMIN_EMAILS || ''
    return adminEmails.split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
}

// 检查路径是否是 dashboard 路由（支持多语言前缀）
function isDashboardRoute(pathname: string): boolean {
    // 匹配 /dashboard 或 /zh/dashboard 或 /en/dashboard 等
    return /^(\/[a-z]{2})?\/dashboard(\/.*)?$/.test(pathname)
}

export async function updateSession(request: NextRequest, response: NextResponse) {
    let supabaseResponse = response

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({name, value}) => supabaseResponse.cookies.set(name, value))
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: Don't remove getClaims()
    const {data} = await supabase.auth.getClaims()

    const user = data?.claims
    const pathname = request.nextUrl.pathname

    // 检查是否是 dashboard 路由
    if (isDashboardRoute(pathname)) {
        // 未登录用户重定向到首页
        if (!user) {
            const url = request.nextUrl.clone()
            // 提取语言前缀
            const localeMatch = pathname.match(/^\/([a-z]{2})\//)
            const locale = localeMatch ? localeMatch[1] : 'zh'
            url.pathname = `/${locale}`
            return NextResponse.redirect(url)
        }

        // 检查用户邮箱是否在白名单中
        const adminEmails = getAdminEmails()
        const userEmail = (user.email as string || '').toLowerCase()
        
        if (adminEmails.length > 0 && !adminEmails.includes(userEmail)) {
            // 用户邮箱不在白名单中，重定向到访问被拒绝页面
            const url = request.nextUrl.clone()
            const localeMatch = pathname.match(/^\/([a-z]{2})\//)
            const locale = localeMatch ? localeMatch[1] : 'zh'
            url.pathname = `/${locale}/access-denied`
            return NextResponse.redirect(url)
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}