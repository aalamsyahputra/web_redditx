const NotificationModule = (() => {
    const init = () => {
        if (!document.getElementById('notification-list')) return;
        render('all');
        
        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            const user = Storage.getCurrentUser();
            if (user) {
                Storage.markNotificationsRead(user.id);
                UI.toast('Semua notifikasi ditandai dibaca', 'success');
                render('all');
                App.renderHeader();
            }
        });
    };
    
    const render = (filter = 'all') => {
        const user = Storage.getCurrentUser();
        if (!user) return;
        
        const container = document.getElementById('notification-list');
        let notifications = Storage.getNotifications(user.id);
        
        if (filter !== 'all') {
            const typeMap = {
                mentions: 'mention',
                likes: 'like',
                follows: 'follow'
            };
            notifications = notifications.filter(n => n.type === typeMap[filter]);
        }
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><h3>Tidak ada notifikasi</h3></div>';
            return;
        }
        
        container.innerHTML = notifications.map(n => {
            const from = Storage.getUserById(n.fromUserId);
            if (!from) return '';
            const icons = { like: 'heart', comment: 'comment', follow: 'user-plus', mention: 'at' };
            return `
                <div class="notification-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                    <div class="notification-icon ${n.type}">
                        <i class="fas fa-${icons[n.type] || 'bell'}"></i>
                    </div>
                    <div class="notification-content">
                        <p><strong>${UI.sanitize(from.username)}</strong> ${UI.sanitize(n.content || '')}</p>
                        <span class="time">${UI.timeAgo(n.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');
    };
    
    return { init, render };
})();

// Alias agar tidak bentrok dengan Notification API browser
window.NotificationModule = NotificationModule;