-- ========================================
-- 一个青年人的自白 - 数据库结构
-- ========================================

-- 1. 用户表（管理员）
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT DEFAULT '博主',
    email TEXT,
    avatar_url TEXT,
    tagline TEXT DEFAULT '记录者 / 思考者 / 表达者',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 文章表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    cover_image TEXT,
    tag TEXT DEFAULT '随想',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 图片表
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT '摄影',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 视频表
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    cover_image TEXT,
    platform TEXT DEFAULT 'bilibili' CHECK (platform IN ('bilibili', 'youtube', 'local')),
    category TEXT DEFAULT '纪录',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 关于页面内容
CREATE TABLE IF NOT EXISTS about_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT UNIQUE NOT NULL,
    content TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 社交链接
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    display_name TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 初始化数据
-- ========================================

-- 插入默认管理员 (密码: admin123)
INSERT INTO admins (username, password_hash, nickname, tagline) VALUES 
('admin', 'admin123', '一个青年人', '记录者 / 思考者 / 表达者')
ON CONFLICT (username) DO NOTHING;

-- 初始化关于页面
INSERT INTO about_content (section, content) VALUES 
('intro', '你好，感谢你来到这里。我是一个普通的年轻人，和你一样在这个快速变化的时代里寻找自己的位置。用文字记录下思考的碎片，是我与自己对话的方式。'),
('quote', '这里没有鸡汤，没有速成法则，只有一些真实的困惑、反思和成长。如果你也有类似的感受，或许我们能在这里产生共鸣。')
ON CONFLICT (section) DO NOTHING;

-- 插入示例文章
INSERT INTO posts (title, content, excerpt, tag, status) VALUES
('二十岁，我好像弄丢了什么', 
'<p>二十岁，是一个尴尬的年纪。</p><p>不再是那个可以肆无忌惮的少年，却也没有足够的能力去承担成年人世界的重量。我们在这个夹缝中，寻找自己的位置。</p><p>有时候我会想，我们这一代人是不是失去了什么。那些父辈口中的"单纯"，那些简单的快乐，似乎都在某一天悄然离去，取而代之的是无尽的焦虑和对未来的迷茫。</p><blockquote>成长不是变得复杂，而是学会在复杂中保持简单。</blockquote><p>但或许这就是青春该有的样子吧。在迷失中寻找，在困惑中前行，在一次次跌倒中学会站起来。那些弄丢的东西，终将以另一种方式回到我们身边。</p>',
'二十岁，是一个尴尬的年纪。不再是那个可以肆无忌惮的少年，却也没有足够的能力去承担成年人世界的重量。', '随想', 'published'),
('凌晨三点的城市', 
'<p>凌晨三点，城市还没有完全睡去。</p><p>便利店的灯光亮着，像是一座座孤岛。外卖员的电动车从身边呼啸而过，屏幕的光映在脸上，写满了疲惫。写字楼的某几层还亮着灯，那是加班到深夜的打工人。</p><p>这座城市藏着太多不被看见的故事。</p><blockquote>每一个深夜未眠的人，都有属于自己的理由。</blockquote><p>我曾问过一个凌晨还在送外卖的大叔，为什么这么晚还在跑。他笑了笑说："家里孩子要上学，多跑几单能多赚点。"语气平淡得像在说今天天气不错。</p>',
'凌晨三点，城市还没有完全睡去。便利店的灯光，外卖员的电动车，加班到深夜的打工人......这座城市藏着太多不被看见的故事。', '城市', 'published')
ON CONFLICT DO NOTHING;

-- 插入示例社交链接
INSERT INTO social_links (platform, url, display_name, sort_order) VALUES
('weibo', '#', '微博', 1),
('xiaohongshu', '#', '小红书', 2),
('github', '#', 'GitHub', 3)
ON CONFLICT DO NOTHING;

-- ========================================
-- RLS 策略 (行级安全)
-- ========================================

-- 启用 RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

-- 允许公开读取文章、图片、视频
CREATE POLICY "Allow public read posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Allow public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Allow public read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Allow public read about" ON about_content FOR SELECT USING (true);
CREATE POLICY "Allow public read social" ON social_links FOR SELECT USING (true);

-- 仅管理员可写入（通过 service role key）
CREATE POLICY "Admin full access posts" ON posts FOR ALL USING (true);
CREATE POLICY "Admin full access photos" ON photos FOR ALL USING (true);
CREATE POLICY "Admin full access videos" ON videos FOR ALL USING (true);
CREATE POLICY "Admin full access about" ON about_content FOR ALL USING (true);
CREATE POLICY "Admin full access social" ON social_links FOR ALL USING (true);
CREATE POLICY "Admin full access admins" ON admins FOR ALL USING (true);
