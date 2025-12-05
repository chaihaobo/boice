"use server";

import { createClient } from "@/lib/supabase/server";

// 从环境变量获取允许访问 dashboard 的邮箱列表
function getAdminEmails(): string[] {
    const adminEmails = process.env.ADMIN_EMAILS || '';
    return adminEmails.split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
}

/**
 * 检查当前用户是否有 Dashboard 访问权限
 * @returns {Promise<boolean>} 是否有权限
 */
export async function checkDashboardAccess(): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
        return false;
    }
    
    const adminEmails = getAdminEmails();
    
    // 如果没有配置白名单，默认允许所有登录用户
    if (adminEmails.length === 0) {
        return true;
    }
    
    return adminEmails.includes(user.email.toLowerCase());
}




