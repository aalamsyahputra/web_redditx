/**
 * ============================================
 * Darkmode.js — Pengaturan Tema
 * ============================================
 */

const DarkMode = (() => {
    
    const applyTheme = (theme) => {
        let effectiveTheme = theme;
        
        if (theme === 'auto') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        Storage.setTheme(theme);
    };
    
    const toggle = () => {
        const current = Storage.getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        return next;
    };
    
    const init = () => {
        const theme = Storage.getTheme();
        applyTheme(theme);
        
        // Listen untuk perubahan preferensi sistem
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (Storage.getTheme() === 'auto') {
                applyTheme('auto');
            }
        });
    };
    
    return { init, toggle, applyTheme };
})();