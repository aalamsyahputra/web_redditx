/**
 * ============================================
 * UI.js — Utility UI
 * ============================================
 * Fungsi-fungsi helper untuk UI: toast, modal, ripple, dll
 */

const UI = (() => {
    
    // === Toast Notification ===
    const toast = (message, type = 'info', duration = 3000) => {
        const container = document.getElementById('toast-root');
        if (!container) return;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${sanitize(message)}</span>
        `;
        container.appendChild(el);
        
        setTimeout(() => {
            el.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => el.remove(), 300);
        }, duration);
    };
    
    // === Modal ===
    const modal = ({ title, content, onConfirm, confirmText = 'OK', cancelText = 'Batal', showCancel = true }) => {
        const root = document.getElementById('modal-root');
        if (!root) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${sanitize(title)}</h3>
                    <button class="btn-icon modal-close" aria-label="Tutup">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    ${showCancel ? `<button class="btn btn-outline modal-cancel">${cancelText}</button>` : ''}
                    <button class="btn btn-primary modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;
        
        root.appendChild(overlay);
        
        const close = () => overlay.remove();
        
        overlay.querySelector('.modal-close').onclick = close;
        overlay.querySelector('.modal-cancel')?.addEventListener('click', close);
        overlay.querySelector('.modal-confirm').onclick = () => {
            if (onConfirm) onConfirm();
            close();
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
        
        return { close };
    };
    
    // === Confirm Dialog ===
    const confirm = (message, onConfirm) => {
        modal({
            title: 'Konfirmasi',
            content: `<p>${sanitize(message)}</p>`,
            onConfirm,
            confirmText: 'Ya',
            cancelText: 'Batal'
        });
    };
    
    // === Ripple Effect ===
    const initRipple = () => {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.ripple');
            if (!target) return;
            
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            
            ripple.className = 'ripple-effect';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            
            target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    };
    
    // === Sanitize HTML (cegah XSS) ===
    const sanitize = (str) => {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    // === Format Content (hashtag, mention, link) ===
    const formatContent = (text) => {
        let result = sanitize(text);
        // Hashtag
        result = result.replace(/#([\w\u0600-\u06FF]+)/g, '<span class="hashtag" data-hashtag="$1">#$1</span>');
        // Mention
        result = result.replace(/@([\w]+)/g, '<span class="mention" data-username="$1">@$1</span>');
        // Link
        result = result.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="link">$1</a>');
        // Newlines
        result = result.replace(/\n/g, '<br>');
        return result;
    };
    
    // === Time Ago ===
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = [
            { label: 'tahun', seconds: 31536000 },
            { label: 'bulan', seconds: 2592000 },
            { label: 'hari', seconds: 86400 },
            { label: 'jam', seconds: 3600 },
            { label: 'menit', seconds: 60 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label} lalu`;
            }
        }
        return 'baru saja';
    };
    
    // === Format Number ===
    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };
    
    // === Escape HTML Attribute ===
    const escapeAttr = (str) => {
        return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    };
    
    // === Intersection Observer (Lazy Load / Reveal) ===
    const observeElements = (selector, callback) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll(selector).forEach(el => observer.observe(el));
    };
    
    // === Debounce ===
    const debounce = (fn, delay = 300) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };
    
    // === Throttle ===
    const throttle = (fn, limit = 300) => {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };
    
    // === Copy to Clipboard ===
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast('Link berhasil disalin!', 'success');
            return true;
        } catch (e) {
            toast('Gagal menyalin', 'error');
            return false;
        }
    };
    
    // === File to Base64 ===
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };
    
    // === Skeleton Loader ===
    const renderSkeleton = (count = 3) => {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-post">
                    <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
                        <div class="skeleton skeleton-circle"></div>
                        <div style="flex:1">
                            <div class="skeleton skeleton-line short"></div>
                            <div class="skeleton skeleton-line" style="width:25%;height:8px"></div>
                        </div>
                    </div>
                    <div class="skeleton skeleton-line long"></div>
                    <div class="skeleton skeleton-line medium"></div>
                    <div class="skeleton skeleton-line short"></div>
                </div>
            `;
        }
        return html;
    };
    
    return {
        toast, modal, confirm, initRipple,
        sanitize, formatContent, timeAgo, formatNumber, escapeAttr,
        observeElements, debounce, throttle,
        copyToClipboard, fileToBase64, renderSkeleton
    };
})();