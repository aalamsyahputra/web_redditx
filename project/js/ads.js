const AdsModule = (() => {
    const AD_INTERVAL = 5 * 60 * 1000; // 5 menit
    const CLOSE_DELAY = 5000; // 5 detik
    
    let adTimer = null;
    
    const init = () => {
        startAdTimer();
    };
    
    const startAdTimer = () => {
        adTimer = setInterval(() => {
            const user = Storage.getCurrentUser();
            if (user && user.isPremium) return; // Premium skip iklan
            showAdPopup();
        }, AD_INTERVAL);
    };
    
    const showAdPopup = () => {
        const popup = document.createElement('div');
        popup.className = 'ad-popup';
        popup.innerHTML = `
            <div class="ad-popup-content">
                <div class="ad-popup-timer" id="ad-timer">Tutup dalam 5s</div>
                <button class="ad-popup-close" id="ad-close" aria-label="Tutup">
                    <i class="fas fa-times"></i>
                </button>
                <div class="ad-popup-image">
                    <div>
                        <i class="fas fa-ad"></i>
                        <p style="margin-top:8px;font-size:14px">Ruang Iklan</p>
                    </div>
                </div>
                <h3>Iklan Partner</h3>
                <p style="color:var(--color-text-secondary);margin-top:8px">Dapatkan pengalaman tanpa iklan dengan RedditX Premium!</p>
                <a href="premium.html" class="btn btn-primary" style="margin-top:16px">Upgrade Sekarang</a>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        let countdown = 5;
        const timerEl = popup.querySelector('#ad-timer');
        const closeBtn = popup.querySelector('#ad-close');
        
        const interval = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(interval);
                timerEl.textContent = '';
                closeBtn.classList.add('enabled');
            } else {
                timerEl.textContent = `Tutup dalam ${countdown}s`;
            }
        }, 1000);
        
        closeBtn.addEventListener('click', () => {
            if (closeBtn.classList.contains('enabled')) {
                popup.remove();
            }
        });
    };
    
    const stop = () => {
        if (adTimer) clearInterval(adTimer);
    };
    
    return { init, stop, showAdPopup };
})();