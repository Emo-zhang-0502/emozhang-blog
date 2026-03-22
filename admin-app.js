/**
 * 后台管理核心脚本
 */

const SUPABASE_URL = 'https://axrxgqotyjxwjaanjzvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnhncW90eWp4d2phYW5qenZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5ODEzMjcsImV4cCI6MjA4OTU1NzMyN30.1t6vJFvVa-iXHlc4YXNBBvWiN97Ydd8Zvmy75cCblPw';

const adminId = sessionStorage.getItem('admin_id');
const adminNickname = sessionStorage.getItem('admin_nickname');
const adminLoggedIn = sessionStorage.getItem('admin_logged_in');

let quillEditor = null;
let editQuill = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!adminLoggedIn || !adminId) {
        window.location.href = 'admin.html';
        return;
    }
    
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        avatarEl.textContent = adminNickname ? adminNickname[0] : '管';
    }
    
    initNavigation();
    initEditor();
    await loadArticles();
    await loadPhotos();
    await loadMusic();
    await loadSettings();
    await loadActivity();
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const panelId = 'panel-' + item.dataset.panel;
            document.getElementById(panelId).classList.add('active');
            
            const titles = { articles: '文章管理', photos: '影像管理', music: '音乐管理', settings: '网站配置', activity: '活动记录', account: '账户设置' };
            document.getElementById('pageTitle').textContent = titles[item.dataset.panel] || '';
        });
    });
}

function initEditor() {
    quillEditor = new Quill('#editor', {
        theme: 'snow',
        placeholder: '在这里输入文章内容...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'header': [1, 2, 3, false] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });
    
    // 初始化编辑模态框的Quill编辑器
    editQuill = new Quill('#edit-editor', {
        theme: 'snow',
        placeholder: '在这里输入文章内容...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'header': [1, 2, 3, false] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'admin.html';
}

// ============ 文件上传功能 ============
async function uploadFile(file, type = 'images') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const bucketName = 'media';
    const filePath = `${fileName}`;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketName}/${filePath}`, {
            method: 'POST',
            headers: {
                'Content-Type': file.type,
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: file
        });
        
        if (response.ok) {
            return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
        } else {
            const errorText = await response.text();
            throw new Error('上传失败: ' + errorText);
        }
    } catch (err) {
        console.error('上传错误:', err);
        throw err;
    }
}

// 监听图片上传
document.getElementById('photo-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileNameEl = document.getElementById('photo-file-name');
    const submitBtn = document.getElementById('photo-submit-btn');
    const urlInput = document.getElementById('photo-url');
    
    fileNameEl.textContent = '上传中...';
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    
    try {
        const url = await uploadFile(file, 'images');
        urlInput.value = url;
        fileNameEl.textContent = '上传成功: ' + file.name;
    } catch (err) {
        fileNameEl.textContent = '上传失败，请重试';
        alert('图片上传失败，请检查Storage配置或手动输入URL');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
    }
});

// 监听文章封面上传
document.getElementById('article-cover-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileNameEl = document.getElementById('article-cover-file-name');
    const urlInput = document.getElementById('article-cover');
    
    fileNameEl.textContent = '上传中...';
    
    try {
        const url = await uploadFile(file, 'images');
        urlInput.value = url;
        fileNameEl.textContent = '上传成功: ' + file.name;
    } catch (err) {
        fileNameEl.textContent = '上传失败，请重试';
    }
});

// 监听音频上传
document.getElementById('music-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileNameEl = document.getElementById('music-file-name');
    const submitBtn = document.getElementById('music-submit-btn');
    const urlInput = document.getElementById('music-url');
    
    fileNameEl.textContent = '上传中...';
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    
    try {
        const url = await uploadFile(file, 'audio');
        urlInput.value = url;
        fileNameEl.textContent = '上传成功: ' + file.name;
    } catch (err) {
        fileNameEl.textContent = '上传失败，请重试';
        alert('音频上传失败，请检查Storage配置或手动输入URL');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
    }
});

function showMessage(type, text) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    const content = document.querySelector('.panel.active .card');
    if (content) {
        content.insertBefore(msg, content.firstChild);
    }
    setTimeout(() => msg.remove(), 3000);
}

// ============ 文章管理 ============
document.getElementById('articleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('article-title').value;
    const tag = document.getElementById('article-tag').value;
    const cover = document.getElementById('article-cover').value;
    const content = quillEditor.root.innerHTML;
    const excerpt = quillEditor.getText().substring(0, 150).trim() + '...';
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                title,
                tag,
                cover_image: cover,
                content,
                excerpt,
                status: 'published',
                created_at: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            showMessage('success', '文章发布成功！');
            e.target.reset();
            quillEditor.root.innerHTML = '';
            loadArticles();
            logActivity('create', 'article', title);
        } else {
            showMessage('error', '发布失败');
        }
    } catch (err) {
        showMessage('error', '网络错误');
    }
});

async function loadArticles() {
    const container = document.getElementById('articlesList');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const articles = await response.json();
        
        if (articles.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无文章，发布第一篇吧</div>';
            return;
        }
        
        container.innerHTML = articles.map(a => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${a.title}</div>
                    <div class="item-meta">${new Date(a.created_at).toLocaleDateString('zh-CN')} · <span class="tag">${a.tag}</span></div>
                </div>
                <div class="item-actions">
                    <button class="btn" onclick="editArticle('${a.id}')">编辑</button>
                    <button class="btn btn-danger" onclick="deleteArticle('${a.id}')">删除</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state">加载失败</div>';
    }
}

async function deleteArticle(id) {
    if (!confirm('确定要删除这篇文章吗？')) return;
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        showMessage('success', '删除成功');
        loadArticles();
    } catch (err) {
        showMessage('error', '删除失败');
    }
}

// 编辑文章
async function editArticle(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const articles = await response.json();
        if (articles.length > 0) {
            const article = articles[0];
            document.getElementById('edit-article-id').value = article.id;
            document.getElementById('edit-article-title').value = article.title;
            document.getElementById('edit-article-tag').value = article.tag;
            document.getElementById('edit-article-cover').value = article.cover_image || '';
            editQuill.root.innerHTML = article.content || '';
            document.getElementById('editModal').classList.add('active');
        }
    } catch (err) {
        showMessage('error', '加载文章失败');
    }
}

// 保存编辑
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-article-id').value;
    const title = document.getElementById('edit-article-title').value;
    const tag = document.getElementById('edit-article-tag').value;
    const cover = document.getElementById('edit-article-cover').value;
    const content = editQuill.root.innerHTML;
    const excerpt = editQuill.getText().substring(0, 150).trim() + '...';
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ title, tag, cover_image: cover, content, excerpt })
        });
        showMessage('success', '修改成功！');
        document.getElementById('editModal').classList.remove('active');
        loadArticles();
    } catch (err) {
        showMessage('error', '修改失败');
    }
});

// ============ 影像管理 ============
document.getElementById('photoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('photo-title').value,
        category: document.getElementById('photo-category').value,
        image_url: document.getElementById('photo-url').value,
        description: document.getElementById('photo-desc').value,
        created_at: new Date().toISOString()
    };
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/photos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(data)
        });
        showMessage('success', '添加成功！');
        e.target.reset();
        loadPhotos();
        logActivity('create', 'photo', data.title);
    } catch (err) {
        showMessage('error', '添加失败');
    }
});

async function loadPhotos() {
    const container = document.getElementById('photosList');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/photos?order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const photos = await response.json();
        
        if (photos.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无影像作品</div>';
            return;
        }
        
        container.innerHTML = photos.map(p => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${p.title}</div>
                    <div class="item-meta">${new Date(p.created_at).toLocaleDateString('zh-CN')} · <span class="tag">${p.category}</span></div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger" onclick="deletePhoto('${p.id}')">删除</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state">加载失败</div>';
    }
}

async function deletePhoto(id) {
    if (!confirm('确定要删除这个作品吗？')) return;
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/photos?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        showMessage('success', '删除成功');
        loadPhotos();
    } catch (err) {
        showMessage('error', '删除失败');
    }
}

// ============ 音乐管理 ============
document.getElementById('musicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const type = document.getElementById('music-type').value;
    const durationVal = document.getElementById('music-duration').value;
    const data = {
        title: document.getElementById('music-title').value,
        type: type
    };
    const url = document.getElementById('music-url').value;
    if (url) data.audio_url = url;
    if (durationVal) data.duration = parseInt(durationVal);
    if (document.getElementById('music-artist').value) data.artist = document.getElementById('music-artist').value;
    if (document.getElementById('music-desc').value) data.description = document.getElementById('music-desc').value;
    if (document.getElementById('music-tag').value) data.tag = document.getElementById('music-tag').value;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/music_tracks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showMessage('success', '添加成功！');
            e.target.reset();
            loadMusic();
            logActivity('create', 'music', data.title);
        } else {
            const errText = await response.text();
            showMessage('error', '添加失败: ' + errText);
        }
    } catch (err) {
        showMessage('error', '添加失败');
    }
});

async function loadMusic() {
    const container = document.getElementById('musicList');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/music_tracks?order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const tracks = await response.json();
        
        if (tracks.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无音乐</div>';
            return;
        }
        
        const typeMap = { recent: '最近在听', favorite: '推荐歌单', creation: '我的创作' };
        
        container.innerHTML = tracks.map(t => `
            <div class="item">
                <div class="item-info">
                    <div class="item-title">${t.title}</div>
                    <div class="item-meta">${t.artist || '未知艺术家'} · <span class="tag">${typeMap[t.type] || t.type || '未分类'}</span></div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger" onclick="deleteMusic('${t.id}')">删除</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state">加载失败</div>';
    }
}

async function deleteMusic(id) {
    if (!confirm('确定要删除这首音乐吗？')) return;
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/music_tracks?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        showMessage('success', '删除成功');
        loadMusic();
    } catch (err) {
        showMessage('error', '删除失败');
    }
}

// ============ 网站配置 ============
async function loadSettings() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/site_config`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const configs = await response.json();
        
        configs.forEach(c => {
            const el = document.getElementById('cfg-' + c.key);
            if (el) el.value = c.value || '';
        });
    } catch (err) {
        console.error('加载配置失败', err);
    }
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fields = [
        { key: 'site_title', value: document.getElementById('cfg-site_title').value },
        { key: 'site_subtitle', value: document.getElementById('cfg-site_subtitle').value },
        { key: 'cover_issue', value: document.getElementById('cfg-cover_issue').value },
        { key: 'cover_date', value: document.getElementById('cfg-cover_date').value },
        { key: 'toc_label', value: document.getElementById('cfg-toc_label').value },
        { key: 'cover_description', value: document.getElementById('cfg-cover_description').value },
        { key: 'cover_quote', value: document.getElementById('cfg-cover_quote').value },
        { key: 'writing_intro', value: document.getElementById('cfg-writing_intro').value },
        { key: 'visual_intro', value: document.getElementById('cfg-visual_intro').value },
        { key: 'music_intro', value: document.getElementById('cfg-music_intro').value },
        { key: 'about_intro_title', value: document.getElementById('cfg-about_intro_title').value },
        { key: 'about_intro_text', value: document.getElementById('cfg-about_intro_text').value },
        { key: 'footer_text', value: document.getElementById('cfg-footer_text').value },
        { key: 'footer_copyright', value: document.getElementById('cfg-footer_copyright').value }
    ];
    
    for (const field of fields) {
        if (field.value !== undefined && field.value !== null && field.value !== '') {
            await saveConfig(field.key, field.value);
        }
    }
    
    showMessage('success', '配置已保存！');
});

async function saveConfig(key, value) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_config?key=eq.${key}`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const existing = await response.json();
    
    if (existing.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/site_config?key=eq.${key}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ value })
        });
    } else {
        await fetch(`${SUPABASE_URL}/rest/v1/site_config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ key, value })
        });
    }
}

// ============ 账户设置 ============
document.getElementById('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    
    if (!newPass || newPass.length < 6) {
        showMessage('error', '密码长度至少6位');
        return;
    }
    
    if (newPass !== confirmPass) {
        showMessage('error', '两次密码不一致');
        return;
    }
    
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/admins?id=eq.${adminId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ password: newPass })
        });
        showMessage('success', '密码修改成功！');
        e.target.reset();
    } catch (err) {
        showMessage('error', '修改失败');
    }
});

// ============ 活动记录 ============
async function logActivity(action, type, title) {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                action: action,
                content_type: type,
                content_title: title,
                admin_id: adminId,
                created_at: new Date().toISOString()
            })
        });
    } catch (err) {
        console.error('记录活动失败', err);
    }
}

async function loadActivity() {
    const container = document.getElementById('activityList');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_log?order=created_at.desc&limit=50`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const logs = await response.json();
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无活动记录</div>';
            return;
        }
        
        const actionMap = { create: '添加', update: '修改', delete: '删除' };
        const typeMap = { article: '文章', photo: '影像', music: '音乐' };
        
        container.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div class="activity-icon ${log.action}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${log.action === 'create' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' : 
                          log.action === 'update' ? '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>' : 
                          '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'}
                    </svg>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${actionMap[log.action] || log.action}了${typeMap[log.content_type] || log.content_type}：${log.content_title || '未知'}</div>
                    <div class="activity-time">${new Date(log.created_at).toLocaleString('zh-CN')}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<div class="empty-state">加载失败</div>';
    }
}