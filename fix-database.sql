-- 完整修复脚本 - 执行这个即可

-- 删除旧表
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS about_content CASCADE;
DROP TABLE IF EXISTS social_links CASCADE;

-- 创建管理员表
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT DEFAULT '一个青年人',
    tagline TEXT DEFAULT '记录者 / 思考者 / 表达者',
    bio TEXT DEFAULT '',
    avatar TEXT,
    background_image TEXT,
    site_name TEXT DEFAULT '一个青年人的自白',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建文章表
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    tag TEXT DEFAULT '随想',
    status TEXT DEFAULT 'published',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建图片表
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT '摄影',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建视频表
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    cover_image TEXT,
    platform TEXT DEFAULT 'local',
    category TEXT DEFAULT '纪录',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建关于内容表
CREATE TABLE about_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT UNIQUE NOT NULL,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建社交链接表
CREATE TABLE social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    display_name TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入管理员
INSERT INTO admins (username, password_hash, nickname, tagline, bio, site_name)
VALUES ('admin', '123456', '一个青年人', '记录者 / 思考者 / 表达者', '你好，感谢你来到这里。我是一个普通的年轻人，和你一样在这个快速变化的时代里寻找自己的位置。用文字记录下思考的碎片，是我与自己对话的方式。', '一个青年人的自白');

-- 插入示例文章
INSERT INTO posts (title, content, excerpt, tag, status)
VALUES 
('二十岁，我好像弄丢了什么', '<p>二十岁，是一个尴尬的年纪。</p><p>不再是那个可以肆无忌惮的少年，却也没有足够的能力去承担成年人世界的重量。</p><blockquote>成长不是变得复杂，而是学会在复杂中保持简单。</blockquote><p>在迷失中寻找，在困惑中前行，在一次次跌倒中学会站起来。</p>', '二十岁，是一个尴尬的年纪。不再是那个可以肆无忌惮的少年，却也没有足够的能力去承担成年人世界的重量。', '随想', 'published'),

('凌晨三点的城市', '<p>凌晨三点，城市还没有完全睡去。</p><p>便利店的灯光亮着，像是一座座孤岛。</p><blockquote>每一个深夜未眠的人，都有属于自己的理由。</blockquote>', '凌晨三点，城市还没有完全睡去。这座城市藏着太多不被看见的故事。', '城市', 'published');

-- 插入关于内容
INSERT INTO about_content (section, content) VALUES 
('intro', '你好，感谢你来到这里。我是一个普通的年轻人，和你一样在这个快速变化的时代里寻找自己的位置。'),
('quote', '这里没有鸡汤，没有速成法则，只有一些真实的困惑、反思和成长。');

-- 插入社交链接
INSERT INTO social_links (platform, url, display_name, sort_order) VALUES
('weibo', '#', '微博', 1),
('xiaohongshu', '#', '小红书', 2);

-- 启用 RLS 和权限
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "pub_admins_read" ON admins FOR SELECT USING (true);
CREATE POLICY "pub_posts_read" ON posts FOR SELECT USING (true);
CREATE POLICY "pub_photos_read" ON photos FOR SELECT USING (true);
CREATE POLICY "pub_videos_read" ON videos FOR SELECT USING (true);
CREATE POLICY "pub_about_read" ON about_content FOR SELECT USING (true);
CREATE POLICY "pub_social_read" ON social_links FOR SELECT USING (true);

-- 公开写入策略（用于后台管理）
CREATE POLICY "pub_admins_all" ON admins FOR ALL USING (true);
CREATE POLICY "pub_posts_all" ON posts FOR ALL USING (true);
CREATE POLICY "pub_photos_all" ON photos FOR ALL USING (true);
CREATE POLICY "pub_videos_all" ON videos FOR ALL USING (true);
CREATE POLICY "pub_about_all" ON about_content FOR ALL USING (true);
CREATE POLICY "pub_social_all" ON social_links FOR ALL USING (true);
