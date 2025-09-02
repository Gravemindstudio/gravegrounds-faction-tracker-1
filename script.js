// DOM Elements
const modal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeBtn = document.querySelector('.close');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const navLinks = document.querySelectorAll('.nav-link');

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';

// Socket.IO connection with proper error handling
let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function initializeSocket() {
    if (typeof io === 'undefined') {
        console.warn('Socket.IO not loaded, falling back to polling');
        return;
    }

    try {
        socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });
        
        // Socket event handlers
        socket.on('connect', () => {
            console.log('Connected to server via Socket.IO');
            reconnectAttempts = 0;
            updateConnectionStatus('connected', 'Live Updates Active');
        });
        
        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            updateConnectionStatus('disconnected', 'Disconnected');
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                socket.connect();
            }
        });
        
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            reconnectAttempts++;
            updateConnectionStatus('connecting', 'Reconnecting...');
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                updateConnectionStatus('disconnected', 'Connection Failed');
            }
        });
        
        socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            updateConnectionStatus('connected', 'Live Updates Active');
        });
        
        // Listen for real-time faction updates
        socket.on('factionUpdate', (data) => {
            console.log('Faction update received:', data);
            
            // Dispatch custom event for individual faction pages
            const customEvent = new CustomEvent('factionUpdate', { detail: data });
            window.dispatchEvent(customEvent);
            
            // Handle different types of updates
            switch (data.type) {
                case 'memberAdded':
                    showNotification(`New member joined ${data.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}!`, 'info');
                    // Refresh all faction counts after member addition
                    updateFactionCounts();
                    break;
                case 'statsUpdated':
                    // Update specific faction stats immediately
                    updateSpecificFactionStats(data.faction, data.memberCount, data.weeklyGrowth);
                    break;
                case 'galleryUpdated':
                    // Handle gallery updates
                    if (data.type === 'newCharacter') {
                        showNotification(`${data.characterName} has been added to the gallery!`, 'success');
                        // Refresh gallery data if we're on gallery page
                        if (typeof loadGalleryData === 'function') {
                            loadGalleryData();
                        }
                    }
                    break;
                default:
                    // For any other update type, refresh all stats
                    updateFactionCounts();
            }
        });
        
        // Listen for initial faction stats
        socket.on('factionStats', (stats) => {
            console.log('Initial faction stats received:', stats);
            updateFactionCounts();
        });
        
    } catch (error) {
        console.error('Error initializing Socket.IO:', error);
    }
}

// Update connection status indicator
function updateConnectionStatus(status, text) {
    const statusDot = document.querySelector('#connectionStatus .status-dot');
    const statusText = document.querySelector('#connectionStatus .status-text');
    
    if (statusDot && statusText) {
        // Remove all status classes
        statusDot.classList.remove('connected', 'connecting', 'disconnected');
        // Add new status class
        statusDot.classList.add(status);
        // Update text
        statusText.textContent = text;
    }
}

// Modal functionality
function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}

// Tab switching
function switchTab(tabName) {
    authTabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById(`${tabName}Form`).classList.add('active');
}

// Event listeners
loginBtn.addEventListener('click', () => {
    openModal();
    switchTab('login');
});

signupBtn.addEventListener('click', () => {
    openModal();
    switchTab('signup');
});

closeBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Tab switching
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        switchTab(tabName);
    });
});

// Smooth scrolling for navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // If it's an internal link (starts with #), handle smooth scrolling
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
        // If it's an external link (like gallery.html), let it navigate normally
        // No preventDefault() needed
    });
});

// Active navigation highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Only handle internal links for active highlighting
        if (href.startsWith('#')) {
            link.classList.remove('active');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        }
    });
});

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// API Functions
async function fetchFactionStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/factions`);
        if (!response.ok) throw new Error('Failed to fetch faction stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching faction stats:', error);
        return null;
    }
}

async function updateFactionCounts() {
    const stats = await fetchFactionStats();
    if (!stats) return;
    
    // Update hero section faction cards
    stats.forEach(faction => {
        const factionCard = document.querySelector(`.faction-card.${faction.faction.replace(/-/g, '-')}`);
        if (factionCard) {
            const memberCount = factionCard.querySelector('.member-count');
            if (memberCount) {
                memberCount.textContent = `${faction.member_count.toLocaleString()} members`;
            }
        }
    });
    
    // Update factions overview section
    stats.forEach(faction => {
        const factionItem = document.querySelector(`[data-faction="${faction.faction}"]`);
        if (factionItem) {
            const memberCount = factionItem.querySelector('[data-stat="members"]');
            const weeklyGrowth = factionItem.querySelector('[data-stat="weekly"]');
            
            if (memberCount) {
                memberCount.innerHTML = `<i class="fas fa-users"></i>${faction.member_count.toLocaleString()} members`;
            }
            if (weeklyGrowth) {
                weeklyGrowth.innerHTML = `<i class="fas fa-chart-line"></i>+${faction.weekly_growth} this week`;
            }
        }
    });
    
    // Update individual faction page stats if we're on one
    if (window.location.pathname.includes('/factions/')) {
        const currentFaction = window.location.pathname.split('/').pop();
        const factionStat = stats.find(s => s.faction === currentFaction);
        
        if (factionStat) {
            const memberCount = document.querySelector('.stat-number');
            const weeklyGrowth = document.querySelector('.stat-number + .stat-label + .stat-number');
            
            if (memberCount) {
                memberCount.textContent = factionStat.member_count.toLocaleString();
            }
            if (weeklyGrowth) {
                weeklyGrowth.textContent = `+${factionStat.weekly_growth}`;
            }
        }
    }
}

// Update specific faction stats on the individual faction page
function updateSpecificFactionStats(factionName, memberCount, weeklyGrowth) {
    // Update main page faction stats
    const factionItem = document.querySelector(`[data-faction="${factionName}"]`);
    if (factionItem) {
        const memberCountElement = factionItem.querySelector('[data-stat="members"]');
        const weeklyGrowthElement = factionItem.querySelector('[data-stat="weekly"]');

        if (memberCountElement) {
            memberCountElement.innerHTML = `<i class="fas fa-users"></i>${memberCount.toLocaleString()} members`;
        }
        if (weeklyGrowthElement) {
            weeklyGrowthElement.innerHTML = `<i class="fas fa-chart-line"></i>+${weeklyGrowth} this week`;
        }
    }
    
    // Update individual faction page stats if we're on one
    if (window.location.pathname.includes('/factions/')) {
        const currentFaction = window.location.pathname.split('/').pop().replace('.html', '');
        if (currentFaction === factionName) {
            const memberCountElement = document.querySelector(`[data-faction="${factionName}"][data-stat="members"]`);
            const weeklyGrowthElement = document.querySelector(`[data-faction="${factionName}"][data-stat="weekly"]`);
            
            if (memberCountElement) {
                memberCountElement.textContent = memberCount.toLocaleString();
            }
            if (weeklyGrowthElement) {
                weeklyGrowthElement.textContent = `+${weeklyGrowth}`;
            }
        }
    }
}

// Authentication Functions
async function handleLogin(e) {
    console.log('handleLogin called!');
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login attempt with email:', email);
    
    // Add loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Check if email verification is required
        if (data.requiresVerification) {
            showNotification('Please verify your email address before logging in. Check your inbox for a verification link.', 'error');
            return;
        }
        
        // Store token and user data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Close modal and show success message
        closeModal();
        showNotification(`Welcome back, ${data.user.username}!`, 'success');
        
        // Update UI for logged-in user
        updateUIForLoggedInUser();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const faction = document.getElementById('signupFaction').value;
    
    // Add loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password, faction })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Check if email verification is required
        if (data.requiresVerification) {
            // Close modal and show verification message
            closeModal();
            showNotification(`Account created successfully! Please check your email at ${email} and click the verification link to activate your account.`, 'success');
            
            // Clear the form
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
            document.getElementById('signupFaction').value = '';
            
            // Don't log them in yet - they need to verify email first
            return;
        }
        
        // If no verification required (or already verified), proceed with login
        if (data.token && data.user) {
            // Store token and user data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // Close modal and show success message
            closeModal();
            showNotification(`Welcome to ${faction}!`, 'success');
            
            // Update UI for logged-in user
            updateUIForLoggedInUser();
            
            // Update faction counts immediately
            updateFactionCounts();
        }
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    const navAuth = document.querySelector('.nav-auth');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.username) {
        navAuth.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn">
                    <span class="username">${userData.username}</span>
                    <span class="faction-tag ${userData.faction}">${userData.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </button>
                <div class="user-dropdown">
                    <a href="profile.html" class="dropdown-item profile-link">Profile</a>
                    <button class="dropdown-item logout-btn">Logout</button>
                </div>
            </div>
        `;
        

        
        // Add logout functionality
        const logoutBtn = navAuth.querySelector('.logout-btn');
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                location.reload();
            }, 1000);
        });
        
        // Add user menu toggle
        const userMenuBtn = navAuth.querySelector('.user-menu-btn');
        const userDropdown = navAuth.querySelector('.user-dropdown');
        
        userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('show');
        });
        
        // Add profile link click handler with a small delay to ensure DOM is ready
        setTimeout(() => {
            const profileLink = navAuth.querySelector('.profile-link');
            console.log('Profile link found:', profileLink); // Debug log
            if (profileLink) {
                profileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Profile link clicked'); // Debug log
                    // Navigate to profile page
                    window.location.href = 'profile.html';
                    // Close dropdown
                    userDropdown.classList.remove('show');
                });
                console.log('Profile link event listener attached'); // Debug log
            } else {
                console.log('Profile link not found!'); // Debug log
            }
        }, 100);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!navAuth.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }
}

// Delete account function
async function handleDeleteAccount() {
    // Get email from login form if available, otherwise from stored user data
    let email = '';
    const loginEmailInput = document.getElementById('loginEmail');
    
    if (loginEmailInput && loginEmailInput.value) {
        email = loginEmailInput.value;
    } else {
        // Get from stored user data (for profile page)
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        email = userData.email;
        
        if (!email) {
            showNotification('Unable to find email address. Please log in again.', 'error');
            return;
        }
    }
    
    // Double confirmation
    const confirmDelete = confirm(`Are you sure you want to delete the account for ${email}? This action cannot be undone.`);
    if (!confirmDelete) {
        return; // User cancelled
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/delete-account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete account');
        }
        
        showNotification('Account deleted successfully! You can now create a new account.', 'success');
        
        // Clear stored data and redirect to home page
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Forgot password function
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
        showNotification('Please enter your email address first', 'error');
        return;
    }
    
    try {
        // Show loading state
        const forgotPasswordLink = e.target;
        const originalText = forgotPasswordLink.textContent;
        forgotPasswordLink.textContent = 'Sending...';
        forgotPasswordLink.style.pointerEvents = 'none';
        
        const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset email');
        }
        
        showNotification(`Password reset link sent to ${email}. Please check your email and click the verification link to reset your password.`, 'success');
        
        // Clear the email field for security
        document.getElementById('loginEmail').value = '';
        
        // Close the modal after successful request
        closeModal();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        // Reset the link
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.textContent = 'Forgot Password?';
            forgotPasswordLink.style.pointerEvents = 'auto';
        }
    }
}

// Check if user is already logged in on page load
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        updateUIForLoggedInUser();
    }
}

// Check if user is on profile page and redirect if not logged in
function checkProfilePageAuth() {
    if (window.location.pathname.includes('profile.html')) {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
            // Redirect to home page if not logged in
            window.location.href = 'index.html';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    // Ensure modal is hidden on page load
    if (modal) modal.classList.remove('show');
    
    // Add form event listeners
    const loginForm = document.querySelector('#loginForm form');
    const signupForm = document.querySelector('#signupForm form');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    
    console.log('Login form found:', loginForm);
    console.log('Signup form found:', signupForm);
    console.log('Delete account button found:', deleteAccountBtn);
    console.log('Forgot password link found:', forgotPasswordLink);
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login event listener attached');
    } else {
        console.error('Login form not found!');
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('Signup event listener attached');
    } else {
        console.error('Signup form not found!');
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
        console.log('Delete account event listener attached');
    } else {
        console.error('Delete account button not found!');
    }
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
        console.log('Forgot password event listener attached');
    } else {
        console.error('Forgot password link not found!');
    }
    
    checkAuthStatus();
    checkProfilePageAuth(); // Check if user should be on profile page
    updateFactionCounts();
    initializeSocket(); // Initialize Socket.IO
    

    
    // Update counts every 30 seconds as backup
    setInterval(updateFactionCounts, 30000);
});



// Export functions for use in faction pages
window.navigateToSection = function(section) {
    // Store the target section in localStorage
    localStorage.setItem('targetSection', section);
    // Navigate to the main page
    window.location.href = '../index.html';
};

// Check if we need to scroll to a specific section after page load
window.addEventListener('load', function() {
    const targetSection = localStorage.getItem('targetSection');
    if (targetSection) {
        localStorage.removeItem('targetSection');
        // Small delay to ensure the page is fully loaded
        setTimeout(() => {
            const section = document.querySelector(`#${targetSection}`);
            if (section) {
                const offsetTop = section.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
    

});

// Test function to demonstrate live updates (for development)
window.testLiveUpdate = function(faction = 'bone-march') {
    fetch(`${API_BASE_URL}/api/admin/update-faction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            faction, 
            memberChange: 1, 
            weeklyGrowthChange: 1 
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Test update result:', data);
        showNotification('Test update sent for ${faction}', 'info');
    })
    .catch(error => {
        console.error('Test update failed:', error);
        showNotification('Test update failed', 'error');
    });
};
