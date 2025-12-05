-- 添加 format 列到 chat_messages 表
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'aui/v5';
