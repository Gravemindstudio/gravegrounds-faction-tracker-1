// Gallery.js - Last updated: 2024-12-19
// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';

// Gallery state
let allGalleryItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 12;

// Socket.IO connection
let socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// DOM Elements (will be initialized after DOM loads)
let modal, uploadModal, loginBtn, signupBtn, closeBtns, authTabs, loginForm, signupForm, uploadForm, uploadBtn;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements after DOM is loaded
    modal = document.getElementById('authModal');
    uploadModal = document.getElementById('uploadModal');
    artworkModal = document.getElementById('artworkModal');
    loginBtn = document.getElementById('loginBtn');
    signupBtn = document.getElementById('signupBtn');
    closeBtns = document.querySelectorAll('.close');
    authTabs = document.querySelectorAll('.auth-tab');
    loginForm = document.getElementById('loginForm');
    signupForm = document.getElementById('signupForm');
    uploadForm = document.getElementById('uploadForm');
    uploadBtn = document.getElementById('uploadBtn');
    
    // Ensure modals are hidden on page load
    if (modal) modal.classList.remove('show');
    if (uploadModal) uploadModal.classList.remove('show');
    if (artworkModal) artworkModal.classList.remove('show');
    
    // Initialize everything after DOM is ready
    initializeGallery();
    initializeAuth();
    checkAuthStatus(); // Check if user is already logged in
    
    // Initialize Socket.IO after a short delay to ensure DOM is fully ready
    setTimeout(() => {
        initializeSocket();
        loadGalleryData();
    }, 100);
});

// Socket.IO initialization
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
        
        socket.on('connect', () => {
            console.log('Connected to server via Socket.IO');
            reconnectAttempts = 0;
            updateConnectionStatus('connected', 'Live Updates Active');
        });
        
        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            updateConnectionStatus('disconnected', 'Disconnected');
        });
        
        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            reconnectAttempts++;
            updateConnectionStatus('connecting', 'Reconnecting...');
        });
        
        socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            updateConnectionStatus('connected', 'Live Updates Active');
        });
        
        // Listen for gallery updates
        socket.on('factionUpdate', (data) => {
            if (data.type === 'galleryUpdated') {
                loadGalleryData(); // Refresh gallery
            }
        });
        
    } catch (error) {
        console.error('Error initializing Socket.IO:', error);
    }
}

// Update connection status indicator
function updateConnectionStatus(status, text) {
    try {
        // Check if the connection status element exists before trying to update it
        let connectionStatus = document.querySelector('#connectionStatus');
        
        if (!connectionStatus) {
            // Try to recreate the connection status element
            const navAuth = document.querySelector('.nav-auth');
            if (navAuth) {
                connectionStatus = document.createElement('div');
                connectionStatus.className = 'connection-status';
                connectionStatus.id = 'connectionStatus';
                connectionStatus.innerHTML = `
                    <span class="status-dot"></span>
                    <span class="status-text">Connecting...</span>
                `;
                
                // Insert it at the beginning of navAuth
                navAuth.insertBefore(connectionStatus, navAuth.firstChild);
            } else {
                return; // Cannot recreate
            }
        }
        
        const statusDot = connectionStatus.querySelector('.status-dot');
        const statusText = connectionStatus.querySelector('.status-text');
        
        // Only update if both elements exist
        if (statusDot && statusText) {
            statusDot.classList.remove('connected', 'connecting', 'disconnected');
            statusDot.classList.add(status);
            statusText.textContent = text;
        }
    } catch (error) {
        console.log('Error updating connection status:', error);
    }
}

// Initialize gallery functionality
function initializeGallery() {
    // Upload button
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const userData = localStorage.getItem('userData');
            if (!userData) {
                showNotification('Please log in to upload your necromancer', 'warning');
                openModal('auth');
                return;
            }
            openModal('upload');
        });
    }

    // Filter controls
    const factionFilter = document.getElementById('factionFilter');
    const sortBy = document.getElementById('sortBy');
    const searchGallery = document.getElementById('searchGallery');

    if (factionFilter) {
        factionFilter.addEventListener('change', applyFilters);
    }
    if (sortBy) {
        sortBy.addEventListener('change', applyFilters);
    }
    if (searchGallery) {
        searchGallery.addEventListener('input', debounce(applyFilters, 300));
    }

    // Upload form
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    // Image preview functionality
    const imageInput = document.getElementById('characterImage');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
}

// Initialize authentication
function initializeAuth() {
    // Event listeners
    if (loginBtn) loginBtn.addEventListener('click', () => openModal('auth'));
    if (signupBtn) signupBtn.addEventListener('click', () => openModal('auth'));
    
    // Handle all close buttons
    closeBtns.forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            console.log('Close button clicked:', e.target);
            // Determine which modal to close based on the close button's parent
            if (closeBtn.closest('#uploadModal')) {
                console.log('Closing upload modal');
                closeModal('upload');
            } else if (closeBtn.closest('#authModal')) {
                console.log('Closing auth modal');
                closeModal('auth');
            }
        });
    });
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });

    // Add form event listeners for login/signup
    const loginFormElement = document.querySelector('#loginForm form');
    const signupFormElement = document.querySelector('#signupForm form');
    
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', handleSignup);
    }
}

// Modal functionality
function openModal(type) {
    if (type === 'auth' && modal) {
        modal.classList.add('show');
    } else if (type === 'upload' && uploadModal) {
        uploadModal.classList.add('show');
    }
}

function closeModal(type) {
    console.log('closeModal called with type:', type);
    if (type === 'auth' && modal) {
        console.log('Closing auth modal');
        modal.classList.remove('show');
    } else if (type === 'upload' && uploadModal) {
        console.log('Closing upload modal');
        uploadModal.classList.remove('show');
        
        // Clear image preview when closing upload modal
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.style.display = 'none';
        }
        
        // Reset the form
        if (uploadForm) {
            uploadForm.reset();
        }
    }
}

function closeUploadModal() {
    closeModal('upload');
}

// Tab switching
function switchTab(tabName) {
    authTabs.forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    const activeForm = document.getElementById(`${tabName}Form`);
    if (activeForm) activeForm.classList.add('active');
}

// Load gallery data
async function loadGalleryData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/gallery`);
        if (!response.ok) throw new Error('Failed to fetch gallery data');
        
        allGalleryItems = await response.json();
        if (allGalleryItems) {
            updateGalleryStats();
            applyFilters();
        }
        
    } catch (error) {
        console.error('Error loading gallery data:', error);
        showEmptyGallery();
    }
}

// Update gallery statistics
function updateGalleryStats() {
    const totalCharacters = document.getElementById('totalCharacters');
    const activeFactions = document.getElementById('activeFactions');
    const totalCreators = document.getElementById('totalCreators');
    
    // Check if elements exist before trying to update them
    if (totalCharacters && allGalleryItems) {
        totalCharacters.textContent = allGalleryItems.length;
    }
    
    if (activeFactions && allGalleryItems) {
        const uniqueFactions = new Set(allGalleryItems.map(item => item.faction));
        activeFactions.textContent = uniqueFactions.size;
    }
    
    if (totalCreators && allGalleryItems) {
        const uniqueCreators = new Set(allGalleryItems.map(item => item.username));
        totalCreators.textContent = uniqueCreators.size;
    }
}

// Apply filters and sorting
function applyFilters() {
    const factionFilter = document.getElementById('factionFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'newest';
    const searchQuery = document.getElementById('searchGallery')?.value || '';
    
    // Filter by faction
    filteredItems = allGalleryItems.filter(item => {
        if (factionFilter && item.faction !== factionFilter) return false;
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            return item.character_name?.toLowerCase().includes(searchLower) ||
                   item.description?.toLowerCase().includes(searchLower) ||
                   item.username?.toLowerCase().includes(searchLower);
        }
        return true;
    });
    
    // Sort items
    switch (sortBy) {
        case 'newest':
            filteredItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            filteredItems.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'faction':
            filteredItems.sort((a, b) => a.faction.localeCompare(b.faction));
            break;
        case 'username':
            filteredItems.sort((a, b) => a.username.localeCompare(b.username));
            break;
    }
    
    currentPage = 1;
    renderGallery();
    renderPagination();
}

// Render gallery items
function renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;
    
    if (filteredItems.length === 0) {
        showEmptyGallery();
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredItems.slice(startIndex, endIndex);
    
    galleryGrid.innerHTML = pageItems.map(item => renderGalleryItem(item)).join('');
}

// Render individual gallery item
function renderGalleryItem(item) {
    return `
        <div class="gallery-item" data-id="${item.id}" onclick="openArtworkModal(${item.id})">
            <div class="necromancer-card">
                <div class="necromancer-image">
                    ${item.image_url ? 
                        `<img src="${item.image_url}" alt="${item.character_name || item.username}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="image-placeholder" style="display: ${item.image_url ? 'none' : 'flex'};">
                        <i class="fas fa-user-circle"></i>
                        ${item.image_missing ? '<span class="missing-image-text">Image Missing</span>' : ''}
                    </div>
                </div>
                <div class="necromancer-info">
                    <h4>${item.character_name || item.username}</h4>
                    <span class="faction-tag ${item.faction}">${item.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    ${item.description ? `<p class="necromancer-description">${item.description}</p>` : ''}
                    <small class="necromancer-username">by ${item.username}</small>
                    <small class="necromancer-date">${formatDate(item.created_at)}</small>
                </div>
            </div>
        </div>
    `;
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('galleryPagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="btn btn-outline" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="btn btn-primary" disabled>${i}</button>`;
        } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `<button class="btn btn-outline" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="btn btn-outline" onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    paginationHTML += '</div>';
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    currentPage = page;
    renderGallery();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show empty gallery state
function showEmptyGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        galleryGrid.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-gallery-icon">
                    <i class="fas fa-images"></i>
                </div>
                <h3>No Characters Found</h3>
                <p>No characters match your current filters. Try adjusting your search criteria or be the first to upload a character!</p>
                <button class="btn btn-primary" onclick="openModal('upload')">
                    Upload Your Necromancer
                </button>
            </div>
        `;
    }
}

// Handle image preview
function handleImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Handle character upload
async function handleUpload(e) {
    e.preventDefault();
    
    console.log('Upload form submitted');
    
    const characterName = document.getElementById('characterName').value;
    const description = document.getElementById('characterDescription').value;
    const imageFile = document.getElementById('characterImage').files[0];
    const faction = document.getElementById('characterFaction').value;
    
    console.log('Upload data:', { characterName, description, faction, imageFile: imageFile ? imageFile.name : 'No file' });
    
    if (!characterName || !faction) {
        showNotification('Character name and faction are required', 'error');
        return;
    }
    
    if (!imageFile) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (5MB limit)
    if (imageFile.size > 5 * 1024 * 1024) {
        showNotification('Image file size must be less than 5MB', 'error');
        return;
    }
    
    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
        showNotification('Please select a valid image file (JPG, PNG, GIF)', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        console.log('Auth token:', token ? 'Present' : 'Missing');
        
        if (!token) {
            showNotification('Please log in to upload artwork', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Uploading...';
            submitBtn.disabled = true;
        }
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('characterName', characterName);
        formData.append('description', description);
        formData.append('characterImage', imageFile);
        formData.append('faction', faction);
        
        console.log('Sending upload request to:', `${API_BASE_URL}/api/gallery/upload`);
        
        const response = await fetch(`${API_BASE_URL}/api/gallery/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
            },
            body: formData
        });
        
        console.log('Upload response status:', response.status);
        const data = await response.json();
        console.log('Upload response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }
        
        showNotification('Character uploaded successfully!', 'success');
        closeModal('upload');
        uploadForm.reset();
        
        // Clear image preview
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.style.display = 'none';
        }
        
        // Refresh gallery
        loadGalleryData();
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification(error.message, 'error');
    } finally {
        // Reset button state
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Upload Character';
            submitBtn.disabled = false;
        }
    }
}

// Check if user is already logged in on page load
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
}

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    const navAuth = document.querySelector('.nav-auth');
    const navMenu = document.querySelector('.nav-menu');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (userData.username && navAuth) {
        // Update the navigation menu to include Profile link
        if (navMenu) {
            navMenu.innerHTML = `
                <a href="index.html" class="nav-link">Home</a>
                <a href="index.html#factions" class="nav-link">Factions</a>
                <a href="gallery.html" class="nav-link active">Gallery</a>
                <a href="profile.html" class="nav-link">Profile</a>
            `;
        }
        
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
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                showNotification('Logged out successfully', 'success');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            });
        }
        
        // Add user menu toggle
        const userMenuBtn = navAuth.querySelector('.user-menu-btn');
        const userDropdown = navAuth.querySelector('.user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', () => {
                userDropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!navAuth.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });
            
            // Add profile link click handler
            const profileLink = navAuth.querySelector('.profile-link');
            if (profileLink) {
                profileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'profile.html';
                    userDropdown.classList.remove('show');
                });
            }
        }
    }
    
    // Show upload button for logged-in users
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.style.display = 'block';
    }
}

// Update UI for logged-out user
function updateUIForLoggedOutUser() {
    const navAuth = document.querySelector('.nav-auth');
    const navMenu = document.querySelector('.nav-menu');
    
    // Update the navigation menu to remove Profile link
    if (navMenu) {
        navMenu.innerHTML = `
            <a href="index.html" class="nav-link">Home</a>
            <a href="index.html#factions" class="nav-link">Factions</a>
            <a href="gallery.html" class="nav-link active">Gallery</a>
        `;
    }
    
    if (navAuth) {
        // Check if connection status element already exists
        let connectionStatus = navAuth.querySelector('#connectionStatus');
        
        if (!connectionStatus) {
            // Create connection status element if it doesn't exist
            connectionStatus = document.createElement('div');
            connectionStatus.className = 'connection-status';
            connectionStatus.id = 'connectionStatus';
            connectionStatus.innerHTML = `
                <span class="status-dot"></span>
                <span class="status-text">Connecting...</span>
            `;
        }
        
        navAuth.innerHTML = '';
        navAuth.appendChild(connectionStatus);
        
        // Add login/signup buttons
        const loginBtn = document.createElement('button');
        loginBtn.id = 'loginBtn';
        loginBtn.className = 'btn btn-outline';
        loginBtn.textContent = 'Login';
        
        const signupBtn = document.createElement('button');
        signupBtn.id = 'signupBtn';
        signupBtn.className = 'btn btn-primary';
        signupBtn.textContent = 'Sign Up';
        
        navAuth.appendChild(loginBtn);
        navAuth.appendChild(signupBtn);
        
        // Add event listeners to the buttons
        loginBtn.addEventListener('click', () => openModal('auth'));
        signupBtn.addEventListener('click', () => openModal('auth'));
        
        // Re-initialize tab switching for the auth modal
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                switchTab(tabName);
            });
        });
        
        // Re-initialize form submissions
        const loginFormElement = document.querySelector('#loginForm form');
        const signupFormElement = document.querySelector('#signupForm form');
        
        if (loginFormElement) {
            loginFormElement.addEventListener('submit', handleLogin);
        }
        
        if (signupFormElement) {
            signupFormElement.addEventListener('submit', handleSignup);
        }
        
        // Re-initialize close button functionality
        const closeBtns = document.querySelectorAll('.close');
        closeBtns.forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                console.log('Close button clicked:', e.target);
                // Determine which modal to close based on the close button's parent
                if (closeBtn.closest('#uploadModal')) {
                    console.log('Closing upload modal');
                    closeModal('upload');
                } else if (closeBtn.closest('#authModal')) {
                    console.log('Closing auth modal');
                    closeModal('auth');
                }
            });
        });
        
        // Re-initialize forgot password functionality
        const forgotPasswordLink = document.querySelector('#forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', handleForgotPassword);
        }
    }
    
    // Hide upload button for non-logged-in users
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.style.display = 'none';
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
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
        closeModal('auth');
        showNotification(`Welcome back, ${data.user.username}!`, 'success');
        
        // Update UI for logged-in user
        updateUIForLoggedInUser();
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Handle signup form submission
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const faction = document.getElementById('signupFaction').value;
    
    console.log('Signup form data:', { username, email, password, faction });
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password, faction })
        });
        
        console.log('Signup response status:', response.status);
        const data = await response.json();
        console.log('Signup response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Check if email verification is required
        if (data.requiresVerification) {
            // Close modal and show verification message
            closeModal('auth');
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
            closeModal('auth');
            showNotification(`Welcome to ${faction}!`, 'success');
            
            // Update UI for logged-in user
            updateUIForLoggedInUser();
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message, 'error');
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    if (!email) {
        showNotification('Please enter your email address first', 'error');
        return;
    }
    
    console.log('Forgot password request for email:', email);
    
    try {
        const forgotPasswordLink = e.target;
        const originalText = forgotPasswordLink.textContent;
        forgotPasswordLink.textContent = 'Sending...';
        forgotPasswordLink.style.pointerEvents = 'none';

        const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        console.log('Forgot password response status:', response.status);
        const data = await response.json();
        console.log('Forgot password response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset email');
        }
        showNotification(`Password reset link sent to ${email}. Please check your email and click the verification link to reset your password.`, 'success');
        document.getElementById('loginEmail').value = '';
        closeModal('auth');
    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification(error.message, 'error');
    } finally {
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.textContent = 'Forgot Password?';
            forgotPasswordLink.style.pointerEvents = 'auto';
        }
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal('auth');
    }
    if (e.target === uploadModal) {
        closeModal('upload');
    }
    if (e.target === artworkModal) {
        closeArtworkModal();
    }
});

// Artwork modal functionality
let currentArtworkItem = null;

// Open artwork modal with full details
function openArtworkModal(artworkId) {
    const artwork = allGalleryItems.find(item => item.id === artworkId);
    if (!artwork) return;
    
    currentArtworkItem = artwork;
    
    // Create modal content
    const modalContent = `
        <div class="artwork-modal-content">
            <span class="close" onclick="closeArtworkModal()">&times;</span>
            <div class="artwork-modal-body">
                <div class="artwork-image-container">
                    ${artwork.image_url ? 
                        `<img src="${artwork.image_url}" alt="${artwork.character_name || artwork.username}" class="artwork-full-image">` : 
                        `<div class="artwork-placeholder"><i class="fas fa-user-circle"></i></div>`
                    }
                </div>
                <div class="artwork-details">
                    <h2 class="artwork-title">${artwork.character_name || artwork.username}</h2>
                    <div class="artwork-meta">
                        <span class="faction-tag ${artwork.faction}">${artwork.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        <span class="creator-info">by ${artwork.username}</span>
                        <span class="creation-date">${formatDate(artwork.created_at)}</span>
                    </div>
                    ${artwork.description ? `<p class="artwork-description">${artwork.description}</p>` : ''}
                    <div class="artwork-actions">
                        <button class="btn btn-outline" onclick="downloadArtwork('${artwork.image_url}', '${artwork.character_name || artwork.username}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-outline" onclick="shareArtwork(${artwork.id})">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (artworkModal) {
        artworkModal.innerHTML = modalContent;
        artworkModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Close artwork modal
function closeArtworkModal() {
    if (artworkModal) {
        artworkModal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scrolling
        currentArtworkItem = null;
    }
}

// Download artwork
function downloadArtwork(imageUrl, filename) {
    if (!imageUrl) {
        showNotification('No image available for download', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${filename || 'necromancer'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Download started!', 'success');
}

// Share artwork
function shareArtwork(artworkId) {
    const artwork = allGalleryItems.find(item => item.id === artworkId);
    if (!artwork) return;
    
    const shareText = `Check out this amazing necromancer artwork: ${artwork.character_name || artwork.username} by ${artwork.username} on GraveGrounds!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'GraveGrounds Artwork',
            text: shareText,
            url: shareUrl
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy link', 'error');
        });
    }
}
