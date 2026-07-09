/**
 * ============================================
 * App.js — Bootstrap & Shell
 * ============================================
 */

const App = (() => {
    
    // Render header
    const renderHeader = () => {
        const header = document.getElementById('header');
        if (!header) return;
        
        const user = Storage.getCurrentUser();
        const notifCount = user ? Storage.getNotifications(user.id).filter(n => !n.read).length : 0;
        
        header.innerHTML = `
            <button class="icon-btn menu-toggle" id="menu-toggle" style="display:none" aria-label="Menu">
                <i class="fas fa-bars"></i>
            </button>
            <a href="index.html" class="logo">
                <i class="fas fa-fire text-primary"></i>
                <span>RedditX</span>
            </a>
            <div class="header-search">
                <i class="fas fa-search"></i>
                <input type="text" id="global-search" placeholder="Cari di RedditX...">
            </div>
            <div class="header-actions">
                <button class="icon-btn" id="theme-toggle" aria-label="Ganti tema">
                    <i class="fas fa-moon"></i>
                </button>
                ${user ? `
                    <a href="notification.html" class="icon-btn" aria-label="Notifikasi">
                        <i class="fas fa-bell"></i>
                        ${notifCount > 0 ? `<span class="badge">${notifCount > 9 ? '9+' : notifCount}</span>` : ''}
                    </a>
                    <a href="message.html" class="icon-btn" aria-label="Pesan">
                        <i class="fas fa-envelope"></i>
                    </a>
                    <a href="premium.html" class="icon-btn" aria-label="Premium">
                        <i class="fas fa-crown" style="color:#FFB300"></i>
                    </a>
                    <a href="profile.html?id=${user.id}">
                        <img src="${user.avatar}" alt="${UI.sanitize(user.username)}" class="header-avatar">
                    </a>
                ` : `
                    <a href="login.html" class="btn btn-outline">Masuk</a>
                    <a href="signup.html" class="btn btn-primary">Daftar</a>
                `}
            </div>
        `;
        
        // Event listeners
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const newTheme = DarkMode.toggle();
            const icon = document.querySelector('#theme-toggle i');
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
        
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar-left')?.classList.toggle('mobile-open');
        });
        
        // Global search
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const q = searchInput.value.trim();
                    if (q) window.location.href = `explore.html?q=${encodeURIComponent(q)}`;
                }
            });
        }
    };
    
    // Render sidebar kiri
    const renderSidebarLeft = () => {
        const sidebar = document.getElementById('sidebar-left');
        if (!sidebar) return;
        
        const user = Storage.getCurrentUser();
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        const navItems = [
            { icon: 'fa-home', label: 'Beranda', href: 'index.html' },
            { icon: 'fa-compass', label: 'Jelajahi', href: 'explore.html' },
            { icon: 'fa-fire', label: 'Trending', href: 'index.html?sort=trending' },
            { icon: 'fa-star', label: 'Populer', href: 'index.html?sort=popular' },
        ];
        
        if (user) {
            navItems.push(
                { icon: 'fa-user-friends', label: 'Mengikuti', href: 'index.html?following=1' },
                { divider: true },
                { icon: 'fa-crown', label: 'Premium', href: 'premium.html' },
                { icon: 'fa-bell', label: 'Notifikasi', href: 'notification.html' },
                { icon: 'fa-envelope', label: 'Pesan', href: 'message.html' },
                { icon: 'fa-bookmark', label: 'Bookmark', href: 'index.html?bookmarks=1' },
                { icon: 'fa-user', label: 'Profil', href: `profile.html?id=${user.id}` },
                { divider: true },
                { icon: 'fa-cog', label: 'Pengaturan', href: 'settings.html' },
                { icon: 'fa-sign-out-alt', label: 'Keluar', href: '#', action: 'logout' }
            );
        }
        
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                ${navItems.map(item => {
                    if (item.divider) return '<div class="sidebar-divider"></div>';
                    const active = currentPage === item.href.split('?')[0] ? 'active' : '';
                    return `
                        <a href="${item.href}" class="sidebar-item ${active}" ${item.action ? `data-action="${item.action}"` : ''}>
                            <i class="fas ${item.icon}"></i>
                            <span>${item.label}</span>
                        </a>
                    `;
                }).join('')}
            </nav>
        `;
        
        // Logout action
        sidebar.querySelector('[data-action="logout"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            UI.confirm('Yakin ingin keluar?', () => {
                Auth.logout();
                UI.toast('Berhasil keluar', 'success');
                setTimeout(() => window.location.href = 'index.html', 500);
            });
        });
    };
    
    // Render sidebar kanan
    const renderSidebarRight = () => {
        const sidebar = document.getElementById('sidebar-right');
        if (!sidebar) return;
        
        const posts = Storage.getPosts();
        const users = Storage.getUsers();
        const currentUser = Storage.getCurrentUser();
        
        // Trending hashtags
        const hashtagCount = {};
        posts.forEach(p => (p.hashtags || []).forEach(h => hashtagCount[h] = (hashtagCount[h] || 0) + 1));
        const trendingHashtags = Object.entries(hashtagCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        // Suggested users
        const suggestedUsers = users
            .filter(u => !currentUser || u.id !== currentUser.id)
            .filter(u => !currentUser || !(currentUser.following || []).includes(u.id))
            .slice(0, 3);
        
        sidebar.innerHTML = `
            ${trendingHashtags.length > 0 ? `
                <div class="widget">
                    <h3 class="widget-title">🔥 Trending</h3>
                    ${trendingHashtags.map(([tag, count]) => `
                        <a href="explore.html?hashtag=${tag}" class="trending-item">
                            <div class="category">Trending</div>
                            <div class="title">#${UI.sanitize(tag)}</div>
                            <div class="count">${count} posting</div>
                        </a>
                    `).join('')}
                </div>
            ` : ''}
            
            ${suggestedUsers.length > 0 ? `
                <div class="widget">
                    <h3 class="widget-title">Siapa yang harus diikuti</h3>
                    ${suggestedUsers.map(u => `
                        <div class="user-suggest">
                            <a href="profile.html?id=${u.id}"><img src="${u.avatar}" alt=""></a>
                            <div class="user-suggest-info">
                                <a href="profile.html?id=${u.id}" class="name">${UI.sanitize(u.username)}</a>
                                <div class="handle">@${UI.sanitize(u.username)}</div>
                            </div>
                            <button class="btn-follow" data-user-id="${u.id}">Ikuti</button>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="ad-placeholder">
                Ruang Iklan 300x250
            </div>
            
            <div class="widget" style="font-size:var(--fs-xs);color:var(--color-text-muted)">
                <p>© 2024 RedditX</p>
                <p style="margin-top:8px">
                    <a href="#" class="link">Tentang</a> · 
                    <a href="#" class="link">Privasi</a> · 
                    <a href="#" class="link">Syarat</a> · 
                    <a href="#" class="link">Bantuan</a>
                </p>
            </div>
        `;
        
        // Follow button
        sidebar.querySelectorAll('.btn-follow').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!Storage.isLoggedIn()) {
                    UI.toast('Login dulu untuk mengikuti', 'warning');
                    return;
                }
                const userId = btn.dataset.userId;
                Storage.toggleFollow(userId);
                UI.toast('Follow diperbarui', 'success');
                renderSidebarRight();
            });
        });
    };
    
    // Render composer (form buat post)
    const renderComposer = () => {
        const composer = document.getElementById('composer');
        if (!composer) return;
        
        const user = Storage.getCurrentUser();
        if (!user) {
            composer.innerHTML = `
                <div style="text-align:center;padding:var(--space-lg)">
                    <p style="margin-bottom:var(--space-md)">Masuk untuk mulai memposting</p>
                    <a href="login.html" class="btn btn-primary">Masuk</a>
                </div>
            `;
            return;
        }
        
        composer.innerHTML = `
            <div class="composer-inner">
                <img src="${user.avatar}" alt="" class="composer-avatar">
                <div class="composer-input">
                    <textarea class="composer-textarea" id="post-content" placeholder="Apa yang ada di pikiranmu, ${UI.sanitize(user.username)}?" maxlength="2000"></textarea>
                    <div class="composer-preview" id="composer-preview"></div>
                    <div class="composer-footer">
                        <div class="composer-tools">
                            <button class="tool-btn" data-tool="image" aria-label="Gambar"><i class="fas fa-image"></i></button>
                            <button class="tool-btn" data-tool="video" aria-label="Video"><i class="fas fa-video"></i></button>
                            <button class="tool-btn" data-tool="poll" aria-label="Polling"><i class="fas fa-poll"></i></button>
                            <button class="tool-btn" data-tool="emoji" aria-label="Emoji"><i class="fas fa-smile"></i></button>
                            <button class="tool-btn" data-tool="nsfw" aria-label="NSFW"><i class="fas fa-exclamation-triangle"></i></button>
                        </div>
                        <button class="btn btn-primary" id="post-submit">
                            <i class="fas fa-paper-plane"></i> Posting
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Tool handlers
        let postMedia = [];
        let postType = 'text';
        let isNSFW = false;
        
        composer.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                
                if (tool === 'image') {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = async (e) => {
                        const files = Array.from(e.target.files);
                        if (files.length > 4) {
                            UI.toast('Maksimal 4 gambar', 'warning');
                            return;
                        }
                        for (const file of files) {
                            if (file.size > 5 * 1024 * 1024) {
                                UI.toast('Ukuran gambar maksimal 5MB', 'warning');
                                continue;
                            }
                            const base64 = await UI.fileToBase64(file);
                            postMedia.push(base64);
                        }
                        postType = 'image';
                        renderPreview();
                    };
                    input.click();
                } else if (tool === 'video') {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/mp4,video/webm,video/quicktime';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 200 * 1024 * 1024) {
                            UI.toast('Ukuran video maksimal 200MB', 'warning');
                            return;
                        }
                        const base64 = await UI.fileToBase64(file);
                        postMedia = [base64];
                        postType = 'video';
                        renderPreview();
                    };
                    input.click();
                } else if (tool === 'nsfw') {
                    isNSFW = !isNSFW;
                    btn.style.background = isNSFW ? 'var(--color-primary-light)' : '';
                    UI.toast(isNSFW ? 'Label NSFW aktif' : 'Label NSFW dinonaktif', 'info');
                } else if (tool === 'emoji') {
                    const textarea = document.getElementById('post-content');
                    textarea.value += ' 😊';
                    textarea.focus();
                } else if (tool === 'poll') {
                    const q = prompt('Pertanyaan polling:');
                    if (!q) return;
                    const options = [];
                    for (let i = 0; i < 4; i++) {
                        const opt = prompt(`Opsi ${i + 1} (kosongkan untuk selesai):`);
                        if (!opt) break;
                        options.push({ text: opt, votes: [] });
                    }
                    if (options.length < 2) {
                        UI.toast('Minimal 2 opsi', 'warning');
                        return;
                    }
                    postType = 'poll';
                    window._pollData = { question: q, options };
                    renderPreview();
                }
            });
        });
        
        const renderPreview = () => {
            const preview = document.getElementById('composer-preview');
            if (postType === 'image' && postMedia.length) {
                preview.innerHTML = postMedia.map(m => `<img src="${m}" alt="">`).join('');
            } else if (postType === 'video' && postMedia.length) {
                preview.innerHTML = `<video src="${postMedia[0]}" controls></video>`;
            } else if (postType === 'poll' && window._pollData) {
                preview.innerHTML = `<div style="padding:12px;background:var(--color-bg);border-radius:var(--radius-md)">
                    <strong>${UI.sanitize(window._pollData.question)}</strong>
                    <ul style="margin-top:8px">${window._pollData.options.map(o => `<li>• ${UI.sanitize(o.text)}</li>`).join('')}</ul>
                </div>`;
            } else {
                preview.innerHTML = '';
            }
        };
        
        // Submit
        document.getElementById('post-submit').addEventListener('click', () => {
            const content = document.getElementById('post-content').value.trim();
            if (!content && postMedia.length === 0 && postType !== 'poll') {
                UI.toast('Posting tidak boleh kosong', 'warning');
                return;
            }
            
            try {
                const postData = {
                    type: postType,
                    content,
                    media: postMedia,
                    isNSFW,
                    poll: window._pollData || null
                };
                Storage.createPost(postData);
                UI.toast('Posting berhasil!', 'success');
                
                // Reset
                document.getElementById('post-content').value = '';
                postMedia = [];
                postType = 'text';
                window._pollData = null;
                isNSFW = false;
                renderPreview();
                
                Feed.render('feed');
            } catch (e) {
                UI.toast('Gagal membuat posting: ' + e.message, 'error');
            }
        });
    };
    
    // Init app
    const init = () => {
        // Seed demo data
        Storage.seedDemoData();
        
        // Init modules
        DarkMode.init();
        UI.initRipple();
        
        // Render shell
        renderHeader();
        renderSidebarLeft();
        renderSidebarRight();
        
        // Render page-specific content
        if (document.getElementById('composer')) renderComposer();
        if (document.getElementById('feed')) Feed.render('feed');
        
        // Init feed events
        if (typeof Feed.init === 'function') Feed.init();
        
        // Init auth form
        if (typeof Auth.init === 'function') Auth.init();
        
        // Init profile
        if (typeof Profile !== 'undefined' && Profile.init) Profile.init();
        
        // Init notifications
        if (typeof NotificationModule !== 'undefined' && NotificationModule.init) NotificationModule.init();
        
        // Init messages
        if (typeof MessageModule !== 'undefined' && MessageModule.init) MessageModule.init();
        
        // Init premium
        if (typeof PremiumModule !== 'undefined' && PremiumModule.init) PremiumModule.init();
        
        // Init ads (hanya untuk non-premium)
        if (typeof AdsModule !== 'undefined' && AdsModule.init) {
            const user = Storage.getCurrentUser();
            if (!user || !user.isPremium) {
                AdsModule.init();
            }
        }
        
        // FAB
        const fab = document.getElementById('fab-upload');
        if (fab) {
            fab.addEventListener('click', () => {
                const composer = document.getElementById('composer');
                if (composer) {
                    composer.scrollIntoView({ behavior: 'smooth' });
                    document.getElementById('post-content')?.focus();
                } else if (!Storage.isLoggedIn()) {
                    window.location.href = 'login.html';
                }
            });
        }
        
        // Handle URL params
        handleUrlParams();
    };
    
    // Handle URL params
    const handleUrlParams = () => {
        const params = new URLSearchParams(window.location.search);
        
        if (params.get('sort')) {
            const sort = params.get('sort');
            document.querySelectorAll('.feed-tabs .tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === sort);
            });
        }
        
        if (params.get('following')) {
            const user = Storage.getCurrentUser();
            if (user) {
                Feed.render('feed', { followingOnly: true });
            }
        }
        
        if (params.get('bookmarks')) {
            const user = Storage.getCurrentUser();
            if (user) {
                const bookmarkedPosts = (user.bookmarks || []).map(id => Storage.getPostById(id)).filter(Boolean);
                const container = document.getElementById('feed');
                if (container) {
                    container.innerHTML = bookmarkedPosts.map(Feed.renderPostCard).join('') || '<div class="empty-state"><i class="fas fa-bookmark"></i><h3>Belum ada bookmark</h3></div>';
                }
            }
        }
        
        if (params.get('hashtag')) {
            Feed.render('feed', { hashtag: params.get('hashtag') });
        }
        
        if (params.get('q')) {
            // Search
            const q = params.get('q').toLowerCase();
            const posts = Storage.getPosts().filter(p => 
                (p.content || '').toLowerCase().includes(q) ||
                (p.hashtags || []).some(h => h.toLowerCase().includes(q))
            );
            const container = document.getElementById('explore-feed') || document.getElementById('feed');
            if (container) {
                container.innerHTML = posts.map(Feed.renderPostCard).join('') || '<div class="empty-state"><i class="fas fa-search"></i><h3>Tidak ada hasil</h3></div>';
            }
        }
    };
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    return { init, renderHeader, renderSidebarLeft, renderSidebarRight };
})();