-- ============================================
-- 网站配置表 - 一个青年人的自白
-- ============================================

-- 1. 网站基本配置
CREATE TABLE IF NOT EXISTS site_config (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 板块配置（文字/影像/音乐/关于）
CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    section_key TEXT UNIQUE NOT NULL, -- 'writing', 'visual', 'music', 'about'
    title TEXT,
    subtitle TEXT,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 社交链接
CREATE TABLE IF NOT EXISTS social_links (
    id BIGSERIAL PRIMARY KEY,
    platform TEXT NOT NULL,
    url TEXT,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. IP形象配置
CREATE TABLE IF NOT EXISTS ip_config (
    id BIGSERIAL PRIMARY KEY,
    image_url TEXT,
    name TEXT,
    bio TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 插入初始数据
-- ============================================

-- 网站配置
INSERT INTO site_config (key, value) VALUES
('site_title', '一个青年人的自白'),
('site_subtitle', '文字 / 影像 / 音乐'),
('cover_date', '2024'),
('cover_issue', 'Vol.01'),
('footer_text', '一个青年人的自白'),
('footer_year', '2024')
ON CONFLICT (key) DO NOTHING;

-- 板块配置
INSERT INTO sections (section_key, title, subtitle, description, display_order) VALUES
('writing', '文字', 'WRITING', '记录生活，书写感悟', 1),
('visual', '影像', 'VISUAL', '摄影、视频与短片', 2),
('music', '音乐', 'MUSIC', '聆听，创作与分享', 3),
('about', '关于', 'ABOUT', '关于我', 4)
ON CONFLICT (section_key) DO NOTHING;

-- 社交链接
INSERT INTO social_links (platform, url, display_order) VALUES
('weibo', 'https://weibo.com/yourname', 1),
('xiaohongshu', 'https://www.xiaohongshu.com/user/profile/xxx', 2),
('bilibili', 'https://space.bilibili.com/yourid', 3),
('netease', 'https://music.163.com/#/user/home?id=yourid', 4)
ON CONFLICT (platform) DO NOTHING;

-- IP形象
INSERT INTO ip_config (name, bio) VALUES
('Emo', '一个普通又特别的年轻人')
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS 策略
-- ============================================

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_config ENABLE ROW LEVEL SECURITY;

-- 允许公开读取
CREATE POLICY "Allow public read config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Allow public read sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Allow public read social" ON social_links FOR SELECT USING (true);
CREATE POLICY "Allow public read ip" ON ip_config FOR SELECT USING (true);

-- 允许认证用户修改
CREATE POLICY "Allow authenticated update config" ON site_config FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated update sections" ON sections FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated update social" ON social_links FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated update ip" ON ip_config FOR UPDATE USING (true);
