/**
 * ============================================
 * Storage.js — Data Access Layer (DAL)
 * ============================================
 * Semua akses data (users, posts, comments, votes, dll)
 * melalui modul ini. Jika nanti migrasi ke Firebase/Supabase,
 * cukup ganti implementasi di file ini.
 */

const Storage = (() => {
    // Prefix untuk semua key localStorage
    const PREFIX = 'redditx_';
    
    // Helper: ambil data dari localStorage
    const get = (key, defaultValue = null) => {
        try {
            const data = localStorage.getItem(PREFIX + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`[Storage] Error reading ${key}:`, e);
            return defaultValue;
        }
    };
    
    // Helper: simpan data ke localStorage
    const set = (key, value) => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`[Storage] Error writing ${key}:`, e);
            return false;
        }
    };
    
    // Helper: hapus data
    const remove = (key) => {
        localStorage.removeItem(PREFIX + key);
    };
    
    // Helper: generate ID unik
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    };
    
    // ========================================
    // USERS
    // ========================================
    const getUsers = () => get('users', []);
    
    const getUserById = (id) => {
        return getUsers().find(u => u.id === id) || null;
    };
    
    const getUserByUsername = (username) => {
        return getUsers().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    };
    
    const getUserByEmail = (email) => {
        return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    };
    
    const createUser = (userData) => {
        const users = getUsers();
        const newUser = {
            id: generateId(),
            username: userData.username,
            email: userData.email,
            password: userData.password, // Di dunia nyata, harus di-hash!
            avatar: userData.avatar || `https://api.dicebear.com/avataaars.svg?seed=${userData.username}`,
            banner: userData.banner || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            joinedAt: new Date().toISOString(),
            isPremium: false,
            premiumUntil: null,
            followers: [],
            following: [],
            bookmarks: []
        };
        users.push(newUser);
        set('users', users);
        return newUser;
    };
    
    const updateUser = (userId, updates) => {
        const users = getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return null;
        users[idx] = { ...users[idx], ...updates };
        set('users', users);
        return users[idx];
    };
    
    const deleteUser = (userId) => {
        const users = getUsers().filter(u => u.id !== userId);
        set('users', users);
    };
    
    // ========================================
    // CURRENT USER (Session)
    // ========================================
    const getCurrentUser = () => {
        const userId = get('current_user');
        if (!userId) return null;
        return getUserById(userId);
    };
    
    const setCurrentUser = (userId) => {
        if (userId) set('current_user', userId);
        else remove('current_user');
    };
    
    const isLoggedIn = () => !!getCurrentUser();
    
    // ========================================
    // POSTS
    // ========================================
    const getPosts = () => get('posts', []);
    
    const getPostById = (id) => {
        return getPosts().find(p => p.id === id) || null;
    };
    
    const createPost = (postData) => {
        const user = getCurrentUser();
        if (!user) throw new Error('Harus login untuk membuat post');
        
        const posts = getPosts();
        const newPost = {
            id: generateId(),
            authorId: user.id,
            type: postData.type || 'text', // text, image, video, poll
            content: postData.content || '',
            media: postData.media || [],
            poll: postData.poll || null,
            hashtags: extractHashtags(postData.content || ''),
            mentions: extractMentions(postData.content || ''),
            createdAt: new Date().toISOString(),
            upvotes: [],
            downvotes: [],
            comments: [],
            shares: 0,
            views: 0,
            isNSFW: postData.isNSFW || false,
            isSpoiler: postData.isSpoiler || false
        };
        posts.unshift(newPost);
        set('posts', posts);
        return newPost;
    };
    
    const updatePost = (postId, updates) => {
        const posts = getPosts();
        const idx = posts.findIndex(p => p.id === postId);
        if (idx === -1) return null;
        posts[idx] = { ...posts[idx], ...updates };
        set('posts', posts);
        return posts[idx];
    };
    
    const deletePost = (postId) => {
        const posts = getPosts().filter(p => p.id !== postId);
        set('posts', posts);
    };
    
    const incrementViews = (postId) => {
        const posts = getPosts();
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.views = (post.views || 0) + 1;
            set('posts', posts);
        }
    };
    
    // ========================================
    // VOTING
    // ========================================
    const toggleVote = (postId, type) => {
        const user = getCurrentUser();
        if (!user) return null;
        
        const posts = getPosts();
        const post = posts.find(p => p.id === postId);
        if (!post) return null;
        
        post.upvotes = post.upvotes || [];
        post.downvotes = post.downvotes || [];
        
        if (type === 'up') {
            if (post.upvotes.includes(user.id)) {
                post.upvotes = post.upvotes.filter(id => id !== user.id);
            } else {
                post.upvotes.push(user.id);
                post.downvotes = post.downvotes.filter(id => id !== user.id);
            }
        } else if (type === 'down') {
            if (post.downvotes.includes(user.id)) {
                post.downvotes = post.downvotes.filter(id => id !== user.id);
            } else {
                post.downvotes.push(user.id);
                post.upvotes = post.upvotes.filter(id => id !== user.id);
            }
        }
        
        set('posts', posts);
        return post;
    };
    
    const getVoteStatus = (postId) => {
        const user = getCurrentUser();
        if (!user) return null;
        const post = getPostById(postId);
        if (!post) return null;
        
        if ((post.upvotes || []).includes(user.id)) return 'up';
        if ((post.downvotes || []).includes(user.id)) return 'down';
        return null;
    };
    
    // ========================================
    // COMMENTS
    // ========================================
    const getComments = () => get('comments', []);
    
    const getCommentsByPost = (postId) => {
        return getComments().filter(c => c.postId === postId);
    };
    
    const createComment = (commentData) => {
        const user = getCurrentUser();
        if (!user) throw new Error('Harus login');
        
        const comments = getComments();
        const newComment = {
            id: generateId(),
            postId: commentData.postId,
            parentId: commentData.parentId || null,
            authorId: user.id,
            content: commentData.content,
            createdAt: new Date().toISOString(),
            likes: [],
            dislikes: []
        };
        comments.push(newComment);
        set('comments', comments);
        
        // Tambahkan ke array comments di post
        const posts = getPosts();
        const post = posts.find(p => p.id === commentData.postId);
        if (post) {
            post.comments = post.comments || [];
            post.comments.push(newComment.id);
            set('posts', posts);
        }
        
        return newComment;
    };
    
    const deleteComment = (commentId) => {
        const comments = getComments().filter(c => c.id !== commentId);
        set('comments', comments);
    };
    
    // ========================================
    // FOLLOW
    // ========================================
    const toggleFollow = (targetUserId) => {
        const user = getCurrentUser();
        if (!user || user.id === targetUserId) return null;
        
        const users = getUsers();
        const currentUser = users.find(u => u.id === user.id);
        const targetUser = users.find(u => u.id === targetUserId);
        
        if (!currentUser || !targetUser) return null;
        
        currentUser.following = currentUser.following || [];
        targetUser.followers = targetUser.followers || [];
        
        if (currentUser.following.includes(targetUserId)) {
            currentUser.following = currentUser.following.filter(id => id !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id !== user.id);
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(user.id);
        }
        
        set('users', users);
        return { following: currentUser.following, followers: targetUser.followers };
    };
    
    const isFollowing = (targetUserId) => {
        const user = getCurrentUser();
        if (!user) return false;
        return (user.following || []).includes(targetUserId);
    };
    
    // ========================================
    // BOOKMARKS
    // ========================================
    const toggleBookmark = (postId) => {
        const user = getCurrentUser();
        if (!user) return null;
        
        const users = getUsers();
        const currentUser = users.find(u => u.id === user.id);
        currentUser.bookmarks = currentUser.bookmarks || [];
        
        if (currentUser.bookmarks.includes(postId)) {
            currentUser.bookmarks = currentUser.bookmarks.filter(id => id !== postId);
        } else {
            currentUser.bookmarks.push(postId);
        }
        
        set('users', users);
        return currentUser.bookmarks;
    };
    
    const isBookmarked = (postId) => {
        const user = getCurrentUser();
        if (!user) return false;
        return (user.bookmarks || []).includes(postId);
    };
    
    // ========================================
    // NOTIFICATIONS
    // ========================================
    const getNotifications = (userId) => {
        const all = get('notifications', []);
        return all.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };
    
    const addNotification = (notification) => {
        const all = get('notifications', []);
        const newNotif = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            read: false,
            ...notification
        };
        all.push(newNotif);
        set('notifications', all);
        return newNotif;
    };
    
    const markNotificationsRead = (userId) => {
        const all = get('notifications', []);
        all.forEach(n => {
            if (n.userId === userId) n.read = true;
        });
        set('notifications', all);
    };
    
    // ========================================
    // MESSAGES
    // ========================================
    const getMessages = (userId1, userId2) => {
        const all = get('messages', []);
        return all.filter(m => 
            (m.fromId === userId1 && m.toId === userId2) ||
            (m.fromId === userId2 && m.toId === userId1)
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    };
    
    const sendMessage = (toId, content, type = 'text') => {
        const user = getCurrentUser();
        if (!user) return null;
        
        const all = get('messages', []);
        const msg = {
            id: generateId(),
            fromId: user.id,
            toId,
            content,
            type,
            createdAt: new Date().toISOString(),
            read: false
        };
        all.push(msg);
        set('messages', all);
        return msg;
    };
    
    const getConversations = (userId) => {
        const all = get('messages', []);
        const userMessages = all.filter(m => m.fromId === userId || m.toId === userId);
        
        // Group by other user
        const convos = {};
        userMessages.forEach(m => {
            const otherId = m.fromId === userId ? m.toId : m.fromId;
            if (!convos[otherId] || new Date(m.createdAt) > new Date(convos[otherId].createdAt)) {
                convos[otherId] = m;
            }
        });
        
        return Object.values(convos).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };
    
    // ========================================
    // SETTINGS & THEME
    // ========================================
    const getTheme = () => get('theme', 'light');
    const setTheme = (theme) => set('theme', theme);
    
    const getSettings = () => get('settings', {});
    const updateSettings = (updates) => {
        const current = getSettings();
        set('settings', { ...current, ...updates });
    };
    
    // ========================================
    // UTILITIES
    // ========================================
    const extractHashtags = (text) => {
        const matches = text.match(/#[\w\u0600-\u06FF]+/g) || [];
        return matches.map(h => h.substring(1));
    };
    
    const extractMentions = (text) => {
        const matches = text.match(/@[\w]+/g) || [];
        return matches.map(m => m.substring(1));
    };
    
    // Ranking algorithms
    const calculateHotScore = (post) => {
        const score = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
        const order = Math.log10(Math.max(Math.abs(score), 1));
        const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
        const seconds = (new Date() - new Date(post.createdAt)) / 1000;
        return sign * order + seconds / 45000;
    };
    
    const calculateTrendingScore = (post) => {
        const score = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
        const ageHours = (new Date() - new Date(post.createdAt)) / (1000 * 60 * 60);
        const gravity = 1.8;
        return score / Math.pow(ageHours + 2, gravity);
    };
    
    // ========================================
    // SEED DATA (untuk demo)
    // ========================================
    const seedDemoData = () => {
        if (getUsers().length > 0) return;
        
        // Buat user demo
        const demoUsers = [
            { username: 'demo_user', email: 'demo@redditx.com', password: 'demo1234', bio: 'User demo untuk testing', location: 'Jakarta' },
            { username: 'tech_guru', email: 'tech@redditx.com', password: 'demo1234', bio: 'Tech enthusiast & developer', location: 'Bandung' },
            { username: 'anime_lover', email: 'anime@redditx.com', password: 'demo1234', bio: 'Weebs unite! 🎌', location: 'Surabaya' },
            { username: 'gamer_pro', email: 'gamer@redditx.com', password: 'demo1234', bio: 'Pro player since 2010 🎮', location: 'Yogyakarta' }
        ];
        
        demoUsers.forEach(u => createUser(u));
        
        // Buat post demo
        const users = getUsers();
        const demoPosts = [
            {
                authorId: users[1].id,
                type: 'text',
                content: 'Baru saja rilis framework JavaScript baru yang super cepat! 🔥 Siapa yang sudah coba? #Technology #Programming'
            },
            {
                authorId: users[2].id,
                type: 'text',
                content: 'Anime season ini bener-bener pecah! Ada rekomendasi apa? 🎌 #Anime'
            },
            {
                authorId: users[3].id,
                type: 'text',
                content: 'Tips gaming: Jangan lupa istirahat tiap 1 jam! Kesehatan lebih penting dari rank 🎮 #Gaming'
            },
            {
                authorId: users[1].id,
                type: 'text',
                content: 'Tutorial React Hooks dalam 5 menit! Thread 🧵 #Programming #Technology'
            },
            {
                authorId: users[0].id,
                type: 'text',
                content: 'Selamat datang di RedditX! Platform komunitas baru yang keren. Yuk join dan mulai berbagi! 🚀'
            }
        ];
        
        demoPosts.forEach(p => createPost(p));
    };
    
    // ========================================
    // PUBLIC API
    // ========================================
    return {
        // Users
        getUsers, getUserById, getUserByUsername, getUserByEmail,
        createUser, updateUser, deleteUser,
        
        // Session
        getCurrentUser, setCurrentUser, isLoggedIn,
        
        // Posts
        getPosts, getPostById, createPost, updatePost, deletePost, incrementViews,
        
        // Voting
        toggleVote, getVoteStatus,
        
        // Comments
        getComments, getCommentsByPost, createComment, deleteComment,
        
        // Follow
        toggleFollow, isFollowing,
        
        // Bookmarks
        toggleBookmark, isBookmarked,
        
        // Notifications
        getNotifications, addNotification, markNotificationsRead,
        
        // Messages
        getMessages, sendMessage, getConversations,
        
        // Settings
        getTheme, setTheme, getSettings, updateSettings,
        
        // Utils
        generateId, extractHashtags, extractMentions,
        calculateHotScore, calculateTrendingScore,
        
        // Demo
        seedDemoData
    };
})();