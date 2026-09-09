// ================================================================
// ⭐ FOOTER LOADER - Waits for authentication before loading
// ================================================================

(function() {
    'use strict';

    // ================================================================
    // CONFIGURATION
    // ================================================================
    const CONFIG = {
        FOOTER_PATH: 'footer.html',
        MAX_WAIT_TIME: 10000, // 10 seconds max wait
        CHECK_INTERVAL: 500 // Check every 500ms
    };

    // ================================================================
    // FOOTER LOADING FUNCTIONS
    // ================================================================

    function loadFooter(footerPath = 'footer.html') {
        console.log('📥 Loading footer from:', footerPath);
        
        // Check if footer already exists
        if (document.getElementById('mainFooter')) {
            console.log('✅ Footer already exists in DOM');
            const footer = document.getElementById('mainFooter');
            footer.style.display = 'block';
            return Promise.resolve(true);
        }

        return fetch(footerPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load footer: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(html => {
                console.log('✅ Footer HTML loaded');
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                let footerElement = tempDiv.querySelector('.app-footer') || tempDiv.querySelector('footer');
                
                if (footerElement) {
                    const clonedFooter = footerElement.cloneNode(true);
                    clonedFooter.id = 'mainFooter';
                    clonedFooter.style.display = 'block';
                    
                    document.body.appendChild(clonedFooter);
                    console.log('✅ Footer appended to DOM');
                    
                    // Run scripts
                    const scripts = tempDiv.querySelectorAll('script');
                    scripts.forEach(script => {
                        if (script.textContent && script.textContent.trim()) {
                            try {
                                const newScript = document.createElement('script');
                                newScript.textContent = script.textContent;
                                document.body.appendChild(newScript);
                            } catch(e) {
                                console.warn('Script error:', e);
                            }
                        }
                    });
                    
                    // Update year
                    const yearSpan = document.getElementById('footerYear');
                    if (yearSpan) {
                        yearSpan.textContent = new Date().getFullYear();
                    }
                    
                    // Make sure footer is visible
                    const footer = document.getElementById('mainFooter');
                    if (footer) {
                        footer.style.display = 'block';
                    }
                    
                    return true;
                } else {
                    console.warn('⚠️ No footer element found in HTML');
                    createFallbackFooter();
                    return false;
                }
            })
            .catch(error => {
                console.warn('⚠️ Failed to load footer:', error);
                createFallbackFooter();
                return false;
            });
    }

    function createFallbackFooter() {
        console.log('📝 Creating fallback footer');
        
        if (document.getElementById('mainFooter')) {
            const footer = document.getElementById('mainFooter');
            footer.style.display = 'block';
            return;
        }
        
        const footer = document.createElement('footer');
        footer.className = 'app-footer';
        footer.id = 'mainFooter';
        footer.style.display = 'block';
        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-brand">
                    <span class="footer-logo-text">🏫 Ujjwal Academy</span>
                </div>
                <div class="footer-info">
                    <span>&copy; <span id="footerYear">${new Date().getFullYear()}</span> Ujjwal Academy</span>
                    <span class="footer-divider">&middot;</span>
                    <span>All Rights Reserved</span>
                </div>
                <div class="footer-links">
                    <a href="#" class="footer-logout-link" onclick="event.preventDefault(); if(window.AdminAuth) AdminAuth.logout();">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
        `;
        
        // Add styles if missing
        if (!document.getElementById('footerFallbackStyles')) {
            const style = document.createElement('style');
            style.id = 'footerFallbackStyles';
            style.textContent = `
                .app-footer {
                    padding: 1.5rem 1rem;
                    text-align: center;
                    font-size: 0.6rem;
                    color: var(--text-muted);
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    border-top: 1px solid var(--border-light);
                    background: var(--bg-card);
                    transition: background var(--transition), border-color var(--transition);
                    margin-top: auto;
                    width: 100%;
                    display: block !important;
                }
                .footer-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                .footer-brand { display: flex; align-items: center; gap: 8px; }
                .footer-logo-text {
                    font-weight: 700;
                    font-size: 0.8rem;
                    background: var(--gradient-accent);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .footer-info {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .footer-divider {
                    color: var(--text-light);
                    opacity: 0.5;
                }
                .footer-links { display: flex; align-items: center; gap: 12px; }
                .footer-logout-link {
                    color: var(--danger);
                    text-decoration: none;
                    font-size: 0.6rem;
                    font-weight: 600;
                    padding: 4px 12px;
                    border-radius: 30px;
                    background: var(--danger-light);
                    transition: all var(--transition);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    border: none;
                    font-family: inherit;
                }
                .footer-logout-link:hover {
                    background: var(--danger);
                    color: white;
                    transform: translateY(-1px);
                }
                .footer-logout-link i { font-size: 0.6rem; }
                @media (min-width: 600px) {
                    .app-footer { padding: 2rem 1.5rem; font-size: 0.7rem; }
                    .footer-content { flex-direction: row; justify-content: space-between; align-items: center; }
                    .footer-logout-link { font-size: 0.7rem; padding: 5px 16px; }
                }
                @media (min-width: 1024px) {
                    .app-footer { padding: 2.5rem 2rem; font-size: 0.8rem; }
                    .footer-logout-link { font-size: 0.8rem; padding: 6px 20px; }
                }
                @media (max-width: 380px) {
                    .app-footer { padding: 1rem 0.8rem; font-size: 0.5rem; }
                    .footer-logo-text { font-size: 0.7rem; }
                    .footer-logout-link { font-size: 0.5rem; padding: 3px 10px; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(footer);
        console.log('✅ Fallback footer created');
    }

    // ================================================================
    // ⭐ AUTO-LOAD FOOTER WITH AUTHENTICATION CHECK
    // ================================================================

    function autoLoadFooter() {
        console.log('🔄 Footer auto-loader started...');
        
        // Get configuration from script tag
        const scripts = document.querySelectorAll('script[src*="footer-loader.js"]');
        let shouldLoad = false;
        let footerPath = CONFIG.FOOTER_PATH;
        
        scripts.forEach(script => {
            if (script.getAttribute('data-footer') === 'true') {
                shouldLoad = true;
                footerPath = script.getAttribute('data-footer-path') || CONFIG.FOOTER_PATH;
            }
        });
        
        if (!shouldLoad) {
            console.log('ℹ️ Footer loading not requested (data-footer="true" missing)');
            return;
        }
        
        console.log(`📋 Footer config: path=${footerPath}`);
        
        // Check if user is already logged in
        function checkAndLoadFooter() {
            if (window.AdminAuth && window.AdminAuth.isAdminLoggedIn()) {
                console.log('✅ User is logged in, loading footer...');
                loadFooter(footerPath);
                return true;
            }
            return false;
        }

        // Try immediately
        if (checkAndLoadFooter()) {
            return;
        }

        // Wait for authentication to complete
        console.log('⏳ Waiting for authentication to complete...');
        let attempts = 0;
        const maxAttempts = CONFIG.MAX_WAIT_TIME / CONFIG.CHECK_INTERVAL;
        
        const intervalId = setInterval(function() {
            attempts++;
            
            if (checkAndLoadFooter()) {
                clearInterval(intervalId);
                return;
            }
            
            // Also check if the content is visible (auth completed)
            const mainContent = document.getElementById('mainContent');
            if (mainContent && mainContent.style.display === 'block') {
                // Content is visible, but footer not loaded yet
                console.log('📌 Content is visible, checking if footer should load...');
                if (window.AdminAuth && window.AdminAuth.isAdminLoggedIn()) {
                    loadFooter(footerPath);
                    clearInterval(intervalId);
                    return;
                }
            }
            
            // Timeout - load footer anyway as fallback
            if (attempts >= maxAttempts) {
                console.warn('⚠️ Timeout waiting for authentication, loading footer anyway...');
                loadFooter(footerPath);
                clearInterval(intervalId);
            }
        }, CONFIG.CHECK_INTERVAL);
    }

    // ================================================================
    // EXPOSE PUBLIC API
    // ================================================================

    window.FooterLoader = {
        loadFooter,
        createFallbackFooter,
        autoLoadFooter
    };

    // ================================================================
    // AUTO-LOAD ON DOM READY
    // ================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Wait a bit for admin-auth to initialize
            setTimeout(autoLoadFooter, 100);
        });
    } else {
        setTimeout(autoLoadFooter, 100);
    }

    console.log('✅ Footer Loader Module Loaded v2.0');

})();