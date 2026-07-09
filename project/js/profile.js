const Profile = (() => {
    const init = () => {
        if (!document.getElementById('profile-banner')) return;
        
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id');
        const user = userId ? Storage.getUserById(userId) : Storage.getCurrentUser();
        
        if (!user) {
            document.getElementById('main-content').innerHTML = '<div class="empty-state"><h3>User tidak ditemukan</h3></div>';
            return;
        }
        
        renderProfile(user);
    };
    
    const renderProfile = (user) => {
        const currentUser = Storage.getCurrentUser();
        const isOwner = currentUser && currentUser.id === user.id;
        const isFollowing = Storage.isFollowing(user.id);
        
        const posts = Storage.getPosts().filter(p => p.authorId === user.id);
        const totalUpvotes = posts.reduce((sum, p) => sum + (p.upvotes?.length || 0), 0);
        
        document.getElementById('profile-banner').style.backgroundImage = user.banner ? `url(${user.banner})` : '';
        document.getElementById('profile-avatar').src = user.avatar;
        document.getElementById('display-name').textContent = user.username;
        document.getElementById('profile-username').textContent = '@' + user.username;
        document.getElementById('profile-bio').textContent = user.bio || 'Belum ada bio';
        document.getElementById('profile-location').innerHTML = user.location ? `<i class="fas fa-map-marker-alt"></i> ${UI.sanitize(user.location)}` : '';
        document.getElementById('profile-website').innerHTML = user.website ? `<i class="fas fa-link"></i> <a href="${user.website}" target="_blank">${UI.sanitize(user.website)}</a>` : '';
        document.getElementById('profile-joined').innerHTML = `<i class="fas fa-calendar"></i> Bergabung ${UI.timeAgo(user.joinedAt)}`;
        
        document.getElementById('stat-posts').textContent = posts.length;
        document.getElementById('stat-followers').textContent = UI.formatNumber(user.followers?.length || 0);
        document.getElementById('stat-following').textContent = UI.formatNumber(user.following?.length || 0);
        document.getElementById('stat-likes').textContent = UI.formatNumber(totalUpvotes);
        
        if (user.isPremium) {
            document.getElementById('premium-badge').style.display = 'inline-flex';
        }
        
        const actions = document.getElementById('profile-actions');
        if (isOwner) {
            actions.innerHTML = `
                <button class="btn btn-outline" id="edit-profile-btn"><i class="fas fa-edit"></i> Edit Profil</button>
            `;
            document.getElementById('edit-banner').style.display = 'flex';
            document.getElementById('edit-avatar').style.display = 'flex';
            
            document.getElementById('edit-profile-btn').addEventListener('click', () => {
                showEditProfileModal(user);
            });
        } else if (currentUser) {
            actions.innerHTML = `
                <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'}" id="follow-btn">
                    <i class="fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}"></i>
                    ${isFollowing ? 'Mengikuti' : 'Ikuti'}
                </button>
                <a href="message.html?to=${user.id}" class="btn btn-outline"><i class="fas fa-envelope"></i> Pesan</a>
            `;
            document.getElementById('follow-btn').addEventListener('click', () => {
                Storage.toggleFollow(user.id);
                UI.toast('Follow diperbarui', 'success');
                renderProfile(Storage.getUserById(user.id));
            });
        }
        
        renderTab('posts');
    };
    
    const renderTab = (tab) => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id');
        const user = userId ? Storage.getUserById(userId) : Storage.getCurrentUser();
        if (!user) return;
        
        const container = document.getElementById('profile-feed');
        let posts = [];
        
        switch (tab) {
            case 'posts':
                posts = Storage.getPosts().filter(p => p.authorId === user.id);
                break;
            case 'media':
                posts = Storage.getPosts().filter(p => p.authorId === user.id && ['image', 'video'].includes(p.type));
                break;
            case 'likes':
                posts = Storage.getPosts().filter(p => (p.upvotes || []).includes(user.id));
                break;
            case 'replies':
                const comments = Storage.getComments().filter(c => c.authorId === user.id);
                posts = comments.map(c => Storage.getPostById(c.postId)).filter(Boolean);
                break;
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Belum ada konten</h3></div>';
            return;
        }
        
        container.innerHTML = posts.map(Feed.renderPostCard).join('');
    };
    
    const showEditProfileModal = (user) => {
        UI.modal({
            title: 'Edit Profil',
            content: `
                <div class="form-group">
                    <label>Bio</label>
                    <textarea id="edit-bio" style="width:100%;min-height:80px;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);resize:vertical">${UI.sanitize(user.bio || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Lokasi</label>
                    <input type="text" id="edit-location" value="${UI.sanitize(user.location || '')}" style="width:100%;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
                </div>
                <div class="form-group">
                    <label>Website</label>
                    <input type="url" id="edit-website" value="${UI.sanitize(user.website || '')}" style="width:100%;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md)">
                </div>
            `,
            confirmText: 'Simpan',
            onConfirm: () => {
                const bio = document.getElementById('edit-bio').value;
                const location = document.getElementById('edit-location').value;
                const website = document.getElementById('edit-website').value;
                Storage.updateUser(user.id, { bio, location, website });
                UI.toast('Profil diperbarui', 'success');
                renderProfile(Storage.getUserById(user.id));
            }
        });
    };
    
    return { init, renderTab };
})();