-- 添加标签表
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为posts表添加tags字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT '[]';

-- 插入默认标签
INSERT INTO tags (name, slug, color) VALUES
    ('生活', 'life', '#10b981'),
    ('技术', 'tech', '#3b82f6'),
    ('旅行', 'travel', '#f59e0b'),
    ('摄影', 'photo', '#ec4899'),
    ('读书', 'reading', '#8b5cf6')
ON CONFLICT (slug) DO NOTHING;
