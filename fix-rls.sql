-- 修复 RLS 策略，确保匿名用户可以读写所有数据

-- 删除现有策略
DROP POLICY IF EXISTS "Allow public read posts" ON posts;
DROP POLICY IF EXISTS "Allow public read photos" ON photos;
DROP POLICY IF EXISTS "Allow public read videos" ON videos;
DROP POLICY IF EXISTS "Allow public read about" ON about_content;
DROP POLICY IF EXISTS "Allow public read social" ON social_links;
DROP POLICY IF EXISTS "Admin full access posts" ON posts;
DROP POLICY IF EXISTS "Admin full access photos" ON photos;
DROP POLICY IF EXISTS "Admin full access videos" ON videos;
DROP POLICY IF EXISTS "Admin full access about" ON about_content;
DROP POLICY IF EXISTS "Admin full access social" ON social_links;
DROP POLICY IF EXISTS "Admin full access admins" ON admins;

-- 重新创建策略 - 完全开放读写（开发环境）
CREATE POLICY "Public full access posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access photos" ON photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access about" ON about_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access social" ON social_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access tags" ON tags FOR ALL USING (true) WITH CHECK (true);
