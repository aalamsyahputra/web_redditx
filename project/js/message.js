const MessageModule = (() => {
    let activeChat = null;
    
    const init = () => {
        if (!document.getElementById('chat-items')) return;
        renderChatList();
        
        const params = new URLSearchParams(window.location.search);
        const toId = params.get('to');
        if (toId) openChat(toId);
    };
    
    const renderChatList = () => {
        const user = Storage.getCurrentUser();
        if (!user) return;
        
        const convos = Storage.getConversations(user.id);
        const container = document.getElementById('chat-items');
        
        if (convos.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding:40px 20px"><i class="fas fa-comments"></i><p>Belum ada percakapan</p></div>';
            return;
        }
        
        container.innerHTML = convos.map(m => {
            const otherId = m.fromId === user.id ? m.toId : m.fromId;
            const other = Storage.getUserById(otherId);
            if (!other) return '';
            return `
                <div class="chat-item" data-user-id="${other.id}">
                    <img src="${other.avatar}" alt="">
                    <div class="chat-item-info">
                        <div class="name">${UI.sanitize(other.username)}</div>
                        <div class="last-msg">${UI.sanitize(m.content.substring(0, 40))}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => openChat(item.dataset.userId));
        });
    };
    
    const openChat = (userId) => {
        const user = Storage.getCurrentUser();
        const other = Storage.getUserById(userId);
        if (!user || !other) return;
        
        activeChat = userId;
        const messages = Storage.getMessages(user.id, userId);
        const area = document.getElementById('chat-area');
        
        area.innerHTML = `
            <div class="chat-header" style="padding:16px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:12px">
                <img src="${other.avatar}" style="width:40px;height:40px;border-radius:50%">
                <div>
                    <div style="font-weight:600">${UI.sanitize(other.username)}</div>
                    <div style="font-size:12px;color:var(--color-text-muted)">Online</div>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px">
                ${messages.map(m => `
                    <div class="chat-bubble" style="max-width:70%;padding:10px 14px;border-radius:18px;background:${m.fromId === user.id ? 'var(--color-primary)' : 'var(--color-bg)'};color:${m.fromId === user.id ? 'white' : 'var(--color-text)'};align-self:${m.fromId === user.id ? 'flex-end' : 'flex-start'}">
                        ${UI.sanitize(m.content)}
                        <div style="font-size:10px;opacity:0.7;margin-top:4px">${UI.timeAgo(m.createdAt)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-area" style="padding:16px;border-top:1px solid var(--color-border);display:flex;gap:8px">
                <input type="text" id="message-input" placeholder="Ketik pesan..." style="flex:1;padding:10px 16px;border:1px solid var(--color-border);border-radius:24px">
                <button class="btn btn-primary" id="send-btn"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        
        const send = () => {
            const content = input.value.trim();
            if (!content) return;
            Storage.sendMessage(userId, content);
            input.value = '';
            openChat(userId);
        };
        
        sendBtn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') send();
        });
        
        const messagesEl = document.getElementById('chat-messages');
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };
    
    return { init };
})();