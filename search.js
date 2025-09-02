// Search Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - checking if we\'re on search page...');
    
    // Check if we're on the search page
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.log('Not on search page, skipping search initialization');
        return;
    }
    
    console.log('On search page, starting initialization...');
    
    // Initialize search functionality
    initializeSearch();
    
    // Check authentication status
    checkAuthStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('Search page initialization complete');
});

// Global variables
let currentPage = 1;
let currentResults = [];
let isSearching = false;

// Initialize search functionality
function initializeSearch() {
    // Check if we're on the search page
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.log('Not on search page, skipping search initialization');
        return;
    }
    
    console.log('Initializing search functionality...');
    
    // Load saved theme if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        loadSavedTheme();
        console.log('Theme loaded from localStorage');
    } else {
        console.log('No theme found in localStorage');
    }
    
    // Show initial state
    showInitialState();
    console.log('Search initialization complete');
}

// Check authentication status
function checkAuthStatus() {
    // Check if we're on a page with auth elements
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    if (!loginBtn || !signupBtn) {
        console.log('Auth elements not found, skipping auth status check');
        return;
    }
    
    console.log('Checking authentication status...');
    
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    const navAuth = document.querySelector('.nav-auth');
    
    if (token && userData && navAuth) {
        console.log('User is authenticated, updating UI...');
        // User is logged in
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        
        // Show user info or logout button
        navAuth.innerHTML = `
            <div class="connection-status" id="connectionStatus">
                <span class="status-dot connected"></span>
                <span class="status-text">Connected</span>
                </div>
            <button id="logoutBtn" class="btn btn-outline">Logout</button>
        `;
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
            console.log('Logout button event listener added');
        }
        
        // Update connection status
        updateConnectionStatus(true);
    } else {
        console.log('User is not authenticated');
        // User is not logged in
        updateConnectionStatus(false);
    }
    
    console.log('Authentication status check complete');
}

// Set up event listeners
function setupEventListeners() {
    // Check if we're on the search page
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.log('Not on search page, skipping event listener setup');
        return;
    }
    
    console.log('Setting up event listeners for search page...');
    
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        console.log('Search button event listener added');
    } else {
        console.log('Search button not found');
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        console.log('Search input event listener added');
    }
    
    // Filters
    const factionFilter = document.getElementById('factionFilter');
    const recentUsersBtn = document.getElementById('recentUsersBtn');
    if (factionFilter) {
        factionFilter.addEventListener('change', performSearch);
        console.log('Faction filter event listener added');
    } else {
        console.log('Faction filter not found');
    }
    
    if (recentUsersBtn) {
        recentUsersBtn.addEventListener('click', showRecentUsers);
        console.log('Recent users button event listener added');
    } else {
        console.log('Recent users button not found');
    }
    
    // Pagination
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) {
        prevPage.addEventListener('click', () => changePage(-1));
        console.log('Previous page button event listener added');
    } else {
        console.log('Previous page button not found');
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => changePage(1));
        console.log('Next page button event listener added');
    } else {
        console.log('Next page button not found');
    }
    
    // Auth modal
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (loginBtn) {
        loginBtn.addEventListener('click', showAuthModal);
        console.log('Login button event listener added');
    } else {
        console.log('Login button not found');
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', showAuthModal);
        console.log('Signup button event listener added');
    } else {
        console.log('Signup button not found');
    }
    
    if (closeAuthModal) {
        closeAuthModal.addEventListener('click', hideAuthModal);
        console.log('Close auth modal event listener added');
    } else {
        console.log('Close auth modal button not found');
    }
    
    // Auth form switching
    const showSignupForm = document.getElementById('showSignupForm');
    const showLoginForm = document.getElementById('showLoginForm');
    if (showSignupForm) {
        showSignupForm.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupForm();
        });
        console.log('Show signup form event listener added');
    } else {
        console.log('Show signup form button not found');
    }
    
    if (showLoginForm) {
        showLoginForm.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
        console.log('Show login form event listener added');
    } else {
        console.log('Show login form button not found');
    }
    
    // Auth form submissions
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login form event listener added');
    } else {
        console.log('Login form not found');
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('Signup form event listener added');
    } else {
        console.log('Signup form not found');
    }
    
    // User profile modal
    const closeUserModal = document.getElementById('closeUserModal');
    const viewFullProfileBtn = document.getElementById('viewFullProfileBtn');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (closeUserModal) {
        closeUserModal.addEventListener('click', hideUserProfileModal);
        console.log('Close user modal event listener added');
    } else {
        console.log('Close user modal button not found');
    }
    
    if (viewFullProfileBtn) {
        viewFullProfileBtn.addEventListener('click', viewFullProfile);
        console.log('View full profile button event listener added');
    } else {
        console.log('View full profile button not found');
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
        console.log('Send message button event listener added');
    } else {
        console.log('Send message button not found');
    }
    
    // Message modal
    const closeMessageModal = document.getElementById('closeMessageModal');
    const cancelMessageBtn = document.getElementById('cancelMessageBtn');
    const sendMessageModalBtn = document.getElementById('sendMessageModalBtn');
    if (closeMessageModal) {
        closeMessageModal.addEventListener('click', hideMessageModal);
        console.log('Close message modal event listener added');
    } else {
        console.log('Close message modal button not found');
    }
    
    if (cancelMessageBtn) {
        cancelMessageBtn.addEventListener('click', hideMessageModal);
        console.log('Cancel message button event listener added');
    } else {
        console.log('Cancel message button not found');
    }
    
    if (sendMessageModalBtn) {
        sendMessageModalBtn.addEventListener('click', sendMessage);
        console.log('Send message modal button event listener added');
    } else {
        console.log('Send message modal button not found');
    }
    
    // Gallery modal
    const closeGalleryModal = document.getElementById('closeGalleryModal');
    if (closeGalleryModal) {
        closeGalleryModal.addEventListener('click', hideGalleryModal);
        console.log('Close gallery modal event listener added');
    } else {
        console.log('Close gallery modal button not found');
    }
    
    console.log('Event listener setup complete');
}

// Show initial state
function showInitialState() {
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');
    const resultsGrid = document.getElementById('resultsGrid');
    
    if (resultsTitle) resultsTitle.textContent = 'Welcome to Player Search';
    if (resultsCount) resultsCount.textContent = 'Search for other necromancers to find allies or rivals';
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-users"></i>
                <h3>Ready to explore?</h3>
                <p>Use the search bar above to find other players by username, or filter by faction to discover new allies.</p>
            </div>
        `;
    }
}

// Perform search
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const faction = document.getElementById('factionFilter').value;
    
    if (!query && !faction) {
        showInitialState();
        return;
    }
    
    console.log('Performing search with query:', query, 'faction:', faction);
    
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
        showAuthModal();
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        console.log('Using API URL:', API_BASE_URL);
        
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (faction) params.append('faction', faction);
        params.append('limit', '20');
        params.append('offset', (currentPage - 1) * 20);
        
        const searchUrl = `${API_BASE_URL}/api/users/search?${params}`;
        console.log('Search URL:', searchUrl);
        
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Search response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Search response error text:', errorText);
            throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }
        
        const users = await response.json();
        console.log('Search results:', users);
        currentResults = users;
        
        if (users.length === 0) {
            showNoResults();
        } else {
            showSearchResults(users, query, faction);
        }
        
        // Update pagination
        updatePagination();
        
    } catch (error) {
        console.error('Search error:', error);
        showError(`Search failed: ${error.message}`);
    } finally {
        hideLoadingState();
    }
}

// Show recent users
async function showRecentUsers() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showAuthModal();
        return;
    }
    
    console.log('Fetching recent users...');
    showLoadingState();
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        console.log('Using API URL:', API_BASE_URL);
        
        const response = await fetch(`${API_BASE_URL}/api/users/recent?limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`Failed to fetch recent users: ${response.status} ${response.statusText}`);
        }
        
        const users = await response.json();
        console.log('Recent users response:', users);
        currentResults = users;
        
        if (users.length === 0) {
            showNoResults();
        } else {
            showSearchResults(users, null, null, 'Recent Activity');
        }
        
        // Update pagination
        updatePagination();
        
    } catch (error) {
        console.error('Recent users error:', error);
        showError(`Failed to fetch recent users: ${error.message}`);
    } finally {
        hideLoadingState();
    }
}

// Show search results
function showSearchResults(users, query, faction, customTitle = null) {
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');
    const resultsGrid = document.getElementById('resultsGrid');
    const searchResults = document.getElementById('searchResults');
    
    if (!resultsTitle || !resultsCount || !resultsGrid || !searchResults) {
        console.error('Required search elements not found');
        return;
    }
    
    // Update title and count
    if (customTitle) {
        resultsTitle.textContent = customTitle;
    } else if (query && faction) {
        resultsTitle.textContent = `Search Results for "${query}" in ${getFactionDisplayName(faction)}`;
    } else if (query) {
        resultsTitle.textContent = `Search Results for "${query}"`;
    } else if (faction) {
        resultsTitle.textContent = `${getFactionDisplayName(faction)} Members`;
    }
    
    resultsCount.textContent = `${users.length} necromancer${users.length !== 1 ? 's' : ''} found`;
    
    // Generate user cards
    const userCards = users.map(user => createUserCard(user)).join('');
    resultsGrid.innerHTML = userCards;
    
    // Show results section
    searchResults.style.display = 'block';
}

// Create user card
function createUserCard(user) {
    const avatarHtml = user.avatarUrl 
        ? `<img src="${user.avatarUrl}" alt="${user.username}" class="user-avatar">`
        : `<i class="fas fa-user"></i>`;
    
    const lastActivity = formatLastActivity(user.lastActivity);
    const factionDisplayName = getFactionDisplayName(user.faction);
    
    return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-card-header">
                <div class="user-avatar">
                    ${avatarHtml}
                </div>
                <div class="user-info">
                    <h3 class="user-username">${user.username}</h3>
                    <p class="user-faction">${factionDisplayName}</p>
                </div>
                <button class="user-card-menu" onclick="showUserProfileModal(${user.id})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
            <div class="user-card-body">
                <div class="user-stats">
                    <div class="user-stat">
                        <span class="stat-label">Member Since</span>
                        <span class="stat-value">${formatDate(user.factionJoinDate || user.created_at)}</span>
                    </div>
                    <div class="user-stat">
                        <span class="stat-label">Last Active</span>
                        <span class="stat-value">${lastActivity}</span>
                    </div>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="btn btn-outline btn-sm" onclick="showUserProfileModal(${user.id})">
                    <i class="fas fa-eye"></i>
                    View Profile
                </button>
            </div>
        </div>
    `;
}

// Show user profile modal
function showUserProfileModal(userId) {
    const user = currentResults.find(u => u.id === userId);
    if (!user) return;
    
    const modalUsername = document.getElementById('modalUsername');
    const modalUserFaction = document.getElementById('modalUserFaction');
    const modalUserJoined = document.getElementById('modalUserJoined');
    const modalUserActivity = document.getElementById('modalUserActivity');
    const modalAvatar = document.getElementById('modalUserAvatar');
    const viewFullProfileBtn = document.getElementById('viewFullProfileBtn');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const userProfileModal = document.getElementById('userProfileModal');
    
    if (!modalUsername || !modalUserFaction || !modalUserJoined || !modalUserActivity || 
        !modalAvatar || !viewFullProfileBtn || !sendMessageBtn || !userProfileModal) {
        console.error('Required modal elements not found');
        return;
    }
    
    // Populate modal with user data
    modalUsername.textContent = user.username;
    modalUserFaction.textContent = getFactionDisplayName(user.faction);
    modalUserJoined.textContent = `Joined: ${formatDate(user.factionJoinDate || user.created_at)}`;
    modalUserActivity.textContent = `Last Active: ${formatLastActivity(user.lastActivity)}`;
    
    // Set avatar
    if (user.avatarUrl) {
        modalAvatar.innerHTML = `<img src="${user.avatarUrl}" alt="${user.username}">`;
    } else {
        modalAvatar.innerHTML = `<i class="fas fa-user"></i>`;
    }
    
    // Store user data for actions
    viewFullProfileBtn.setAttribute('data-user-id', user.id);
    sendMessageBtn.setAttribute('data-user-id', user.id);
    
    // Show modal
    userProfileModal.classList.add('show');
}

// Hide user profile modal
function hideUserProfileModal() {
    const userProfileModal = document.getElementById('userProfileModal');
    if (userProfileModal) {
        userProfileModal.classList.remove('show');
    }
}

// View full profile
function viewFullProfile() {
    const userId = document.getElementById('viewFullProfileBtn').getAttribute('data-user-id');
    const user = currentResults.find(u => u.id === parseInt(userId));
    
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    // Show full profile modal
    showFullProfileModal(user);
}

// Send message
function sendMessage() {
    const userId = document.getElementById('sendMessageBtn').getAttribute('data-user-id');
    // For now, just show a message. In the future, this could open a messaging system
    showNotification('Messaging system coming soon!', 'info');
}

// Show full profile modal
async function showFullProfileModal(user) {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999';
    
    // Show loading state
    modal.innerHTML = `
        <div class="modal-content full-profile-modal">
            <div class="modal-header">
                <h2><i class="fas fa-user"></i> Loading Profile...</h2>
                <button class="modal-close" onclick="closeFullProfileModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <p>Loading necromancer profile...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    try {
        // Fetch detailed user information
        const detailedUser = await fetchUserDetails(user.id);
        if (!detailedUser) {
            throw new Error('Failed to load user details');
        }
        
        // Update modal with detailed information
        updateProfileModal(modal, detailedUser);
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        modal.innerHTML = `
            <div class="modal-content full-profile-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
                    <button class="modal-close" onclick="closeFullProfileModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 40px;">
                        <p>Failed to load profile: ${error.message}</p>
                        <button class="btn btn-primary" onclick="closeFullProfileModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFullProfileModal();
        }
    });
    
    // Close modal with Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeFullProfileModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Fetch detailed user information
async function fetchUserDetails(userId) {
    const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user details');
    }
    
    return await response.json();
}

// Update profile modal with user data
function updateProfileModal(modal, user) {
    const lastActivity = formatLastActivity(user.lastActivity);
    const factionDisplayName = getFactionDisplayName(user.faction);
    const joinDate = formatDate(user.factionJoinDate || user.created_at);
    
    modal.innerHTML = `
        <div class="modal-content full-profile-modal">
            <div class="modal-header">
                <h2><i class="fas fa-user"></i> ${user.username}'s Profile</h2>
                <button class="modal-close" onclick="closeFullProfileModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="profile-header">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            ${user.avatarUrl ? 
                                `<img src="${user.avatarUrl}" alt="${user.username}" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;">` : 
                                `<i class="fas fa-user"></i>`
                            }
                        </div>
                    </div>
                    <div class="profile-info-section">
                        <h3 class="profile-username">${user.username}</h3>
                        <p class="profile-faction">${factionDisplayName}</p>
                        <div class="profile-stats">
                            <div class="profile-stat">
                                <span class="stat-label">Member Since</span>
                                <span class="stat-value">${joinDate}</span>
                            </div>
                            <div class="profile-stat">
                                <span class="stat-label">Last Active</span>
                                <span class="stat-value">${lastActivity}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="profile-content">
                    <div class="profile-section">
                        <h4><i class="fas fa-info-circle"></i> About</h4>
                        <p class="profile-description">
                            ${user.description || 'No description available. This necromancer prefers to keep their secrets hidden.'}
                        </p>
                    </div>
                    
                    <div class="profile-section">
                        <h4><i class="fas fa-users"></i> Faction Information</h4>
                        <div class="faction-details">
                            <div class="faction-icon">
                                <img src="Faction Icons/${factionDisplayName}.png" alt="${factionDisplayName}" 
                                     onerror="this.style.display='none'">
                            </div>
                            <div class="faction-info">
                                <h5>${factionDisplayName}</h5>
                                <p>Member since ${joinDate}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h4><i class="fas fa-chart-line"></i> Activity</h4>
                        <div class="activity-stats">
                            <div class="activity-stat">
                                <span class="stat-label">Profile Views</span>
                                <span class="stat-value">--</span>
                            </div>
                            <div class="activity-stat">
                                <span class="stat-label">Gallery Items</span>
                                <span class="stat-value gallery-count">--</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="sendMessageToUser(${user.id})">
                        <i class="fas fa-envelope"></i>
                        Send Message
                    </button>
                    <button class="btn btn-outline" onclick="viewUserGallery(${user.id})">
                        <i class="fas fa-images"></i>
                        View Gallery
                    </button>
                    <button class="btn btn-outline" onclick="reportUser(${user.id})">
                        <i class="fas fa-flag"></i>
                        Report
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Load additional user data
    loadUserGalleryData(user.id);
}

// Close full profile modal
function closeFullProfileModal() {
    const modal = document.querySelector('.full-profile-modal')?.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// Load user gallery data
async function loadUserGalleryData(userId) {
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/api/gallery`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const allArtwork = await response.json();
            const userArtwork = allArtwork.filter(artwork => artwork.user_id === userId);
            
            // Update gallery count in the modal
            const galleryStat = document.querySelector('.gallery-count');
            if (galleryStat) {
                galleryStat.textContent = userArtwork.length;
            }
        }
    } catch (error) {
        console.error('Error loading user gallery data:', error);
    }
}

// Send message to user
function sendMessageToUser(userId) {
    const user = currentResults.find(u => u.id === userId);
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    showMessageModal(user);
}

// View user gallery
function viewUserGallery(userId) {
    const user = currentResults.find(u => u.id === userId);
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    showGalleryModal(user);
}

// Report user
function reportUser(userId) {
    showNotification('Report system coming soon!', 'info');
}

// Show message modal
function showMessageModal(user) {
    const messageModal = document.getElementById('messageModal');
    const messageRecipient = document.getElementById('messageRecipient');
    const messageSubject = document.getElementById('messageSubject');
    const messageContent = document.getElementById('messageContent');
    
    if (!messageModal || !messageRecipient || !messageSubject || !messageContent) {
        console.error('Message modal elements not found');
        return;
    }
    
    // Set recipient name
    messageRecipient.textContent = user.username;
    
    // Clear form
    messageSubject.value = '';
    messageContent.value = '';
    
    // Store user data for sending
    messageModal.setAttribute('data-user-id', user.id);
    messageModal.setAttribute('data-username', user.username);
    
    // Ensure message modal appears above full profile modal
    messageModal.style.zIndex = '10001';
    
    // Show modal
    messageModal.classList.add('show');
}

// Hide message modal
function hideMessageModal() {
    const messageModal = document.getElementById('messageModal');
    if (messageModal) {
        messageModal.classList.remove('show');
        // Reset z-index to default
        messageModal.style.zIndex = '';
    }
}

// Send message
async function sendMessage() {
    const messageModal = document.getElementById('messageModal');
    const messageSubject = document.getElementById('messageSubject');
    const messageContent = document.getElementById('messageContent');
    
    if (!messageModal || !messageSubject || !messageContent) {
        console.error('Message modal elements not found');
        return;
    }
    
    const userId = messageModal.getAttribute('data-user-id');
    const username = messageModal.getAttribute('data-username');
    const subject = messageSubject.value.trim();
    const content = messageContent.value.trim();
    
    if (!subject || !content) {
        showNotification('Please fill in both subject and message', 'error');
        return;
    }
    
    try {
        // For now, just show a success message
        // In a real implementation, you would send this to the server
        showNotification(`Message sent to ${username}!`, 'success');
        hideMessageModal();
        
        // Clear form
        messageSubject.value = '';
        messageContent.value = '';
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

// Show gallery modal
function showGalleryModal(user) {
    const galleryModal = document.getElementById('galleryModal');
    const galleryModalTitle = document.getElementById('galleryModalTitle');
    const galleryLoading = document.getElementById('galleryLoading');
    const galleryContent = document.getElementById('galleryContent');
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryEmpty = document.getElementById('galleryEmpty');
    
    if (!galleryModal || !galleryModalTitle || !galleryLoading || !galleryContent || !galleryGrid || !galleryEmpty) {
        console.error('Gallery modal elements not found');
        return;
    }
    
    // Set title
    galleryModalTitle.textContent = `${user.username}'s Gallery`;
    
    // Show loading state
    galleryLoading.style.display = 'block';
    galleryContent.style.display = 'none';
    galleryEmpty.style.display = 'none';
    
    // Store user data
    galleryModal.setAttribute('data-user-id', user.id);
    galleryModal.setAttribute('data-username', user.username);
    
    // Ensure gallery modal appears above full profile modal
    galleryModal.style.zIndex = '10001';
    
    // Show modal
    galleryModal.classList.add('show');
    
    // Load gallery data
    loadUserGallery(user.id);
}

// Hide gallery modal
function hideGalleryModal() {
    const galleryModal = document.getElementById('galleryModal');
    if (galleryModal) {
        galleryModal.classList.remove('show');
        // Reset z-index to default
        galleryModal.style.zIndex = '';
    }
}

// Load user gallery
async function loadUserGallery(userId) {
    const galleryLoading = document.getElementById('galleryLoading');
    const galleryContent = document.getElementById('galleryContent');
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryEmpty = document.getElementById('galleryEmpty');
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            throw new Error('Authentication required');
        }
        
        const response = await fetch(`${API_BASE_URL}/api/gallery`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch gallery');
        }
        
        const allArtwork = await response.json();
        const userArtwork = allArtwork.filter(artwork => artwork.user_id === userId);
        
        // Hide loading
        galleryLoading.style.display = 'none';
        galleryContent.style.display = 'block';
        
        if (userArtwork.length === 0) {
            galleryEmpty.style.display = 'block';
            galleryGrid.style.display = 'none';
        } else {
            galleryEmpty.style.display = 'none';
            galleryGrid.style.display = 'grid';
            
            // Populate gallery
            const galleryItems = userArtwork.map(artwork => createGalleryItem(artwork)).join('');
            galleryGrid.innerHTML = galleryItems;
        }
        
    } catch (error) {
        console.error('Error loading user gallery:', error);
        galleryLoading.style.display = 'none';
        galleryContent.style.display = 'block';
        galleryEmpty.style.display = 'block';
        galleryGrid.style.display = 'none';
        
        // Update empty state with error message
        const emptyTitle = galleryEmpty.querySelector('h4');
        const emptyText = galleryEmpty.querySelector('p');
        if (emptyTitle && emptyText) {
            emptyTitle.textContent = 'Error loading gallery';
            emptyText.textContent = 'Failed to load artwork. Please try again later.';
        }
    }
}

// Create gallery item HTML
function createGalleryItem(artwork) {
    const imageHtml = artwork.image_url 
        ? `<img src="${artwork.image_url}" alt="${artwork.character_name || 'Artwork'}" class="gallery-item-image" onerror="this.style.display='none'">`
        : `<div class="gallery-item-image" style="display: flex; align-items: center; justify-content: center; color: var(--text-light);"><i class="fas fa-image"></i></div>`;
    
    return `
        <div class="gallery-item">
            ${imageHtml}
            <div class="gallery-item-content">
                <h4 class="gallery-item-title">${artwork.character_name || 'Untitled'}</h4>
                <p class="gallery-item-description">${artwork.description || 'No description available.'}</p>
                <div class="gallery-item-meta">
                    <span>${formatDate(artwork.created_at)}</span>
                    <span>${getFactionDisplayName(artwork.faction)}</span>
                </div>
            </div>
        </div>
    `;
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 12px 16px;
                color: var(--text-primary);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-success {
                border-left: 4px solid #10b981;
            }
            
            .notification-error {
                border-left: 4px solid #ef4444;
            }
            
            .notification-info {
                border-left: 4px solid #3b82f6;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// Change page
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage < 1) return;
    
    currentPage = newPage;
    performSearch();
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (!pagination || !prevBtn || !nextBtn || !pageInfo) {
        return;
    }
    
    if (currentResults.length < 20) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentResults.length < 20;
    
    pageInfo.textContent = `Page ${currentPage}`;
}

// Show loading state
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');
    
    if (loadingState) loadingState.style.display = 'block';
    if (resultsGrid) resultsGrid.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const resultsGrid = document.getElementById('resultsGrid');
    
    if (loadingState) loadingState.style.display = 'none';
    if (resultsGrid) resultsGrid.style.display = 'grid';
}

// Show no results
function showNoResults() {
    const noResults = document.getElementById('noResults');
    const resultsGrid = document.getElementById('resultsGrid');
    const pagination = document.getElementById('pagination');
    
    if (noResults) noResults.style.display = 'block';
    if (resultsGrid) resultsGrid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
}

// Show error
function showError(message) {
    const resultsGrid = document.getElementById('resultsGrid');
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatLastActivity(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

function getFactionDisplayName(faction) {
    const factionNames = {
        'bone-march': 'Bone March',
        'choir-silence': 'Choir of Silence',
        'cult-withered-flame': 'Cult of the Withered Flame',
        'gravewrought-court': 'The GraveWrought Court',
        'swarm-mireborn': 'Swarm of the Mireborn',
        'dawnflame-order': 'DawnFlame Order',
        'hollowed-redeemed': 'Hollowed Redeemed'
    };
    return factionNames[faction] || faction;
}

// Authentication functions
function showAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('show');
    }
}

function hideAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('show');
    }
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authModalTitle = document.getElementById('authModalTitle');
    
    if (loginForm && signupForm && authModalTitle) {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        authModalTitle.textContent = 'Login';
    }
}

function showSignupForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authModalTitle = document.getElementById('authModalTitle');
    
    if (loginForm && signupForm && authModalTitle) {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        authModalTitle.textContent = 'Sign Up';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            throw new Error('Login failed');
        }
        
        const data = await response.json();
        
        // Store auth data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Hide modal and refresh page
        hideAuthModal();
        location.reload();
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const faction = document.getElementById('signupFaction').value;
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, faction })
        });
        
        if (!response.ok) {
            throw new Error('Signup failed');
        }
        
        const data = await response.json();
        
        // Store auth data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Hide modal and refresh page
        hideAuthModal();
        location.reload();
        
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    location.reload();
}

// Connection status
function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (statusDot && statusText) {
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }
}

// Theme functions
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            applyTheme(theme);
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    }
}

function applyTheme(theme) {
    if (!theme || typeof theme !== 'object') return;
    
    Object.entries(theme).forEach(([property, value]) => {
        if (value && typeof value === 'string') {
            document.documentElement.style.setProperty(property, value);
        }
    });
}
