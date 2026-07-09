/**
 * ============================================
 * Feed.js — Render Feed & Post Card
 * ============================================
 */

const Feed = (() => {
    
    let currentSort = 'hot';
    let displayedCount = 0;
    const PAGE_SIZE = 10;
    
    // Render single post card
    const renderPostCard = (post) => {
        const author = Storage.getUserById(post.authorId);
        if (!author) return '';
        
        const currentUser = Storage.getCurrentUser();
        const voteStatus = Storage.getVoteStatus(post.id);
        const score = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
        const isBookmarked = Storage.isBookmarked(post.id);
        const isOwner = currentUser && currentUser.id === post.authorId;
        
        // Media
        let mediaHtml = '';
        if (post.type === 'image' && post.media?.length) {
            if (post.media.length === 1) {
                mediaHtml = `<div class="post-media"><img src="${post.media[0]}" alt="Post image" loading="lazy"></div>`;
            } else {
                mediaHtml = `<div class="post-media multi-images">${post.media.slice(0, 4).map(m => `<img src="${m}" alt="" loading="lazy">`).join('')}</div>`;
            }
        } else if (post.type === 'video' && post.media?.length) {
            mediaHtml = `<div class="post-media video-player"><video src="${post.media[0]}" controls preload="metadata"></video></div>`;
        }
        
        // Poll
        let pollHtml = '';
        if (post.type === 'poll' && post.poll) {
            const totalVotes = post.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
            pollHtml = `<div class="post-poll">${post.poll.options.map((opt, i) => {
                const votes = opt.votes?.length || 0;
                const percent = totalVotes > 0 ? (votes / totalVotes * 100).toFixed(0) : 0;
                return `<div class="poll-option" data-poll-index="${i}">
                    <div class="poll-bar" style="width:${percent}%"></div>
                    <div class="poll-text"><span>${UI.sanitize(opt.text)}</span><span>${percent}%</span></div>
                </div>`;
            }).join('')}<p class="text-muted" style="font-size:var(--fs-xs);margin-top:8px">${totalVotes} vote</p></div>`;
        }
        
        // Labels
        let labels = '';
        if (post.isNSFW) labels += '<span class="label-nsfw">NSFW</span>';
        if (post.isSpoiler) labels += '<span class="label-spoiler">SPOILER</span>';
        
        return `
            <article class="post-card reveal" data-post-id="${post.id}">
                <header class="post-header">
                    <img src="${author.avatar}" alt="${UI.sanitize(author.username)}" class="post-avatar">
                    <div class="post-author">
                        <div class="post-author-name">
                            ${UI.sanitize(author.username)}
                            ${author.isPremium ? '<i class="fas fa-crown premium-icon" title="Premium"></i>' : ''}
                        </div>
                        <div class="post-meta">
                            @${UI.sanitize(author.username)} · ${UI.timeAgo(post.createdAt)}
                            ${labels ? ' · ' + labels : ''}
                        </div>
                    </div>
                    <div class="dropdown">
                        <button class="btn-icon post-menu" aria-label="Menu"><i class="fas fa-ellipsis-h"></i></button>
                        <div class="dropdown-menu">
                            ${isOwner ? `<div class="dropdown-item" data-action="edit"><i class="fas fa-edit"></i> Edit</div>` : ''}
                            <div class="dropdown-item" data-action="copy-link"><i class="fas fa-link"></i> Salin Link</div>
                            <div class="dropdown-item" data-action="bookmark"><i class="fas fa-bookmark"></i> ${isBookmarked ? 'Hapus Bookmark' : 'Bookmark'}</div>
                            ${!isOwner ? `<div class="dropdown-item" data-action="follow"><i class="fas fa-user-plus"></i> Follow</div>` : ''}
                            <div class="dropdown-item danger" data-action="report"><i class="fas fa-flag"></i> Laporkan</div>
                            ${isOwner ? `<div class="dropdown-item danger" data-action="delete"><i class="fas fa-trash"></i> Hapus</div>` : ''}
                        </div>
                    </div>
                </header>
                
                <div class="post-content">${UI.formatContent(post.content)}</div>
                
                ${mediaHtml}
                ${pollHtml}
                
                <footer class="post-actions">
                    <div class="vote-group">
                        <button class="vote-btn ${voteStatus === 'up' ? 'upvoted' : ''}" data-vote="up" aria-label="Upvote">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <span class="vote-count">${UI.formatNumber(score)}</span>
                        <button class="vote-btn ${voteStatus === 'down' ? 'downvoted' : ''}" data-vote="down" aria-label="Downvote">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                    <button class="action-btn" data-action="comment">
                        <i class="fas fa-comment"></i> <span>${post.comments?.length || 0}</span>
                    </button>
                    <button class="action-btn" data-action="share">
                        <i class="fas fa-share"></i> <span>${UI.formatNumber(post.shares || 0)}</span>
                    </button>
                    <button class="action-btn ${isBookmarked ? 'active' : ''}" data-action="bookmark">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="action-btn" data-action="view">
                        <i class="fas fa-eye"></i> <span>${UI.formatNumber(post.views || 0)}</span>
                    </button>
                </footer>
            </article>
        `;
    };
    
    // Sort posts
    const sortPosts = (posts, sort) => {
        const sorted = [...posts];
        switch (sort) {
            case 'hot':
                sorted.sort((a, b) => Storage.calculateHotScore(b) - Storage.calculateHotScore(a));
                break;
            case 'trending':
                sorted.sort((a, b) => Storage.calculateTrendingScore(b) - Storage.calculateTrendingScore(a));
                break;
            case 'popular':
                sorted.sort((a, b) => ((b.upvotes?.length || 0) - (b.downvotes?.length || 0)) - ((a.upvotes?.length || 0) - (a.downvotes?.length || 0)));
                break;
            case 'new':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        return sorted;
    };
    
    // Render feed
    const render = (containerId = 'feed', options = {}) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let posts = Storage.getPosts();
        
        // Filter by author
        if (options.authorId) {
            posts = posts.filter(p => p.authorId === options.authorId);
        }
        
        // Filter by hashtag
        if (options.hashtag) {
            posts = posts.filter(p => (p.hashtags || []).includes(options.hashtag));
        }
        
        // Filter by type
        if (options.type) {
            posts = posts.filter(p => p.type === options.type);
        }
        
        // Filter following only
        if (options.followingOnly) {
            const user = Storage.getCurrentUser();
            if (user) {
                posts = posts.filter(p => (user.following || []).includes(p.authorId));
            }
        }
        
        posts = sortPosts(posts, options.sort || currentSort);
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Belum ada posting</h3>
                    <p>Jadilah yang pertama memposting!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(renderPostCard).join('');
        
        // Trigger reveal animation
        setTimeout(() => {
            UI.observeElements('.reveal', (el) => el.classList.add('visible'));
        }, 50);
    };
    
    // Init event listeners
    const init = () => {
        // Tab sort
        document.querySelectorAll('.feed-tabs .tab-btn, .profile-tabs .tab-btn, .notification-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.parentElement;
                parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sort = btn.dataset.sort;
                const tab = btn.dataset.tab;
                const filter = btn.dataset.filter;
                
                if (sort) {
                    currentSort = sort;
                    render('feed');
                } else if (tab) {
                    // Profile tab
                    renderProfileTab(tab);
                } else if (filter) {
                    renderNotifications(filter);
                }
            });
        });
        
        // Event delegation untuk post actions
        document.addEventListener('click', (e) => {
            // Vote
            const voteBtn = e.target.closest('[data-vote]');
            if (voteBtn) {
                const card = voteBtn.closest('.post-card');
                const postId = card.dataset.postId;
                const type = voteBtn.dataset.vote;
                
                if (!Storage.isLoggedIn()) {
                    UI.toast('Login dulu untuk vote', 'warning');
                    return;
                }
                
                Storage.toggleVote(postId, type);
                render('feed');
                return;
            }
            
            // Post action
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const card = actionBtn.closest('.post-card');
                const postId = card?.dataset.postId;
                const action = actionBtn.dataset.action;
                
                handlePostAction(action, postId, card);
                return;
            }
            
            // Dropdown toggle
            const menuBtn = e.target.closest('.post-menu');
            if (menuBtn) {
                const dropdown = menuBtn.closest('.dropdown');
                document.querySelectorAll('.dropdown.open').forEach(d => {
                    if (d !== dropdown) d.classList.remove('open');
                });
                dropdown.classList.toggle('open');
                return;
            }
            
            // Close dropdown
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
            }
            
            // Hashtag click
            const hashtag = e.target.closest('.hashtag');
            if (hashtag) {
                window.location.href = `explore.html?hashtag=${hashtag.dataset.hashtag}`;
                return;
            }
            
            // Mention click
            const mention = e.target.closest('.mention');
            if (mention) {
                const user = Storage.getUserByUsername(mention.dataset.username);
                if (user) window.location.href = `profile.html?id=${user.id}`;
                return;
            }
            
            // Image click (viewer)
            const img = e.target.closest('.post-media img');
            if (img) {
                showImageViewer(img.src);
            }
        });
    };
    
    // Handle post action
    const handlePostAction = (action, postId, card) => {
        if (!Storage.isLoggedIn() && !['view'].includes(action)) {
            UI.toast('Login dulu ya', 'warning');
            return;
        }
        
        switch (action) {
            case 'comment':
                showCommentModal(postId);
                break;
            case 'share':
                const url = window.location.href.split('?')[0] + '?post=' + postId;
                UI.copyToClipboard(url);
                const post = Storage.getPostById(postId);
                if (post) {
                    post.shares = (post.shares || 0) + 1;
                    Storage.updatePost(postId, { shares: post.shares });
                }
                break;
            case 'bookmark':
                Storage.toggleBookmark(postId);
                UI.toast('Bookmark diperbarui', 'success');
                render('feed');
                break;
            case 'copy-link':
                UI.copyToClipboard(window.location.href.split('?')[0] + '?post=' + postId);
                break;
            case 'delete':
                UI.confirm('Yakin ingin menghapus posting ini?', () => {
                    Storage.deletePost(postId);
                    UI.toast('Posting dihapus', 'success');
                    render('feed');
                });
                break;
            case 'report':
                UI.toast('Laporan telah dikirim. Terima kasih!', 'info');
                break;
            case 'follow':
                const post = Storage.getPostById(postId);
                if (post) {
                    Storage.toggleFollow(post.authorId);
                    UI.toast('Follow diperbarui', 'success');
                }
                break;
        }
    };
    
    // Comment modal
    const showCommentModal = (postId) => {
        const post = Storage.getPostById(postId);
        if (!post) return;
        
        const comments = Storage.getCommentsByPost(postId);
        const currentUser = Storage.getCurrentUser();
        
        const commentsHtml = comments.length > 0 ? comments.map(c => {
            const author = Storage.getUserById(c.authorId);
            if (!author) return '';
            return `
                <div class="comment">
                    <img src="${author.avatar}" class="comment-avatar" alt="">
                    <div class="comment-body">
                        <div>
                            <span class="comment-author">${UI.sanitize(author.username)}</span>
                            <span class="comment-time">${UI.timeAgo(c.createdAt)}</span>
                        </div>
                        <div class="comment-text">${UI.formatContent(c.content)}</div>
                        <div class="comment-actions">
                            <span class="comment-action">❤ ${c.likes?.length || 0}</span>
                            <span class="comment-action">Balas</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<p class="text-muted" style="text-align:center;padding:20px">Belum ada komentar. Jadilah yang pertama!</p>';
        
        UI.modal({
            title: 'Komentar',
            content: `
                <div style="max-height:300px;overflow-y:auto;margin-bottom:16px">${commentsHtml}</div>
                <textarea id="comment-input" placeholder="Tulis komentar..." style="width:100%;min-height:80px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);resize:vertical;font-family:inherit"></textarea>
            `,
            confirmText: 'Kirim',
            onConfirm: () => {
                const input = document.getElementById('comment-input');
                const content = input?.value.trim();
                if (!content) {
                    UI.toast('Komentar tidak boleh kosong', 'warning');
                    return;
                }
                Storage.createComment({ postId, content });
                
                // Notifikasi ke author post
                if (post.authorId !== currentUser.id) {
                    Storage.addNotification({
                        userId: post.authorId,
                        type: 'comment',
                        fromUserId: currentUser.id,
                        postId,
                        content: 'mengomentari posting Anda'
                    });
                }
                
                UI.toast('Komentar terkirim!', 'success');
                render('feed');
            }
        });
    };
    
    // Image viewer
    const showImageViewer = (src) => {
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        viewer.innerHTML = `
            <button class="image-viewer-close"><i class="fas fa-times"></i></button>
            <img src="${src}" alt="">
        `;
        document.body.appendChild(viewer);
        
        viewer.onclick = (e) => {
            if (e.target === viewer || e.target.closest('.image-viewer-close')) {
                viewer.remove();
            }
        };
    };
    
    // Render profile tab
    const renderProfileTab = (tab) => {
        // Implementasi di profile.js
        if (typeof Profile !== 'undefined') Profile.renderTab(tab);
    };
    
    // Render notifications
    const renderNotifications = (filter) => {
        if (typeof Notification !== 'undefined' && Notification.render) {
            Notification.render(filter);
        }
    };
    
    return { init, render, renderPostCard, sortPosts };
})();