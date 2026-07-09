const PremiumModule = (() => {
    const plans = [
        { id: 'monthly', name: 'Bulanan', price: 49000, period: '/bulan', featured: false },
        { id: 'yearly', name: 'Tahunan', price: 490000, period: '/tahun', featured: true, save: '17%' },
        { id: 'lifetime', name: 'Lifetime', price: 1490000, period: 'sekali bayar', featured: false }
    ];
    
    const features = [
        { icon: 'fa-ban', title: 'Bebas Iklan', desc: 'Nikmati pengalaman tanpa gangguan iklan' },
        { icon: 'fa-crown', title: 'Badge Premium', desc: 'Tampilkan badge eksklusif di profil' },
        { icon: 'fa-palette', title: 'Tema Eksklusif', desc: 'Akses tema premium yang keren' },
        { icon: 'fa-bolt', title: 'Prioritas Upload', desc: 'Upload lebih cepat dan ukuran lebih besar' },
        { icon: 'fa-chart-line', title: 'Statistik Lengkap', desc: 'Lihat analitik detail posting Anda' },
        { icon: 'fa-user-astronaut', title: 'Avatar Premium', desc: 'Avatar eksklusif yang keren' },
        { icon: fa-palette, title: 'Username Berwarna', desc: 'Username dengan warna premium' },
        { icon: 'fa-headset', title: 'Premium Support', desc: 'Dukungan prioritas 24/7' }
    ];
    
    const init = () => {
        if (!document.getElementById('features-grid')) return;
        renderFeatures();
        renderPlans();
        renderFAQ();
    };
    
    const renderFeatures = () => {
        const container = document.getElementById('features-grid');
        container.innerHTML = features.map(f => `
            <div class="feature-card hover-lift">
                <i class="fas ${f.icon}"></i>
                <h3>${f.title}</h3>
                <p>${f.desc}</p>
            </div>
        `).join('');
    };
    
    const renderPlans = () => {
        const container = document.getElementById('plans-grid');
        container.innerHTML = plans.map(p => `
            <div class="plan-card ${p.featured ? 'featured' : ''} hover-lift">
                <div class="plan-name">${p.name}</div>
                <div class="plan-price">
                    Rp${p.price.toLocaleString('id-ID')}
                    <small>${p.period}</small>
                </div>
                ${p.save ? `<div class="badge badge-primary" style="margin-bottom:16px">Hemat ${p.save}</div>` : ''}
                <ul class="plan-features">
                    <li><i class="fas fa-check"></i> Semua fitur premium</li>
                    <li><i class="fas fa-check"></i> Bebas iklan</li>
                    <li><i class="fas fa-check"></i> Support prioritas</li>
                    <li><i class="fas fa-check"></i> Upload hingga 500MB</li>
                </ul>
                <button class="btn btn-primary btn-block" data-plan="${p.id}">Pilih Paket</button>
            </div>
        `).join('');
        
        container.querySelectorAll('[data-plan]').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = Storage.getCurrentUser();
                if (!user) {
                    UI.toast('Login dulu untuk berlangganan', 'warning');
                    return;
                }
                UI.confirm(`Aktifkan paket ${btn.dataset.plan}? (Simulasi)`, () => {
                    Storage.updateUser(user.id, {
                        isPremium: true,
                        premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                    });
                    UI.toast('Selamat! Anda sekarang Premium 🎉', 'success');
                });
            });
        });
    };
    
    const renderFAQ = () => {
        const faqs = [
            { q: 'Bagaimana cara berlangganan?', a: 'Pilih paket yang Anda inginkan dan klik tombol "Pilih Paket". Pembayaran simulasi akan diproses.' },
            { q: 'Apakah bisa batal langganan?', a: 'Ya, Anda dapat membatalkan kapan saja melalui halaman pengaturan.' },
            { q: 'Apa saja metode pembayaran?', a: 'Kami menerima transfer bank, e-wallet, dan kartu kredit.' },
            { q: 'Apakah ada trial gratis?', a: 'Saat ini belum ada trial, namun kami akan menambahkannya segera.' }
        ];
        
        const container = document.getElementById('faq-list');
        container.innerHTML = faqs.map(f => `
            <div class="faq-item">
                <div class="faq-question">
                    <span>${f.q}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="faq-answer"><p>${f.a}</p></div>
            </div>
        `).join('');
        
        container.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                q.parentElement.classList.toggle('open');
            });
        });
    };
    
    return { init };
})();