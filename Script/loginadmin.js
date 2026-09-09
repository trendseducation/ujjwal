// ================================================================
// ⭐ ADMIN AUTHENTICATION MODULE - Reusable across all pages
// ================================================================

(function() {
    'use strict';

    // ================================================================
    // CONFIGURATION
    // ================================================================
    const CONFIG = {
        LOGIN_PAGE: '../../Study Material/My Account/myaccount.html',
        ADMIN_TYPE: 'admin',
        REMEMBER_ME_EXPIRY_DAYS: 10,
        THEME_KEY: 'user-theme-preference'
    };

    const SESSION_KEYS = {
        USER: 'ujjwal_user',
        USER_DATA: 'ujjwal_user_data',
        USER_TYPE: 'ujjwal_user_type',
        REMEMBER_ME: 'ujjwal_remember_me',
        SESSION_EXPIRY: 'ujjwal_session_expiry'
    };

    // ================================================================
    // SESSION MANAGEMENT FUNCTIONS
    // ================================================================

    function getSessionData(key) {
        // Check localStorage first (Remember Me)
        const localData = localStorage.getItem(key);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed.value && parsed.expiry && Date.now() < parsed.expiry) {
                    return parsed.value;
                }
                if (parsed.value !== undefined) return parsed.value;
                return parsed;
            } catch (e) {
                return localData;
            }
        }
        
        // Check sessionStorage
        const sessionData = sessionStorage.getItem(key);
        if (sessionData) {
            try {
                return JSON.parse(sessionData);
            } catch (e) {
                return sessionData;
            }
        }
        
        return null;
    }

    function setSessionData(key, value, rememberMe = false) {
        // Always store in sessionStorage
        sessionStorage.setItem(key, JSON.stringify(value));
        
        // Store in localStorage if Remember Me is active
        if (rememberMe) {
            const data = {
                value: value,
                expiry: Date.now() + (CONFIG.REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
            };
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(SESSION_KEYS.REMEMBER_ME, JSON.stringify({
                value: true,
                expiry: data.expiry
            }));
        }
    }

    function isRememberMeActive() {
        const rememberMeData = localStorage.getItem(SESSION_KEYS.REMEMBER_ME);
        if (rememberMeData) {
            try {
                const parsed = JSON.parse(rememberMeData);
                return parsed.value === true && Date.now() < parsed.expiry;
            } catch(e) {
                return false;
            }
        }
        return false;
    }

    function syncSessionFromRememberMe() {
        if (isRememberMeActive()) {
            const userData = getSessionData(SESSION_KEYS.USER_DATA);
            const userType = getSessionData(SESSION_KEYS.USER_TYPE);
            const user = getSessionData(SESSION_KEYS.USER);
            
            if (user && userData) {
                sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify(user));
                sessionStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(userData));
                if (userType) {
                    sessionStorage.setItem(SESSION_KEYS.USER_TYPE, JSON.stringify(userType));
                }
                console.log('🔄 Synced admin session from Remember Me');
                return true;
            }
        }
        return false;
    }

    function getCurrentUser() {
        syncSessionFromRememberMe();
        
        let user = getSessionData(SESSION_KEYS.USER);
        let userData = getSessionData(SESSION_KEYS.USER_DATA);
        let userType = getSessionData(SESSION_KEYS.USER_TYPE);
        
        if (!user || !userData) {
            return null;
        }

        try {
            if (typeof userData === 'string') {
                userData = JSON.parse(userData);
            }
            
            const firstName = userData['First Name'] || userData['User Name'] || '';
            const lastName = userData['Last Name'] || '';
            const fullName = `${firstName} ${lastName}`.trim() || (userData['User Name'] || 'Admin');
            const email = userData['Email Id'] || user;
            
            return {
                username: user,
                email: email,
                data: userData,
                type: userType || CONFIG.ADMIN_TYPE,
                fullName: fullName,
                isRememberMe: isRememberMeActive()
            };
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    function isAdminLoggedIn() {
        const user = getCurrentUser();
        return user !== null && user.type === CONFIG.ADMIN_TYPE;
    }

    function getAdminDisplayName() {
        const user = getCurrentUser();
        return user ? user.fullName : 'Admin';
    }

    function getSessionIndicator() {
        return isRememberMeActive() ? '🔒 10d' : 'Session';
    }

    function logout(redirectUrl = CONFIG.LOGIN_PAGE) {
        Object.values(SESSION_KEYS).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        window.location.href = redirectUrl;
    }

    // ================================================================
    // THEME MANAGEMENT
    // ================================================================

    function getStoredTheme() {
        return localStorage.getItem(CONFIG.THEME_KEY) || 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        localStorage.setItem(CONFIG.THEME_KEY, theme);
        
        try {
            localStorage.setItem('theme-change-trigger', Date.now().toString());
        } catch(e) {}
        
        // Notify iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'themeChange',
                    theme: theme
                }, '*');
            } catch(e) {}
        });
        
        // Notify parent
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'themeChange',
                    theme: theme
                }, '*');
            }
        } catch(e) {}
    }

    function initTheme() {
        const stored = localStorage.getItem(CONFIG.THEME_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = stored || (systemPrefersDark ? 'dark' : 'light');
        applyTheme(theme);

        // Listen for storage changes
        window.addEventListener('storage', function(e) {
            if (e.key === CONFIG.THEME_KEY && e.newValue) {
                document.documentElement.setAttribute('data-theme', e.newValue);
                document.documentElement.style.colorScheme = e.newValue;
            }
            if (e.key === 'theme-change-trigger') {
                const currentTheme = localStorage.getItem(CONFIG.THEME_KEY);
                if (currentTheme) {
                    document.documentElement.setAttribute('data-theme', currentTheme);
                    document.documentElement.style.colorScheme = currentTheme;
                }
            }
        });

        // Listen for theme messages
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'themeChange') {
                const newTheme = event.data.theme;
                if (newTheme && newTheme !== document.documentElement.getAttribute('data-theme')) {
                    applyTheme(newTheme);
                }
            }
        });

        // Sync with parent
        try {
            if (window.parent && window.parent !== window) {
                const parentTheme = window.parent.document.documentElement.getAttribute('data-theme');
                if (parentTheme && parentTheme !== document.documentElement.getAttribute('data-theme')) {
                    applyTheme(parentTheme);
                }
            }
        } catch(e) {}

        // Periodic sync
        let lastTheme = getStoredTheme();
        setInterval(function() {
            const currentTheme = getStoredTheme();
            if (currentTheme !== lastTheme) {
                lastTheme = currentTheme;
                document.documentElement.setAttribute('data-theme', currentTheme);
                document.documentElement.style.colorScheme = currentTheme;
            }
        }, 2000);
    }

    // ================================================================
    // UTILITY FUNCTIONS
    // ================================================================

    function getAcademicYear() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    }

    function updateAdminBadge(nameElementId = 'adminNameDisplay', indicatorElementId = 'sessionIndicator') {
        const user = getCurrentUser();
        const nameDisplay = document.getElementById(nameElementId);
        const indicator = document.getElementById(indicatorElementId);
        
        if (nameDisplay) {
            nameDisplay.textContent = user ? user.fullName : 'Admin';
        }
        
        if (indicator) {
            const isRememberMe = isRememberMeActive();
            indicator.textContent = isRememberMe ? '🔒 10d' : 'Session';
            indicator.style.background = isRememberMe ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)';
            if (isRememberMe) {
                indicator.style.color = '#34d399';
            } else {
                indicator.style.color = '';
            }
        }
    }

    function showContent(elementIds = ['mainContent', 'mainFooter']) {
        const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'block';
                console.log(`✅ Show: ${id}`);
            } else {
                console.warn(`⚠️ Element not found: ${id}`);
            }
        });
    }

    function hideContent(elementIds = ['mainContent', 'mainFooter']) {
        const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    function hideLoading(loadingElementId = 'authLoading') {
        console.log('⏳ Hiding loading spinner...');
        const loading = document.getElementById(loadingElementId);
        if (loading) {
            loading.classList.add('hidden');
            loading.style.display = 'none';
            loading.style.visibility = 'hidden';
            loading.style.opacity = '0';
            loading.style.pointerEvents = 'none';
            console.log('✅ Loading spinner hidden');
        } else {
            console.warn(`⚠️ Loading element not found: ${loadingElementId}`);
        }
    }

    function showLoading(loadingElementId = 'authLoading') {
        console.log('⏳ Showing loading spinner...');
        const loading = document.getElementById(loadingElementId);
        if (loading) {
            loading.classList.remove('hidden');
            loading.style.display = 'flex';
            loading.style.visibility = 'visible';
            loading.style.opacity = '1';
            loading.style.pointerEvents = 'auto';
            console.log('✅ Loading spinner shown');
        } else {
            console.warn(`⚠️ Loading element not found: ${loadingElementId}`);
        }
    }

    // ================================================================
    // ⭐ FORCE HIDE LOADING - Emergency function
    // ================================================================

    function forceHideLoading() {
        console.log('🚨 Emergency: Force hiding loading...');
        const loading = document.getElementById('authLoading');
        if (loading) {
            loading.style.display = 'none';
            loading.classList.add('hidden');
            loading.style.visibility = 'hidden';
            loading.style.opacity = '0';
            loading.style.pointerEvents = 'none';
        }
        // Also hide any other loading elements
        document.querySelectorAll('.loading-overlay, #authLoading, .spinner-container').forEach(el => {
            el.style.display = 'none';
        });
        console.log('✅ Emergency hide complete');
    }

    // ================================================================
    // ⭐ MAIN AUTHENTICATION CHECK
    // ================================================================

    function checkAdminAuth(options = {}) {
        const {
            redirectOnFail = CONFIG.LOGIN_PAGE,
            onSuccess = null,
            onFail = null,
            loadingElementId = 'authLoading',
            contentElements = ['mainContent', 'mainFooter'],
            showLoadingIndicator = true
        } = options;

        console.log('🔐 Starting authentication check...');

        // Show loading
        if (showLoadingIndicator) {
            showLoading(loadingElementId);
        }
        
        // Hide content initially
        hideContent(contentElements);
        
        // Try to sync from Remember Me
        syncSessionFromRememberMe();
        
        const user = getCurrentUser();
        
        // Check if user exists and is admin
        if (!user || user.type !== CONFIG.ADMIN_TYPE) {
            console.warn('⚠️ Admin authentication failed, redirecting to login');
            
            if (onFail) onFail();
            
            // Hide loading before redirect
            hideLoading(loadingElementId);
            
            setTimeout(() => {
                window.location.href = redirectOnFail;
            }, 500);
            return null;
        }
        
        console.log(`✅ Admin authenticated: ${user.fullName} (${user.email})`);
        console.log(`📌 Session source: ${user.isRememberMe ? 'Remember Me (10 days)' : 'Session'}`);
        
        // Store user globally
        window._currentAdmin = user;
        
        // Show content
        showContent(contentElements);
        
        // Update admin badge if it exists
        updateAdminBadge();
        
        // Hide loading
        hideLoading(loadingElementId);
        
        if (onSuccess) onSuccess(user);
        
        console.log('🔐 Authentication complete ✅');
        
        return user;
    }

    // ================================================================
    // ⭐ AUTO-INITIALIZE (Runs automatically when script loads)
    // ================================================================

    function autoInit() {
        console.log('🔄 Auto-init started...');
        
        // Get script tag with data attributes
        const scripts = document.querySelectorAll('script[src*="admin-auth.js"]');
        let autoInit = false;
        let options = {};
        
        scripts.forEach(script => {
            if (script.getAttribute('data-auto-init') === 'true') {
                autoInit = true;
                options = {
                    redirectOnFail: script.getAttribute('data-redirect') || CONFIG.LOGIN_PAGE,
                    loadingElementId: script.getAttribute('data-loading-id') || 'authLoading',
                    contentElements: (script.getAttribute('data-content') || 'mainContent,mainFooter').split(','),
                    showLoadingIndicator: script.getAttribute('data-loading') !== 'false'
                };
                console.log('📋 Auto-init options:', options);
            }
        });
        
        // If no data-auto-init, check if page has required elements
        if (!autoInit) {
            const hasLoading = document.getElementById('authLoading');
            const hasContent = document.getElementById('mainContent');
            if (hasLoading && hasContent) {
                autoInit = true;
            }
        }
        
        if (autoInit) {
            console.log('🔄 Auto-initializing admin authentication...');
            // Initialize theme first
            initTheme();
            // Then check auth
            checkAdminAuth(options);
        } else {
            console.log('ℹ️ Auto-init not triggered - hiding loading');
            forceHideLoading();
        }
        
        // ⭐ Emergency: Hide loading after 5 seconds if still visible
        setTimeout(function() {
            const loading = document.getElementById('authLoading');
            if (loading && !loading.classList.contains('hidden') && loading.style.display !== 'none') {
                console.warn('⚠️ Loading still visible after 5 seconds - force hiding');
                forceHideLoading();
                // Also try to show content
                const content = document.getElementById('mainContent');
                if (content) {
                    content.style.display = 'block';
                }
                const footer = document.getElementById('mainFooter');
                if (footer) {
                    footer.style.display = 'block';
                }
            }
        }, 5000);
    }

    // ================================================================
    // EXPOSE PUBLIC API
    // ================================================================

    window.AdminAuth = {
        // Core functions
        checkAdminAuth,
        getCurrentUser,
        isAdminLoggedIn,
        logout,
        
        // Session functions
        getSessionData,
        setSessionData,
        isRememberMeActive,
        syncSessionFromRememberMe,
        
        // User functions
        getAdminDisplayName,
        getSessionIndicator,
        
        // Theme functions
        initTheme,
        applyTheme,
        getStoredTheme,
        
        // Utility functions
        getAcademicYear,
        updateAdminBadge,
        showContent,
        hideContent,
        showLoading,
        hideLoading,
        forceHideLoading,
        
        // Configuration
        CONFIG,
        SESSION_KEYS
    };

    // ================================================================
    // AUTO-INITIALIZE ON DOM READY
    // ================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        // DOM already loaded
        setTimeout(autoInit, 0);
    }

    console.log('✅ Admin Auth Module Loaded v2.0');

})();