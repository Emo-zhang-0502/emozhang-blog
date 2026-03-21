/**
 * 一个青年人的自白 - 博客前台脚本
 */

// ========================================
// 配置
// ========================================
const SUPABASE_URL = 'https://axrxgqotyjxwjaanjzvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnhncW90eWp4d2phYW5qenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODEzMjcsImV4cCI6MjA4OTU1NzMyN30.1t6vJFvVa-iXHlc4YXNBBvWiN97Ydd8Zvmy75cCblPw';

// 数据缓存
let articles = [];
let photos = [];
let videos = [];
let siteInfo = {};

// ========================================
// 路由系统
// ========================================
let currentPage = 'home';
let currentArticle = null;

function navigateTo(page, articleId = null) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // 更新导航状态
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    
    // 显示目标页面
    if (page === 'article' && articleId) {
        currentArticle = articles.find(a => a.id === articleId);
        if (currentArticle) {
            document.getElementById('article-page').classList.add('active');
            renderArticle(currentArticle);
        }
    } else {
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }
    
    // 关闭弹窗
    closeLightbox();
    closeVideobox();
    
    // 关闭移动端菜单
    document.querySelector('.mobile-menu').classList.remove('active');
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    currentPage = page;
}

// ========================================
// 数据加载
// ========================================
async function loadData() {
    // 优先从 Supabase 加载
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            await Promise.all([
                loadArticlesFromDB(),
                loadPhotosFromDB(),
                loadVideosFromDB(),
                loadAboutFromDB()
            ]);
        } catch (error) {
            console.error('加载数据失败:', error);
            renderFallback();
        }
    } else {
        renderFallback();
    }
}

async function loadArticlesFromDB() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?status=eq.published&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('加载文章失败');
        
        articles = await response.json();
        console.log('加载文章成功:', articles.length, '篇');
    } catch (error) {
        console.error('加载文章失败:', error);
        articles = [];
    }
    
    renderArticleList();
    renderArchiveList();
}

async function loadPhotosFromDB() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/photos?order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('加载图片失败');
        
        photos = await response.json();
        console.log('加载图片成功:', photos.length, '张');
    } catch (error) {
        console.error('加载图片失败:', error);
        photos = [];
    }
    
    renderPhotos();
}

async function loadVideosFromDB() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/videos?order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('加载视频失败');
        
        videos = await response.json();
        console.log('加载视频成功:', videos.length, '个');
    } catch (error) {
        console.error('加载视频失败:', error);
        videos = [];
    }
    
    renderVideos();
}

async function loadAboutFromDB() {
    try {
        // 加载管理员信息
        const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!adminResponse.ok) throw new Error('加载管理员信息失败');
        
        const admins = await adminResponse.json();
        
        if (admins && admins.length > 0) {
            const admin = admins[0];
            
            // 更新站点名称
            siteInfo = {
                nickname: admin.nickname || '一个青年人',
                tagline: admin.tagline || '记录者 / 思考者 / 表达者',
                siteName: admin.site_name || '一个青年人的自白'
            };
            
            // 更新首页标题
            document.querySelector('.hero-title').textContent = siteInfo.siteName;
            document.querySelector('.logo-text').textContent = siteInfo.siteName;
            document.title = siteInfo.siteName;
            
            // 更新关于页
            const nameEl = document.getElementById('about-name');
            if (nameEl) nameEl.textContent = siteInfo.nickname;
            
            const taglineEl = document.getElementById('about-tagline');
            if (taglineEl) taglineEl.textContent = siteInfo.tagline;
            
            const avatarEl = document.querySelector('.about-avatar .avatar-placeholder');
            if (avatarEl) avatarEl.textContent = (siteInfo.nickname || '青')[0];
            
            console.log('管理员信息加载成功:', siteInfo);
        }
        
        // 加载关于内容
        const aboutResponse = await fetch(`${SUPABASE_URL}/rest/v1/about_content?order=updated_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!aboutResponse.ok) throw new Error('加载关于内容失败');
        
        const aboutData = await aboutResponse.json();
        
        if (aboutData && aboutData.length > 0) {
            const intro = aboutData.find(c => c.section === 'intro');
            const quote = aboutData.find(c => c.section === 'quote');
            
            const aboutTextEl = document.getElementById('about-text');
            if (aboutTextEl) {
                let html = '';
                if (intro?.content) {
                    html += `<p>${intro.content.replace(/\n/g, '</p><p>')}</p>`;
                }
                if (quote?.content) {
                    html += `<blockquote>${quote.content}</blockquote>`;
                }
                aboutTextEl.innerHTML = html || '<p>暂无内容</p>';
            }
            
            console.log('关于内容加载成功');
        }
        
        // 加载社交链接
        const socialResponse = await fetch(`${SUPABASE_URL}/rest/v1/social_links?order=sort_order.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!socialResponse.ok) throw new Error('加载社交链接失败');
        
        const socialLinks = await socialResponse.json();
        renderSocialLinks(socialLinks);
        console.log('社交链接加载成功');
        
    } catch (error) {
        console.error('加载关于页失败:', error);
        renderFallback();
    }
}

function renderSocialLinks(links) {
    const container = document.getElementById('social-links');
    if (!container) return;
    
    if (!links || links.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const icons = {
        'weibo': '<path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.4-6.4M13.6 9.6L20 4"/>',
        'xiaohongshu': '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1"/>',
        'github': '<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>',
        'bilibili': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 9l5 3-5 3V9z"/>'
    };
    
    container.innerHTML = links.map(link => `
        <a href="${link.url}" class="social-link" target="_blank">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${icons[link.platform] || '<circle cx="12" cy="12" r="10"/>'}
            </svg>
            <span>${link.display_name || link.platform}</span>
        </a>
    `).join('');
}

function renderFallback() {
    // 默认渲染
    renderArticleList();
    renderArchiveList();
    renderPhotos();
    renderVideos();
}

// ========================================
// 渲染函数
// ========================================
function renderArticleList() {
    const container = document.getElementById('article-list');
    
    if (articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>暂无文章</p>
                <p style="font-size: 14px; margin-top: 8px;">去后台发表第一篇文章吧</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = articles.slice(0, 4).map(article => `
        <article class="article-card" data-id="${article.id}">
            <div class="article-card-header">
                <span class="article-tag">${article.tag || '随想'}</span>
                <span class="article-date">${formatDate(article.created_at)}</span>
            </div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${article.excerpt || ''}</p>
            <div class="article-footer">
                <span class="article-meta">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    ${readingTime(article.content)} 分钟阅读
                </span>
            </div>
        </article>
    `).join('');
    
    // 绑定点击事件
    container.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => {
            navigateTo('article', card.dataset.id);
        });
    });
}

function renderArchiveList() {
    const container = document.getElementById('archive-list');
    
    if (articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>暂无文章归档</p>
            </div>
        `;
        return;
    }
    
// 按年份分组
    const groupedByYear = {};
    articles.forEach(article => {
        const year = new Date(article.created_at).getFullYear();
        if (!groupedByYear[year]) {
            groupedByYear[year] = [];
        }
        groupedByYear[year].push(article);
    });
    
    // 渲染
    let html = '';
    Object.keys(groupedByYear)
        .sort((a, b) => b - a)
        .forEach(year => {
            html += `
                <div class="archive-year-group">
                    <h3 class="archive-year">${year}</h3>
                    <div class="archive-year-articles">
                        ${groupedByYear[year].map(article => `
                            <div class="archive-item" data-id="${article.id}">
                                <span class="archive-item-date">${formatDate(article.created_at)}</span>
                                <span class="archive-item-title">${article.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    
    container.innerHTML = html;
    
    // 绑定点击事件
    container.querySelectorAll('.archive-item').forEach(item => {
        item.addEventListener('click', () => {
            navigateTo('article', item.dataset.id);
        });
    });
}

function renderPhotos() {
    const container = document.getElementById('photo-grid');
    
    if (photos.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🖼️</div>
                <p>暂无图片</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = photos.map(photo => `
        <div class="photo-item" onclick="openLightbox('${escapeHtml(photo.image_url)}', '${escapeHtml(photo.title)}', '${escapeHtml(photo.description || '')}')">
            <img src="${escapeHtml(photo.image_url)}" alt="${escapeHtml(photo.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            <span class="photo-category">${photo.category || '摄影'}</span>
            <div class="photo-overlay">
                <div class="photo-info">
                    <h4 class="photo-title">${escapeHtml(photo.title)}</h4>
                    ${photo.description ? `<p class="photo-desc">${escapeHtml(photo.description)}</p>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderVideos() {
    const container = document.getElementById('video-list');
    
    if (videos.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🎬</div>
                <p>暂无视频</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = videos.map(video => `
        <div class="video-item" onclick="openVideobox('${escapeHtml(video.video_url)}', '${video.platform}')">
            <div class="video-cover">
                <img src="${video.cover_image || getVideoThumbnail(video.video_url)}" alt="${escapeHtml(video.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22%3E%3Crect fill=%22%23222%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%22160%22 y=%2290%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22%3EVideo%3C/text%3E%3C/svg%3E'">
                <div class="video-play-btn">
                    <div class="video-play-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${escapeHtml(video.title)}</h3>
                ${video.description ? `<p class="video-desc">${escapeHtml(video.description)}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function renderArticle(article) {
    const container = document.getElementById('article-detail');
    container.innerHTML = `
        <header class="article-detail-header">
            <span class="article-tag">${article.tag || '随想'}</span>
            <h1 class="article-detail-title">${escapeHtml(article.title)}</h1>
            <div class="article-detail-meta">
                <span>${formatDate(article.created_at)}</span>
                <span>·</span>
                <span>${readingTime(article.content)} 分钟阅读</span>
            </div>
        </header>
        <div class="article-detail-content">
            ${article.content}
        </div>
        
        <!-- 评论区 -->
        <section class="article-comments">
            <h2 class="comments-title">评论</h2>
            <div id="comments-list" class="comments-list"></div>
            
            <!-- 评论表单 -->
            <div class="comment-form">
                <h3 class="comment-form-title">留下你的想法</h3>
                <div class="form-group">
                    <input type="text" id="comment-name" placeholder="你的昵称" class="comment-input">
                </div>
                <div class="form-group">
                    <textarea id="comment-content" placeholder="写下你的评论..." class="comment-textarea" rows="4"></textarea>
                </div>
                <button class="comment-submit" onclick="submitComment('${article.id}')">发表评论</button>
            </div>
        </section>
        
        <button class="article-back" onclick="navigateTo('home')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
            </svg>
            返回首页
        </button>
    `;
    
    // 加载评论
    loadComments(article.id);
}

// ========================================
// 评论功能
// ========================================
async function loadComments(postId) {
    const container = document.getElementById('comments-list');
    if (!container) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?post_id=eq.${postId}&status=eq.approved&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const comments = await response.json();
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="no-comments">暂无评论，来发表第一评论吧~</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">${(comment.author_name || '匿')[0].toUpperCase()}</div>
                <div class="comment-body">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(comment.author_name)}</span>
                        <span class="comment-time">${formatCommentDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('加载评论失败:', error);
        container.innerHTML = '<p class="no-comments">评论加载失败</p>';
    }
}

async function submitComment(postId) {
    const nameInput = document.getElementById('comment-name');
    const contentInput = document.getElementById('comment-content');
    
    const authorName = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!authorName) {
        alert('请输入昵称');
        nameInput.focus();
        return;
    }
    
    if (!content) {
        alert('请输入评论内容');
        contentInput.focus();
        return;
    }
    
    if (content.length > 1000) {
        alert('评论内容过长，请控制在1000字以内');
        return;
    }
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                post_id: postId,
                author_name: authorName,
                content: content,
                status: 'approved' // 直接显示，无需审核
            })
        });
        
        if (!response.ok) throw new Error('提交失败');
        
        // 清空表单
        nameInput.value = '';
        contentInput.value = '';
        
        // 显示成功提示
        alert('评论已提交，感谢你的留言！');
        
        // 重新加载评论
        loadComments(postId);
        
    } catch (error) {
        console.error('提交评论失败:', error);
        alert('评论提交失败，请稍后重试');
    }
}

function formatCommentDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // 1分钟内
    if (diff < 60000) return '刚刚';
    // 1小时内
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    // 24小时内
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    // 7天内
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    // 超过7天显示日期
    return date.toLocaleDateString('zh-CN');
}

// ========================================
// 弹窗功能
// ========================================
function openLightbox(url, title, desc) {
    document.getElementById('lightbox-img').src = url;
    document.getElementById('lightbox-title').textContent = title;
    document.getElementById('lightbox-desc').textContent = desc;
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}

function openVideobox(url, platform) {
    const player = document.getElementById('video-player');
    
    let embedUrl = '';
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else {
        // 默认 B站
        const videoId = extractBilibiliId(url);
        embedUrl = `https://player.bilibili.com/player.html?bvid=${videoId}&autoplay=1`;
    }
    
    player.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay"></iframe>`;
    document.getElementById('videobox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideobox() {
    document.getElementById('video-player').innerHTML = '';
    document.getElementById('videobox').classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// 工具函数
// ========================================
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
}

function readingTime(html) {
    if (!html) return 1;
    const text = html.replace(/<[^>]+>/g, '');
    const words = text.length;
    return Math.max(1, Math.ceil(words / 400));
}

function getVideoThumbnail(url) {
    if (!url) return '';
    const bilibiliId = extractBilibiliId(url);
    if (bilibiliId) {
        return `https://i0.hdslb.com/bfs/bangumi/${bilibiliId}.jpg`;
    }
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
        return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    }
    return '';
}

function extractBilibiliId(url) {
    const match = url.match(/bilibili\.com\/video\/(BV\w+)/i);
    return match ? match[1] : '';
}

function extractYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return match ? match[1] : '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 加载数据
    loadData();
    
    // 绑定导航链接
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
    
    // 移动端菜单切换
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }
    
    // 滚动时关闭菜单
    window.addEventListener('scroll', () => {
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenu) mobileMenu.classList.remove('active');
    });
    
    // 键盘导航支持
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closeVideobox();
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu) mobileMenu.classList.remove('active');
        }
    });
    
    // 点击弹窗背景关闭
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeLightbox();
        });
    }
    
    const videobox = document.getElementById('videobox');
    if (videobox) {
        videobox.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeVideobox();
        });
    }
});
