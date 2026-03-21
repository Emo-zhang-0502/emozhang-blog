/**
 * 后台管理核心脚本 - 完整重写版
 */

// ========================================
// 配置
// ========================================
const SUPABASE_URL = 'https://axrxgqotyjxwjaanjzvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnhncW90eWp4d2phYW5qenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODEzMjcsImV4cCI6MjA4OTU1NzMyN30.1t6vJFvVa-iXHlc4YXNBBvWiN97Ydd8Zvmy75cCblPw';

// 从 sessionStorage 获取登录信息
const adminId = sessionStorage.getItem('admin_id');
const adminNickname = sessionStorage.getItem('admin_nickname');
const adminLoggedIn = sessionStorage.getItem('admin_logged_in');

// 富文本编辑器实例
let quillEditor = null;

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!adminLoggedIn || !adminId) {
        window.location.href = 'admin.html';
        return;
    }
    
    // 更新用户信息
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        avatarEl.textContent = adminNickname ? adminNickname[0] : '管';
    }
    
    // 初始化导航
    initNavigation();
    
    // 初始化富文本编辑器
    initEditor();
    
    // 加载数据
    await loadTags();
    await loadArticles();
    await loadPhotos();
    await loadVideos();
    await loadSettings();
    
    // 初始化文件上传
    initFileUploads();
});

// ========================================
// 导航
// ========================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-panel]');
    const panelTitles = {
        'tags': '标签管理',
        'articles': '文章管理',
        'photos': '图片管理',
        'videos': '视频管理',
        'batch': '批量管理',
        'settings': '个人设置'
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const panel = item.dataset.panel;
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${panel}`).classList.add('active');
            
            const titleEl = document.getElementById('current-panel-title');
            if (titleEl) titleEl.textContent = panelTitles[panel];
        });
    });
}

// ========================================
// 富文本编辑器
// ========================================
function initEditor() {
    quillEditor = new Quill('#article-editor', {
        theme: 'snow',
        placeholder: '在这里写下你的文字...（可直接 Ctrl+V 粘贴图片）',
        modules: {
            toolbar: {
                container: [
                    ['bold', 'italic', 'underline'],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'link'],
                    ['image'],
                    ['clean']
                ],
                handlers: {
                    'image': imageHandler
                }
            }
        }
    });
    
    // 初始化粘贴监听
    initPasteListener();
}

// 图片压缩函数
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // 等比例缩放
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 输出压缩后的 base64
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 处理图片上传
async function handleImageUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'error');
        return;
    }
    
    // 检查文件大小
    const fileSizeMB = file.size / 1024 / 1024;
    showToast('正在处理图片...', 'info');
    
    try {
        let imageData;
        
        // 如果图片大于 500KB，进行压缩
        if (file.size > 500 * 1024) {
            imageData = await compressImage(file);
            showToast('图片已压缩', 'success');
        } else {
            // 小图片直接转 base64
            imageData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
        
        // 插入到编辑器
        const range = quillEditor.getSelection(true);
        quillEditor.insertEmbed(range.index, 'image', imageData);
        quillEditor.setSelection(range.index + 1);
        
    } catch (error) {
        console.error('图片处理失败:', error);
        showToast('图片处理失败', 'error');
    }
}

// 图片上传处理器（点击上传）
function imageHandler() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = () => {
        const file = input.files[0];
        if (file) handleImageUpload(file);
    };
    
    input.click();
}

// 粘贴图片监听器
function initPasteListener() {
    document.addEventListener('paste', async (e) => {
        const modal = document.getElementById('article-modal');
        if (!modal || !modal.classList.contains('active')) return;
        
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await handleImageUpload(file);
                }
                break;
            }
        }
    });
}

// ========================================
// 模态框
// ========================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ========================================
// Toast 提示
// ========================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========================================
// API 请求封装
// ========================================
async function apiRequest(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `请求失败: ${response.status}`);
    }
    
    return response;
}

// ========================================
// 文章管理
// ========================================
async function loadArticles() {
    try {
        const response = await apiRequest('posts?order=created_at.desc');
        const articles = await response.json();
        renderArticles(articles);
        await refreshTagSelect();
    } catch (error) {
        console.error('加载文章失败:', error);
        showToast('加载文章失败', 'error');
    }
}

// 更新标签选择器
async function refreshTagSelect() {
    const select = document.getElementById('article-tag');
    if (!select) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tags?order=name.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const tags = await response.json();
        
        if (tags.length > 0) {
            select.innerHTML = tags.map(tag => 
                `<option value="${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</option>`
            ).join('');
        } else {
            // 默认标签
            select.innerHTML = `
                <option value="随想">随想</option>
                <option value="生活">生活</option>
                <option value="技术">技术</option>
                <option value="旅行">旅行</option>
            `;
        }
    } catch (error) {
        console.error('加载标签选项失败:', error);
    }
}

function renderArticles(articles) {
    const container = document.getElementById('articles-list');
    if (!container) return;
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>还没有文章</p>
                <p style="margin-top: 8px; font-size: 13px;">点击右上角按钮创建第一篇文章</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="article-item">
            <div class="article-info">
                <div class="article-title">${escapeHtml(article.title)}</div>
                <div class="article-meta">
                    <span>${escapeHtml(article.tag || '随想')}</span>
                    <span>·</span>
                    <span>${new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
                    <span>·</span>
                    <span style="color: ${article.status === 'published' ? 'var(--color-success)' : 'var(--color-text-muted)'}">${article.status === 'published' ? '已发布' : '草稿'}</span>
                </div>
            </div>
            <div class="article-actions">
                <button class="btn btn-secondary btn-sm" onclick="editArticle('${article.id}')">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteArticle('${article.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

function openArticleModal(article = null) {
    document.getElementById('article-modal-title').textContent = article ? '编辑文章' : '新建文章';
    document.getElementById('article-id').value = article ? article.id : '';
    document.getElementById('article-title').value = article ? article.title : '';
    document.getElementById('article-tag').value = article ? article.tag : '随想';
    document.getElementById('article-cover').value = article ? article.cover_image || '' : '';
    document.getElementById('article-excerpt').value = article ? article.excerpt || '' : '';
    document.getElementById('article-status').value = article ? article.status : 'published';
    
    if (quillEditor) {
        quillEditor.root.innerHTML = article ? article.content : '';
    }
    
    openModal('article-modal');
}

async function editArticle(id) {
    try {
        const response = await apiRequest(`posts?id=eq.${id}`);
        const articles = await response.json();
        if (articles.length > 0) {
            openArticleModal(articles[0]);
        }
    } catch (error) {
        showToast('加载文章失败', 'error');
    }
}

async function saveArticle() {
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title').value.trim();
    const tag = document.getElementById('article-tag').value;
    const cover = document.getElementById('article-cover').value.trim();
    const excerpt = document.getElementById('article-excerpt').value.trim();
    const content = quillEditor ? quillEditor.root.innerHTML : '';
    const status = document.getElementById('article-status').value;
    
    if (!title) {
        showToast('请输入标题', 'error');
        return;
    }
    
    if (!content || content === '<p><br></p>') {
        showToast('请输入文章内容', 'error');
        return;
    }
    
    // 检查内容大小
    const contentSize = new Blob([content]).size;
    if (contentSize > 2 * 1024 * 1024) {
        showToast('文章内容过大，请压缩图片后重试', 'error');
        return;
    }
    
    const data = {
        title,
        tag,
        excerpt,
        content,
        status,
        updated_at: new Date().toISOString()
    };
    
    if (cover) data.cover_image = cover;
    
    try {
        if (id) {
            // 更新
            await apiRequest(`posts?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            showToast('文章已更新', 'success');
        } else {
            // 新建
            await apiRequest('posts', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('文章已创建', 'success');
        }
        
        closeModal('article-modal');
        loadArticles();
    } catch (error) {
        console.error('保存文章失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

async function deleteArticle(id) {
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    try {
        await apiRequest(`posts?id=eq.${id}`, {
            method: 'DELETE'
        });
        showToast('文章已删除', 'success');
        loadArticles();
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// ========================================
// 图片管理
// ========================================
async function loadPhotos() {
    try {
        const response = await apiRequest('photos?order=created_at.desc');
        const photos = await response.json();
        renderPhotos(photos);
    } catch (error) {
        console.error('加载图片失败:', error);
    }
}

function renderPhotos(photos) {
    const container = document.getElementById('photos-grid');
    if (!container) return;
    
    if (!photos || photos.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🖼️</div>
                <p>还没有图片</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = photos.map(photo => `
        <div class="photo-item">
            <img src="${escapeHtml(photo.image_url)}" alt="${escapeHtml(photo.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23eee%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            <div class="photo-overlay">
                <span class="photo-title">${escapeHtml(photo.title)}</span>
                <div class="photo-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editPhoto('${photo.id}')">编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePhoto('${photo.id}')">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openPhotoModal(photo = null) {
    document.getElementById('photo-id').value = photo ? photo.id : '';
    document.getElementById('photo-title').value = photo ? photo.title : '';
    document.getElementById('photo-description').value = photo ? photo.description || '' : '';
    document.getElementById('photo-url').value = photo ? photo.image_url : '';
    document.getElementById('photo-category').value = photo ? photo.category : '摄影';
    openModal('photo-modal');
}

async function editPhoto(id) {
    try {
        const response = await apiRequest(`photos?id=eq.${id}`);
        const photos = await response.json();
        if (photos.length > 0) {
            openPhotoModal(photos[0]);
        }
    } catch (error) {
        showToast('加载失败', 'error');
    }
}

async function savePhoto() {
    const id = document.getElementById('photo-id').value;
    const title = document.getElementById('photo-title').value.trim();
    const description = document.getElementById('photo-description').value.trim();
    const image_url = document.getElementById('photo-url').value.trim();
    const category = document.getElementById('photo-category').value;
    
    if (!title || !image_url) {
        showToast('请填写标题和图片URL', 'error');
        return;
    }
    
    const data = { title, description, image_url, category };
    
    try {
        if (id) {
            await apiRequest(`photos?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            showToast('图片已更新', 'success');
        } else {
            await apiRequest('photos', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('图片已添加', 'success');
        }
        
        closeModal('photo-modal');
        loadPhotos();
    } catch (error) {
        showToast('保存失败', 'error');
    }
}

async function deletePhoto(id) {
    if (!confirm('确定要删除这张图片吗？')) return;
    
    try {
        await apiRequest(`photos?id=eq.${id}`, {
            method: 'DELETE'
        });
        showToast('图片已删除', 'success');
        loadPhotos();
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// ========================================
// 视频管理
// ========================================
async function loadVideos() {
    try {
        const response = await apiRequest('videos?order=created_at.desc');
        const videos = await response.json();
        renderVideos(videos);
    } catch (error) {
        console.error('加载视频失败:', error);
    }
}

function renderVideos(videos) {
    const container = document.getElementById('videos-grid');
    if (!container) return;
    
    if (!videos || videos.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🎬</div>
                <p>还没有视频</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = videos.map(video => `
        <div class="video-item">
            <div class="video-cover">
                <img src="${video.cover_image || getVideoThumbnail(video.video_url)}" alt="${escapeHtml(video.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22%3E%3Crect fill=%22%23222%22 width=%22320%22 height=%22180%22/%3E%3Ctext x=%22160%22 y=%2290%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22%3EVideo%3C/text%3E%3C/svg%3E'">
                <div class="video-play">
                    <div class="video-play-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-accent)">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-meta">${escapeHtml(video.category || '纪录')} · ${new Date(video.created_at).toLocaleDateString('zh-CN')}</div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" onclick="editVideo('${video.id}')">编辑</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video.id}')">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

function getVideoThumbnail(url) {
    if (!url) return '';
    const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV\w+)/i);
    if (bilibiliMatch) return `https://i0.hdslb.com/bfs/bangumi/${bilibiliMatch[1]}.jpg`;
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    return '';
}

function openVideoModal(video = null) {
    document.getElementById('video-id').value = video ? video.id : '';
    document.getElementById('video-title').value = video ? video.title : '';
    document.getElementById('video-description').value = video ? video.description || '' : '';
    document.getElementById('video-url').value = video ? video.video_url : '';
    document.getElementById('video-cover').value = video ? video.cover_image || '' : '';
    document.getElementById('video-category').value = video ? video.category : '纪录';
    openModal('video-modal');
}

async function editVideo(id) {
    try {
        const response = await apiRequest(`videos?id=eq.${id}`);
        const videos = await response.json();
        if (videos.length > 0) {
            openVideoModal(videos[0]);
        }
    } catch (error) {
        showToast('加载失败', 'error');
    }
}

async function saveVideo() {
    const id = document.getElementById('video-id').value;
    const title = document.getElementById('video-title').value.trim();
    const description = document.getElementById('video-description').value.trim();
    const video_url = document.getElementById('video-url').value.trim();
    const cover_image = document.getElementById('video-cover').value.trim();
    const category = document.getElementById('video-category').value;
    
    if (!title || !video_url) {
        showToast('请填写标题和视频URL', 'error');
        return;
    }
    
    let platform = 'bilibili';
    if (video_url.includes('youtube.com') || video_url.includes('youtu.be')) {
        platform = 'youtube';
    }
    
    const data = { title, description, video_url, cover_image, category, platform };
    
    try {
        if (id) {
            await apiRequest(`videos?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            showToast('视频已更新', 'success');
        } else {
            await apiRequest('videos', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('视频已添加', 'success');
        }
        
        closeModal('video-modal');
        loadVideos();
    } catch (error) {
        showToast('保存失败', 'error');
    }
}

async function deleteVideo(id) {
    if (!confirm('确定要删除这个视频吗？')) return;
    
    try {
        await apiRequest(`videos?id=eq.${id}`, {
            method: 'DELETE'
        });
        showToast('视频已删除', 'success');
        loadVideos();
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// ========================================
// 设置
// ========================================
async function loadSettings() {
    try {
        // 获取当前登录的admin_id
        let adminId = sessionStorage.getItem('admin_id');
        
        // 如果没有admin_id，从username查询
        let admin = null;
        if (adminId) {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?id=eq.${adminId}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const admins = await response.json();
            if (admins && admins.length > 0) {
                admin = admins[0];
            }
        }
        
        // 如果没找到，尝试用username查询
        if (!admin) {
            const username = sessionStorage.getItem('admin_username') || 'admin';
            const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?username=eq.${encodeURIComponent(username)}`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const admins = await response.json();
            if (admins && admins.length > 0) {
                admin = admins[0];
            }
        }
        
        // 如果还是没有数据，尝试获取第一条admin记录
        if (!admin) {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?limit=1`, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            const admins = await response.json();
            if (admins && admins.length > 0) {
                admin = admins[0];
            }
        }
        
        if (admin) {
            // 更新sessionStorage
            sessionStorage.setItem('admin_id', admin.id);
            sessionStorage.setItem('admin_username', admin.username);
            
            // 填充表单
            document.getElementById('setting-username').value = admin.username || 'admin';
            document.getElementById('setting-nickname').value = admin.nickname || '';
            document.getElementById('setting-tagline').value = admin.tagline || '';
            console.log('加载管理员成功:', admin);
        } else {
            console.error('未找到管理员数据');
        }
        
        // 加载关于内容
        const aboutResponse = await fetch(`${SUPABASE_URL}/rest/v1/about_content?section=eq.intro`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const aboutData = await aboutResponse.json();
        if (aboutData.length > 0) {
            document.getElementById('setting-about').value = aboutData[0].content || '';
        }
        
        // 加载社交链接
        const socialResponse = await fetch(`${SUPABASE_URL}/rest/v1/social_links?order=sort_order.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const socialLinks = await socialResponse.json();
        renderSocialLinks(socialLinks);
        
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

function renderSocialLinks(links) {
    const container = document.getElementById('social-links-list');
    if (!container) return;
    
    if (!links || links.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-muted)">暂无社交链接</p>';
        return;
    }
    
    container.innerHTML = links.map(link => `
        <div class="settings-row">
            <div>
                <strong>${escapeHtml(link.display_name || link.platform)}</strong>
                <div style="font-size: 13px; color: var(--color-text-muted); margin-top: 4px;">${escapeHtml(link.url)}</div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm" onclick="editSocialLink('${link.id}')">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSocialLink('${link.id}')">删除</button>
            </div>
        </div>
    `).join('');
}

// 修改登录用户名
async function saveUsername() {
    const newUsername = document.getElementById('setting-username').value.trim();
    
    if (!newUsername) {
        showToast('请输入用户名', 'error');
        return;
    }
    
    if (newUsername.length < 3) {
        showToast('用户名至少3个字符', 'error');
        return;
    }
    
    try {
        const currentUsername = sessionStorage.getItem('admin_username') || 'admin';
        console.log('更新用户名, 从:', currentUsername, '改为:', newUsername);
        
        // 先查询获取完整的admin数据
        const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins?username=eq.${encodeURIComponent(currentUsername)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const admins = await getResponse.json();
        if (!admins || admins.length === 0) {
            throw new Error('未找到管理员');
        }
        
        const adminId = admins[0].id;
        console.log('获取到id:', adminId);
        
        // 使用PATCH更新
        const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?id=eq.${adminId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                username: newUsername
            })
        });
        
        console.log('PATCH响应:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('保存失败详情:', errorText);
            showToast('保存失败 (错误码:' + response.status + ')', 'error');
            return;
        }
        
        sessionStorage.setItem('admin_username', newUsername);
        showToast('用户名已修改（下次登录时生效）', 'success');
    } catch (error) {
        console.error('保存用户名失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// 保存基本信息（昵称和签名）
async function saveBasicInfo() {
    const nickname = document.getElementById('setting-nickname').value.trim();
    const tagline = document.getElementById('setting-tagline').value.trim();
    
    if (!nickname) {
        showToast('请输入昵称', 'error');
        return;
    }
    
    try {
        const username = sessionStorage.getItem('admin_username') || 'admin';
        
        // 先查询获取完整的admin数据
        const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins?username=eq.${encodeURIComponent(username)}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const admins = await getResponse.json();
        if (!admins || admins.length === 0) {
            throw new Error('未找到管理员');
        }
        
        const admin = admins[0];
        console.log('获取到admin数据, id:', admin.id);
        
        // 使用PATCH with id
        const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?id=eq.${admin.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                nickname: nickname,
                tagline: tagline
            })
        });
        
        console.log('PATCH响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('保存失败:', response.status, errorText);
            showToast('保存失败 (错误码:' + response.status + ')', 'error');
            return;
        }
        
        sessionStorage.setItem('admin_nickname', nickname);
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) avatarEl.textContent = nickname[0];
        
        showToast('基本信息已保存', 'success');
    } catch (error) {
        console.error('保存失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// 保存关于内容
async function saveAbout() {
    const about = document.getElementById('setting-about').value.trim();
    
    try {
        // 先检查是否存在
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/about_content?section=eq.intro`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const existingData = await checkResponse.json();
        
        if (existingData.length > 0) {
            // 更新
            const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/about_content?section=eq.intro`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    content: about,
                    updated_at: new Date().toISOString()
                })
            });
            if (!updateResponse.ok) throw new Error('更新失败');
        } else {
            // 新建
            const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/about_content`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ section: 'intro', content: about })
            });
            if (!insertResponse.ok) throw new Error('创建失败');
        }
        
        showToast('关于页面已更新', 'success');
    } catch (error) {
        console.error('保存失败:', error);
        showToast('保存失败: ' + error.message, 'error');
    }
}

// 修改密码
async function savePassword() {
    const password = document.getElementById('setting-password').value;
    
    if (!password) {
        showToast('请输入新密码', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('密码至少6位', 'error');
        return;
    }
    
    try {
        const username = sessionStorage.getItem('admin_username') || 'admin';
        
        // 先查询获取id
        const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins?username=eq.${encodeURIComponent(username)}&select=id`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        const admins = await getResponse.json();
        if (!admins || admins.length === 0) {
            throw new Error('未找到管理员');
        }
        
        const adminId = admins[0].id;
        console.log('获取到id:', adminId);
        
        // 使用PATCH更新
        const response = await fetch(`${SUPABASE_URL}/rest/v1/admins?id=eq.${adminId}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                password_hash: password
            })
        });
        
        console.log('PATCH响应:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('修改密码失败:', errorText);
            showToast('修改失败 (错误码:' + response.status + ')', 'error');
            return;
        }
        
        document.getElementById('setting-password').value = '';
        showToast('密码已修改', 'success');
    } catch (error) {
        console.error('修改密码失败:', error);
        showToast('修改失败: ' + error.message, 'error');
    }
}

// 社交链接管理
async function addSocialLink() {
    const platform = prompt('平台名称（如：微博、小红书、GitHub）:');
    if (!platform) return;
    
    const url = prompt('链接地址:');
    if (!url) return;
    
    try {
        await apiRequest('social_links', {
            method: 'POST',
            body: JSON.stringify({ platform, url, display_name: platform })
        });
        showToast('链接已添加', 'success');
        loadSettings();
    } catch (error) {
        showToast('添加失败', 'error');
    }
}

async function editSocialLink(id) {
    const url = prompt('新的链接地址:');
    if (!url) return;
    
    try {
        await apiRequest(`social_links?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ url })
        });
        showToast('链接已更新', 'success');
        loadSettings();
    } catch (error) {
        showToast('更新失败', 'error');
    }
}

async function deleteSocialLink(id) {
    if (!confirm('确定要删除这个链接吗？')) return;
    
    try {
        await apiRequest(`social_links?id=eq.${id}`, {
            method: 'DELETE'
        });
        showToast('链接已删除', 'success');
        loadSettings();
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// ========================================
// 文件上传
// ========================================
function initFileUploads() {
    const photoFileInput = document.getElementById('photo-file');
    if (photoFileInput) {
        photoFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            showToast('正在上传图片...', 'info');
            
            // 使用 base64
            const reader = new FileReader();
            reader.onload = () => {
                document.getElementById('photo-url').value = reader.result;
                showToast('图片已加载，请保存', 'success');
            };
            reader.onerror = () => {
                showToast('上传失败', 'error');
            };
            reader.readAsDataURL(file);
        });
    }
}

// ========================================
// 工具函数
// ========================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 标签管理
// ========================================
async function loadTags() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tags?order=name.asc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const tags = await response.json();
        renderTags(tags);
    } catch (error) {
        console.error('加载标签失败:', error);
    }
}

function renderTags(tags) {
    const container = document.getElementById('tags-list');
    if (!container) return;
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-muted); padding: 20px;">暂无标签，点击上方按钮添加</p>';
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 12px; padding: 16px;">
            ${tags.map(tag => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: ${tag.color}20; border-radius: 20px; border: 1px solid ${tag.color}40;">
                    <span style="color: ${tag.color}; font-weight: 500;">${escapeHtml(tag.name)}</span>
                    <span style="color: var(--color-text-muted); font-size: 12px;">${tag.slug}</span>
                    <button onclick="editTag(${tag.id}, '${escapeHtml(tag.name)}', '${tag.color}')" style="background: none; border: none; cursor: pointer; color: var(--color-text-secondary); padding: 2px;">✎</button>
                    <button onclick="deleteTag(${tag.id})" style="background: none; border: none; cursor: pointer; color: var(--color-error); padding: 2px;">✕</button>
                </div>
            `).join('')}
        </div>
    `;
}

function openTagModal() {
    const tagName = prompt('输入标签名称:');
    if (!tagName) return;
    
    const tagColor = prompt('输入标签颜色（十六进制，如 #10b981）:', '#6366f1');
    if (!tagColor) return;
    
    createTag(tagName, tagColor);
}

function editTag(id, name, color) {
    const newName = prompt('输入新标签名称:', name);
    if (!newName) return;
    
    const newColor = prompt('输入新标签颜色:', color);
    if (!newColor) return;
    
    updateTag(id, newName, newColor);
}

async function createTag(name, color) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tags`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ name, slug, color })
        });
        
        if (!response.ok) throw new Error('创建失败');
        showToast('标签已创建', 'success');
        loadTags();
    } catch (error) {
        showToast('创建失败: ' + error.message, 'error');
    }
}

async function updateTag(id, name, color) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tags?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ name, slug, color })
        });
        
        if (!response.ok) throw new Error('更新失败');
        showToast('标签已更新', 'success');
        loadTags();
    } catch (error) {
        showToast('更新失败: ' + error.message, 'error');
    }
}

async function deleteTag(id) {
    if (!confirm('确定要删除这个标签吗？')) return;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/tags?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('删除失败');
        showToast('标签已删除', 'success');
        loadTags();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ========================================
// 批量管理
// ========================================
let selectedItems = new Set();
let currentBatchType = 'posts';

async function loadBatchItems() {
    currentBatchType = document.getElementById('batch-type').value;
    selectedItems.clear();
    document.getElementById('batch-delete-btn').disabled = true;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${currentBatchType}?order=created_at.desc&limit=50`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const items = await response.json();
        renderBatchItems(items);
    } catch (error) {
        console.error('加载失败:', error);
        showToast('加载失败', 'error');
    }
}

function renderBatchItems(items) {
    const container = document.getElementById('batch-list');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-muted); padding: 20px;">暂无内容</p>';
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid var(--color-border);">
                    <th style="padding: 12px; text-align: left; width: 40px;">
                        <input type="checkbox" id="select-all" onchange="toggleSelectAll(this)">
                    </th>
                    <th style="padding: 12px; text-align: left;">标题</th>
                    <th style="padding: 12px; text-align: left;">分类</th>
                    <th style="padding: 12px; text-align: left;">状态</th>
                    <th style="padding: 12px; text-align: left;">时间</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                    const id = item.id;
                    const title = item.title || item.description || '无标题';
                    const category = item.category || item.tag || '-';
                    const status = item.status || (item.is_published ? '已发布' : '草稿');
                    const date = new Date(item.created_at).toLocaleDateString('zh-CN');
                    return `
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <td style="padding: 12px;">
                                <input type="checkbox" class="batch-checkbox" value="${id}" onchange="toggleSelectItem(${id}, this)">
                            </td>
                            <td style="padding: 12px;">${escapeHtml(title.substring(0, 30))}${title.length > 30 ? '...' : ''}</td>
                            <td style="padding: 12px; color: var(--color-text-secondary);">${escapeHtml(category)}</td>
                            <td style="padding: 12px;">
                                <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${status === '已发布' || status === 'published' ? 'var(--color-success)20' : 'var(--color-text-muted)20'}; color: ${status === '已发布' || status === 'published' ? 'var(--color-success)' : 'var(--color-text-muted)'};">${status}</span>
                            </td>
                            <td style="padding: 12px; color: var(--color-text-muted); font-size: 12px;">${date}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.batch-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const id = parseInt(cb.value);
        if (checkbox.checked) {
            selectedItems.add(id);
        } else {
            selectedItems.delete(id);
        }
    });
    updateBatchDeleteBtn();
}

function toggleSelectItem(id, checkbox) {
    if (checkbox.checked) {
        selectedItems.add(id);
    } else {
        selectedItems.delete(id);
    }
    updateBatchDeleteBtn();
}

function updateBatchDeleteBtn() {
    const btn = document.getElementById('batch-delete-btn');
    btn.disabled = selectedItems.size === 0;
    btn.textContent = `删除选中 (${selectedItems.size})`;
}

async function batchDelete() {
    if (selectedItems.size === 0) {
        showToast('请先选择要删除的项目', 'error');
        return;
    }
    
    const typeLabels = { posts: '文章', photos: '图片', videos: '视频' };
    const typeLabel = typeLabels[currentBatchType];
    
    if (!confirm(`确定要删除选中的 ${selectedItems.size} 个${typeLabel}吗？此操作不可恢复！`)) {
        return;
    }
    
    try {
        const ids = Array.from(selectedItems);
        const idFilter = ids.map(id => `id=eq.${id}`).join(',');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${currentBatchType}?${idFilter}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('删除失败');
        
        showToast(`已删除 ${selectedItems.size} 个${typeLabel}`, 'success');
        selectedItems.clear();
        loadBatchItems();
    } catch (error) {
        showToast('删除失败: ' + error.message, 'error');
    }
}

// ========================================
// 退出登录
// ========================================
function logout() {
    sessionStorage.clear();
    window.location.href = 'admin.html';
}
