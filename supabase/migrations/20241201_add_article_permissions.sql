-- 检查并设置表权限访问规则
-- 为 anon 和 authenticated 角色授予 articles 表的访问权限

-- 授予 anon 角色对 articles 表的 SELECT 权限（只读访问）
GRANT SELECT ON articles TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON tags TO anon;
GRANT SELECT ON article_tags TO anon;

-- 授予 authenticated 角色对所有表的完全访问权限
GRANT ALL PRIVILEGES ON articles TO authenticated;
GRANT ALL PRIVILEGES ON categories TO authenticated;
GRANT ALL PRIVILEGES ON tags TO authenticated;
GRANT ALL PRIVILEGES ON article_tags TO authenticated;
GRANT ALL PRIVILEGES ON article_likes TO authenticated;

-- 检查当前权限设置
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;