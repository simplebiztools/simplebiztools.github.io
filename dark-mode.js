// ==========================================
// DARK MODE FUNCTIONALITY
// ==========================================

// Check for saved theme preference or default to light mode
function getThemePreference() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        return saved;
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// Apply theme to document
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
}

// Toggle between light and dark mode
function toggleTheme() {
    const currentTheme = getThemePreference();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    updateToggleButton(newTheme);
}

// Update the toggle button text/icon
function updateToggleButton(theme) {
    const button = document.getElementById('dark-mode-toggle');
    if (button) {
        const icon = button.querySelector('.icon');
        const text = button.querySelector('.text');
        
        if (theme === 'dark') {
            icon.textContent = '☀️';
            text.textContent = 'Light';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Dark';
        }
    }
}

// Create and add dark mode toggle button to page
function addDarkModeToggle() {
    // Check if toggle already exists
    if (document.getElementById('dark-mode-toggle')) {
        return;
    }
    
    const currentTheme = getThemePreference();
    
    const toggle = document.createElement('button');
    toggle.id = 'dark-mode-toggle';
    toggle.className = 'dark-mode-toggle';
    toggle.onclick = toggleTheme;
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    
    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = currentTheme === 'dark' ? 'Light' : 'Dark';
    
    toggle.appendChild(icon);
    toggle.appendChild(text);
    
    document.body.appendChild(toggle);
}

// Initialize dark mode on page load
function initDarkMode() {
    const theme = getThemePreference();
    applyTheme(theme);
    addDarkModeToggle();
    updateToggleButton(theme);
}

// Run on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    initDarkMode();
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            updateToggleButton(newTheme);
        }
    });
}
