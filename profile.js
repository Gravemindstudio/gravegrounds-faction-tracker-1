// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    checkProfileAuth();
    
    // Initialize profile functionality
    initializeProfile();
});

// Check if user is authenticated for profile access
function checkProfileAuth() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
        // Redirect to home page if not logged in
        window.location.href = 'index.html';
        return;
    }
    
    // Verify token is still valid by making a request to the server
    verifyTokenValidity(token).then(isValid => {
        if (isValid) {
            // Load user data
            loadUserProfile();
        } else {
            // Token is invalid, clear storage and redirect
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        }
    }).catch(() => {
        // Error occurred, clear storage and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
}

// Verify token validity with the server
async function verifyTokenValidity(token) {
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error verifying token:', error);
        return false;
    }
}

// Load user profile data
function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log('Loading user profile with data:', userData);
    console.log('Faction join date from localStorage:', userData.factionJoinDate);
    
    // Load saved theme first
    loadSavedTheme();
    
    // Update hero section
    updateProfileHero(userData);
    
    // Update profile details
    updateProfileDetails(userData);
    
    // Update faction information
    updateFactionInfo(userData);
    
    // Load faction stats
    loadFactionStats(userData.faction);
    
    // Load achievements
    loadAchievements(userData);
    
    // Load activity feed
    loadActivityFeed(userData);
    
    // Load settings
    loadUserSettings(userData);
    
    // Load user artwork
    loadUserArtwork(userData);
}

// Update profile hero section
function updateProfileHero(userData) {
    const username = document.getElementById('profileHeroUsername');
    const faction = document.getElementById('profileHeroFaction');
    const email = document.getElementById('profileHeroEmail');
    const rank = document.getElementById('profileHeroRank');
    const memberSince = document.getElementById('profileHeroMemberSince');
    const contribution = document.getElementById('profileHeroContribution');
    const avatarLarge = document.querySelector('.profile-avatar-large');
    
    if (username) username.textContent = userData.username || 'Username';
    if (faction) faction.textContent = userData.faction ? userData.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Faction';
    if (email) email.textContent = userData.email || 'Email';
    if (rank) rank.textContent = 'New Member';
    if (memberSince) {
        console.log('Faction join date data:', userData.factionJoinDate);
        if (userData.factionJoinDate) {
            const joinDate = new Date(userData.factionJoinDate);
            console.log('Parsed join date:', joinDate);
            memberSince.textContent = joinDate.toLocaleDateString();
        } else if (userData.created_at) {
            // Fallback to account creation date if faction join date not available
            console.log('Using account creation date as fallback');
            const createdDate = new Date(userData.created_at);
            memberSince.textContent = createdDate.toLocaleDateString();
        } else {
            console.log('No date information found, showing Unknown');
            memberSince.textContent = 'Unknown';
        }
    }
    if (contribution) contribution.textContent = '0';
    
    // Update avatar if exists
    console.log('Avatar update - userData.avatarUrl:', userData.avatarUrl);
    if (avatarLarge && userData.avatarUrl) {
        console.log('Setting avatar image with URL:', userData.avatarUrl);
        avatarLarge.innerHTML = `<img src="${userData.avatarUrl}" alt="Profile Avatar" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;">`;
    } else if (avatarLarge) {
        console.log('No avatar URL, showing default skull icon');
        avatarLarge.innerHTML = '<i class="fas fa-skull"></i>';
    }
}

// Update profile details section
function updateProfileDetails(userData) {
    const username = document.getElementById('profileDetailUsername');
    const email = document.getElementById('profileDetailEmail');
    const faction = document.getElementById('profileDetailFaction');
    const joinDate = document.getElementById('profileDetailJoinDate');
    const lastActive = document.getElementById('profileDetailLastActive');
    
    if (username) username.textContent = userData.username || 'Username';
    if (email) email.textContent = userData.email || 'Email';
    if (faction) faction.textContent = userData.faction ? userData.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Faction';
    if (joinDate) {
        if (userData.factionJoinDate) {
            const joinDateObj = new Date(userData.factionJoinDate);
            joinDate.textContent = joinDateObj.toLocaleDateString();
        } else if (userData.created_at) {
            // Fallback to account creation date if faction join date not available
            const createdDate = new Date(userData.created_at);
            joinDate.textContent = createdDate.toLocaleDateString();
        } else {
            joinDate.textContent = 'Unknown';
        }
    }
    if (lastActive) lastActive.textContent = 'Just now';
}

// Update faction information
function updateFactionInfo(userData) {
    const factionName = document.getElementById('factionName');
    const factionIcon = document.getElementById('factionIcon');
    const factionRank = document.getElementById('factionRank');
    const factionMembers = document.getElementById('factionMembers');
    const factionGrowth = document.getElementById('factionGrowth');
    
    // Update faction name
    if (factionName && userData.faction) {
        factionName.textContent = userData.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    if (factionIcon && userData.faction) {
        const iconPath = `Faction Icons/${userData.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}.png`;
        factionIcon.src = iconPath;
        factionIcon.onerror = () => {
            factionIcon.style.display = 'none';
        };
    }
    
    if (factionRank) factionRank.textContent = 'New Member';
    if (factionMembers) factionMembers.textContent = '--';
    if (factionGrowth) factionGrowth.textContent = '--';
}

// Load faction statistics
async function loadFactionStats(factionName) {
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const response = await fetch(`${API_BASE_URL}/api/factions`);
        
        if (response.ok) {
            const stats = await response.json();
            const factionStat = stats.find(s => s.faction === factionName);
            
            if (factionStat) {
                const factionMembers = document.getElementById('factionMembers');
                const factionGrowth = document.getElementById('factionGrowth');
                
                if (factionMembers) factionMembers.textContent = factionStat.member_count.toLocaleString();
                if (factionGrowth) factionGrowth.textContent = `+${factionStat.weekly_growth}`;
            }
        }
    } catch (error) {
        console.error('Error loading faction stats:', error);
    }
}

// Load user achievements
function loadAchievements(userData) {
    const achievementsGrid = document.getElementById('achievementsGrid');
    
    if (!achievementsGrid) return;
    
    // Check if user has joined a faction (first achievement)
    if (userData.faction) {
        const firstStepsAchievement = achievementsGrid.querySelector('.achievement-item:first-child');
        if (firstStepsAchievement) {
            firstStepsAchievement.classList.remove('locked');
            firstStepsAchievement.classList.add('unlocked');
        }
    }
}

// Load activity feed
function loadActivityFeed(userData) {
    const activityList = document.getElementById('activityList');
    
    if (!activityList) return;
    
    // Add some sample activities
    const activities = [
        {
            icon: 'fas fa-user-plus',
            text: 'Joined the faction',
            time: 'Just now'
        },
        {
            icon: 'fas fa-star',
            text: 'Created account',
            time: '1 hour ago'
        }
    ];
    
    // Clear existing activities
    activityList.innerHTML = '';
    
    // Add activities
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <i class="${activity.icon}"></i>
            <div class="activity-content">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Load user settings
function loadUserSettings(userData) {
    const emailNotifications = document.getElementById('emailNotifications');
    const profileVisibility = document.getElementById('profileVisibility');
    
    if (emailNotifications) {
        emailNotifications.checked = localStorage.getItem('emailNotifications') !== 'false';
    }
    
    if (profileVisibility) {
        const visibility = localStorage.getItem('profileVisibility') || 'public';
        profileVisibility.value = visibility;
    }
}

// Load user artwork
async function loadUserArtwork(userData) {
    try {
        console.log('Loading artwork for user:', userData.username, 'ID:', userData.id);
        
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.log('No auth token found, skipping artwork load');
            return;
        }
        
        // Fetch user's artwork from the gallery API
        const response = await fetch(`${API_BASE_URL}/api/gallery`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch artwork: ${response.status}`);
        }
        
        const allArtwork = await response.json();
        console.log('Fetched artwork from API:', allArtwork.length, 'items');
        
        // Filter artwork to only show user's own artwork
        const userArtwork = allArtwork.filter(artwork => artwork.user_id === userData.id);
        console.log('Filtered to user artwork:', userArtwork.length, 'items');
        
        // Update artwork statistics
        updateArtworkStats(userArtwork);
        
        // Display artwork grid
        displayArtworkGrid(userArtwork);
        
    } catch (error) {
        console.error('Error loading user artwork:', error);
        showNotification('Failed to load artwork: ' + error.message, 'error');
        displayEmptyArtwork();
    }
}

// Update artwork statistics
function updateArtworkStats(userArtwork) {
    const totalUploads = document.getElementById('totalUploads');
    const monthlyUploads = document.getElementById('monthlyUploads');
    
    if (totalUploads) {
        totalUploads.textContent = userArtwork.length;
    }
    
    if (monthlyUploads) {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        const monthlyCount = userArtwork.filter(artwork => {
            const artworkDate = new Date(artwork.created_at);
            return artworkDate.getMonth() === thisMonth && artworkDate.getFullYear() === thisYear;
        }).length;
        
        monthlyUploads.textContent = monthlyCount;
    }
}

// Display artwork grid
function displayArtworkGrid(userArtwork) {
    console.log('Displaying artwork grid with', userArtwork.length, 'items');
    
    const artworkGrid = document.getElementById('myArtworkGrid');
    if (!artworkGrid) {
        console.error('Artwork grid element not found!');
        return;
    }
    
    if (userArtwork.length === 0) {
        console.log('No artwork to display, showing empty state');
        displayEmptyArtwork();
        return;
    }
    
    // Clear existing content
    artworkGrid.innerHTML = '';
    
    // Create artwork items
    userArtwork.forEach((artwork, index) => {
        console.log(`Creating artwork item ${index + 1}:`, artwork);
        const artworkItem = createArtworkItem(artwork);
        artworkGrid.appendChild(artworkItem);
    });
    
    console.log('Artwork grid populated successfully');
}

// Create individual artwork item
function createArtworkItem(artwork) {
    const artworkItem = document.createElement('div');
    artworkItem.className = 'artwork-item';
    artworkItem.dataset.artworkId = artwork.id;
    
    artworkItem.innerHTML = `
        <div class="artwork-item-image">
            ${artwork.image_url ? 
                `<img src="${artwork.image_url}" alt="${artwork.character_name || artwork.username}" loading="lazy">` : 
                `<div class="artwork-placeholder"><i class="fas fa-user-circle"></i></div>`
            }
            <div class="artwork-item-overlay">
                <button class="btn btn-outline btn-sm view-artwork-btn" onclick="viewArtwork(${artwork.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-danger btn-sm delete-artwork-btn" onclick="deleteArtwork(${artwork.id}, '${artwork.character_name || artwork.username}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        <div class="artwork-item-info">
            <h4 class="artwork-item-title">${artwork.character_name || artwork.username}</h4>
            <div class="artwork-item-meta">
                <span class="artwork-item-faction">${artwork.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span class="artwork-item-date">${formatDate(artwork.created_at)}</span>
            </div>
            ${artwork.description ? `<p class="artwork-item-description">${artwork.description}</p>` : ''}
        </div>
    `;
    
    return artworkItem;
}

// Display empty artwork state
function displayEmptyArtwork() {
    const artworkGrid = document.getElementById('myArtworkGrid');
    if (!artworkGrid) return;
    
    artworkGrid.innerHTML = `
        <div class="empty-artwork">
            <i class="fas fa-images"></i>
            <h4>No Artwork Yet</h4>
            <p>Start building your necromancer gallery by uploading your first character!</p>
            <a href="gallery.html" class="btn btn-primary">Upload Artwork</a>
        </div>
    `;
}

// View artwork in modal (reuse gallery modal functionality)
function viewArtwork(artworkId) {
    // This will open the artwork modal from the gallery
    // We need to make sure the gallery modal is available
    if (typeof openArtworkModal === 'function') {
        openArtworkModal(artworkId);
    } else {
        // Fallback: redirect to gallery
        window.location.href = 'gallery.html';
    }
}

// Delete artwork with confirmation
function deleteArtwork(artworkId, artworkTitle) {
    // Show delete confirmation modal
    const deleteModal = document.getElementById('deleteConfirmationModal');
    const deleteTitle = document.getElementById('deleteArtworkTitle');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    if (deleteModal && deleteTitle) {
        deleteTitle.textContent = artworkTitle;
        deleteModal.classList.add('show');
        
        // Add event listeners for modal buttons
        cancelBtn.onclick = () => {
            deleteModal.classList.remove('show');
        };
        
        confirmBtn.onclick = async () => {
            await performArtworkDeletion(artworkId);
            deleteModal.classList.remove('show');
        };
        
        // Close modal when clicking outside
        deleteModal.onclick = (e) => {
            if (e.target === deleteModal) {
                deleteModal.classList.remove('show');
            }
        };
        
        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                deleteModal.classList.remove('show');
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

// Perform the actual artwork deletion
async function performArtworkDeletion(artworkId) {
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/gallery/${artworkId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete artwork');
        }
        
        // Remove artwork item from DOM
        const artworkItem = document.querySelector(`[data-artwork-id="${artworkId}"]`);
        if (artworkItem) {
            artworkItem.remove();
        }
        
        // Reload artwork to update statistics
        const userData = JSON.parse(localStorage.getItem('userData'));
        await loadUserArtwork(userData);
        
        showNotification('Artwork deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting artwork:', error);
        showNotification(error.message, 'error');
    }
}

// Initialize profile functionality
function initializeProfile() {
    console.log('Initializing profile...');
    
    // Add event listeners for profile actions
    addProfileActionListeners();
    
    // Add settings change listeners
    addSettingsListeners();
    
    // Add theme indicator click handler
    addThemeIndicatorHandler();
    
    console.log('Profile initialization complete');
}

// Add profile action button listeners
function addProfileActionListeners() {
    console.log('Adding profile action listeners...');
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    const changeFactionBtn = document.getElementById('changeFactionBtn');
    const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
    const privacySettingsBtn = document.getElementById('privacySettingsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    console.log('Found buttons:', {
        editProfileBtn: !!editProfileBtn,
        changeFactionBtn: !!changeFactionBtn,
        uploadAvatarBtn: !!uploadAvatarBtn,
        privacySettingsBtn: !!privacySettingsBtn,
        logoutBtn: !!logoutBtn,
        deleteAccountBtn: !!deleteAccountBtn
    });
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            console.log('Edit Profile button clicked');
            showEditProfileModal();
        });
    }
    
    if (changeFactionBtn) {
        changeFactionBtn.addEventListener('click', () => {
            console.log('Change Faction button clicked');
            showChangeFactionModal();
        });
    }
    
    if (uploadAvatarBtn) {
        uploadAvatarBtn.addEventListener('click', () => {
            console.log('Upload Avatar button clicked');
            showUploadAvatarModal();
        });
    }
    
    if (privacySettingsBtn) {
        privacySettingsBtn.addEventListener('click', () => {
            console.log('Privacy Settings button clicked');
            showPrivacySettingsModal();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            handleLogout();
        });
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            handleDeleteAccount();
        });
    }
    
    // Add theme customization button listener
    const customizeThemeBtn = document.getElementById('customizeThemeBtn');
    if (customizeThemeBtn) {
        customizeThemeBtn.addEventListener('click', () => {
            showThemeCustomizationModal();
        });
    }
    
    console.log('Profile action listeners added successfully');
}

// Add artwork action listeners
function addArtworkActionListeners() {
    console.log('Adding artwork action listeners...');
    // The artwork items are created dynamically with onclick handlers
    // so we don't need to add event listeners here
    console.log('Artwork action listeners added successfully');
}

// Add settings change listeners
function addSettingsListeners() {
    const emailNotifications = document.getElementById('emailNotifications');
    const profileVisibility = document.getElementById('profileVisibility');
    const enable2FABtn = document.getElementById('enable2FABtn');
    
    if (emailNotifications) {
        emailNotifications.addEventListener('change', (e) => {
            localStorage.setItem('emailNotifications', e.target.checked);
            showNotification('Email notifications updated', 'success');
        });
    }
    
    if (profileVisibility) {
        profileVisibility.addEventListener('change', (e) => {
            localStorage.setItem('profileVisibility', e.target.value);
            showNotification('Profile visibility updated', 'success');
        });
    }
    
    if (enable2FABtn) {
        enable2FABtn.addEventListener('click', () => {
            showNotification('Two-factor authentication coming soon!', 'info');
        });
    }
}

// Add theme indicator click handler
function addThemeIndicatorHandler() {
    const themeIndicator = document.querySelector('.theme-indicator');
    if (themeIndicator) {
        themeIndicator.addEventListener('click', () => {
            showThemeCustomizationModal();
        });
        themeIndicator.style.cursor = 'pointer';
    }
}

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

// Modal functions
function showEditProfileModal() {
    console.log('showEditProfileModal called');
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log('User data:', userData);
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999'; // Ensure high z-index
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Profile</h2>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editUsername">Username</label>
                    <input type="text" id="editUsername" value="${userData.username}" required>
                </div>
                <div class="form-group">
                    <label for="editEmail">Email</label>
                    <input type="email" id="editEmail" value="${userData.email}" required>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Update Profile</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Handle form submission
    const form = modal.querySelector('#editProfileForm');
    form.addEventListener('submit', handleEditProfile);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    console.log('Edit Profile Modal created and displayed');
}

function showChangeFactionModal() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999'; // Ensure high z-index
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Change Faction</h2>
            <p>Current faction: <strong>${userData.faction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></p>
            <form id="changeFactionForm">
                <div class="form-group">
                    <label for="newFaction">New Faction</label>
                    <select id="newFaction" required>
                        <option value="">Select a new faction...</option>
                        <option value="bone-march">Bone March</option>
                        <option value="choir-silence">Choir of Silence</option>
                        <option value="cult-withered-flame">Cult of the Withered Flame</option>
                        <option value="gravewrought-court">Gravewrought Court</option>
                        <option value="swarm-mireborn">Swarm of the Mireborn</option>
                        <option value="dawnflame-order">DawnFlame Order</option>
                        <option value="hollowed-redeemed">Hollowed Redeemed</option>
                    </select>
                </div>
                <div class="warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Warning: Changing factions will reset your rank and contributions!</p>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Change Faction</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Handle form submission
    const form = modal.querySelector('#changeFactionForm');
    form.addEventListener('submit', handleChangeFaction);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    console.log('Change Faction Modal created and displayed');
}

function showUploadAvatarModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999'; // Ensure high z-index
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Upload Avatar</h2>
            <form id="uploadAvatarForm">
                <div class="form-group">
                    <label for="avatarFile">Choose Image File</label>
                    <input type="file" id="avatarFile" accept="image/*" required style="
                        padding: 0.5rem;
                        border: 2px dashed var(--border-color);
                        border-radius: var(--radius-md);
                        background: var(--bg-primary);
                        cursor: pointer;
                        width: 100%;
                    ">
                    <small class="form-help" style="
                        color: var(--text-secondary);
                        font-size: 0.875rem;
                        margin-top: 0.5rem;
                        display: block;
                    ">Supported formats: JPG, PNG, GIF (Max 5MB)</small>
                </div>
                <div class="avatar-preview" style="
                    display: flex;
                    justify-content: center;
                    margin: 1rem 0;
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-color);
                ">
                    <img id="avatarPreview" src="" alt="Avatar Preview" style="display: none; width: 200px; height: 200px; border-radius: 8px; object-fit: cover; border: 2px solid var(--border-color); box-shadow: var(--shadow-md);">
                </div>
                <button type="submit" class="btn btn-primary btn-full">Upload Avatar</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Handle form submission
    const form = modal.querySelector('#uploadAvatarForm');
    form.addEventListener('submit', handleUploadAvatar);
    
    // Preview selected file
    const avatarFileInput = modal.querySelector('#avatarFile');
    const avatarPreview = modal.querySelector('#avatarPreview');
    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('File size must be less than 5MB', 'error');
                e.target.value = '';
                avatarPreview.style.display = 'none';
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please select a valid image file', 'error');
                e.target.value = '';
                avatarPreview.style.display = 'none';
                return;
            }
            
            // Create preview
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            avatarPreview.style.display = 'none';
        }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    console.log('Upload Avatar Modal created and displayed');
}

function showPrivacySettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999'; // Ensure high z-index
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Privacy Settings</h2>
            <form id="privacySettingsForm">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="privacyEmailNotifications" checked>
                        Email Notifications
                    </label>
                </div>
                <div class="form-group">
                    <label for="privacyProfileVisibility">Profile Visibility</label>
                    <select id="privacyProfileVisibility">
                        <option value="public">Public</option>
                        <option value="faction-only">Faction Only</option>
                        <option value="private">Private</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="privacyTwoFactor">
                        Enable Two-Factor Authentication
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Save Settings</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Handle form submission
    const form = modal.querySelector('#privacySettingsForm');
    form.addEventListener('submit', handlePrivacySettings);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    console.log('Privacy Settings Modal created and displayed');
}

// Form handlers
async function handleEditProfile(e) {
    e.preventDefault();
    
    const username = document.getElementById('editUsername').value;
    const email = document.getElementById('editEmail').value;
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update profile');
        }
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('userData'));
        userData.username = username;
        userData.email = email;
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Update UI
        loadUserProfile();
        
        // Close modal and show success
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleChangeFaction(e) {
    e.preventDefault();
    
    const newFaction = document.getElementById('newFaction').value;
    
    if (!newFaction) {
        showNotification('Please select a new faction', 'error');
        return;
    }
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/profile/faction`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newFaction })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to change faction');
        }
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('userData'));
        userData.faction = newFaction;
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Update UI
        loadUserProfile();
        
        // Close modal and show success
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        showNotification(`Successfully joined ${newFaction.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}!`, 'success');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleUploadAvatar(e) {
    e.preventDefault();
    
    console.log('handleUploadAvatar called');
    
    const avatarFile = document.getElementById('avatarFile').files[0];
    console.log('Selected file:', avatarFile);
    
    if (!avatarFile) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (5MB limit)
    if (avatarFile.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }
    
    // Validate file type
    if (!avatarFile.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error');
        return;
    }
    
    console.log('File validation passed, preparing to upload...');
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        console.log('API URL:', API_BASE_URL);
        console.log('Token exists:', !!token);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        console.log('FormData created with file:', avatarFile.name);
        
        const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type for FormData, let the browser set it with boundary
            },
            body: formData
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to upload avatar');
        }
        
        // Update local storage with the returned avatar URL
        const userData = JSON.parse(localStorage.getItem('userData'));
        userData.avatarUrl = data.avatarUrl || data.url; // Handle different response formats
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Update UI
        loadUserProfile();
        
        // Close modal and show success
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        showNotification('Avatar uploaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error in handleUploadAvatar:', error);
        showNotification(error.message, 'error');
    }
}

async function handlePrivacySettings(e) {
    e.preventDefault();
    
    const emailNotifications = document.getElementById('privacyEmailNotifications').checked;
    const profileVisibility = document.getElementById('privacyProfileVisibility').value;
    const twoFactorEnabled = document.getElementById('privacyTwoFactor').checked;
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/profile/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ emailNotifications, profileVisibility, twoFactorEnabled })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update settings');
        }
        
        // Update local storage
        localStorage.setItem('emailNotifications', emailNotifications);
        localStorage.setItem('profileVisibility', profileVisibility);
        localStorage.setItem('twoFactorEnabled', twoFactorEnabled);
        
        // Update UI
        loadUserSettings();
        
        // Close modal and show success
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
        
        showNotification('Privacy settings updated successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Logout handler
function handleLogout() {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Show logout notification
    showNotification('Logged out successfully', 'success');
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Delete account handler
async function handleDeleteAccount() {
    // Get email from stored user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const email = userData.email;
    
    if (!email) {
        showNotification('Unable to find email address. Please log in again.', 'error');
        return;
    }
    
    // Double confirmation
    const confirmDelete = confirm(`Are you sure you want to delete your account? This action cannot be undone.`);
    if (!confirmDelete) {
        return; // User cancelled
    }
    
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/delete-account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Export functions for external use
window.profileFunctions = {
    loadUserProfile,
    updateProfileHero,
    updateProfileDetails,
    updateFactionInfo,
    loadFactionStats,
    loadAchievements,
    loadActivityFeed,
    loadUserSettings,
    loadUserArtwork,
    deleteArtwork,
    viewArtwork
};

// Theme Customization System
const themePresets = {
    default: {
        '--primary-color': '#374151',
        '--primary-dark': '#1f2937',
        '--secondary-color': '#6b7280',
        '--accent-color': '#d1d5db',
        '--text-primary': '#f9fafb',
        '--text-secondary': '#d1d5db',
        '--text-light': '#9ca3af',
        '--bg-primary': '#111827',
        '--bg-secondary': '#1f2937',
        '--bg-dark': '#030712',
        '--border-color': '#374151'
    },
    dark: {
        '--primary-color': '#000000',
        '--primary-dark': '#000000',
        '--secondary-color': '#1a1a1a',
        '--accent-color': '#ffffff',
        '--text-primary': '#ffffff',
        '--text-secondary': '#cccccc',
        '--text-light': '#999999',
        '--bg-primary': '#000000',
        '--bg-secondary': '#0a0a0a',
        '--bg-dark': '#000000',
        '--border-color': '#333333'
    },
    warm: {
        '--primary-color': '#8B4513',
        '--primary-dark': '#654321',
        '--secondary-color': '#A0522D',
        '--accent-color': '#FFD700',
        '--text-primary': '#F5F5DC',
        '--text-secondary': '#DEB887',
        '--text-light': '#CD853F',
        '--bg-primary': '#2F1B14',
        '--bg-secondary': '#3D2817',
        '--bg-dark': '#1A0F0A',
        '--border-color': '#8B4513'
    },
    cool: {
        '--primary-color': '#2E86AB',
        '--primary-dark': '#1B4F72',
        '--secondary-color': '#A23B72',
        '--accent-color': '#F18F01',
        '--text-primary': '#C73E1D',
        '--text-secondary': '#E8C547',
        '--text-light': '#F18F01',
        '--bg-primary': '#0B1426',
        '--bg-secondary': '#1B2A4A',
        '--bg-dark': '#050A14',
        '--border-color': '#2E86AB'
    },
    neon: {
        '--primary-color': '#00FF00',
        '--primary-dark': '#00CC00',
        '--secondary-color': '#FF00FF',
        '--accent-color': '#00FFFF',
        '--text-primary': '#FFFFFF',
        '--text-secondary': '#00FF00',
        '--text-light': '#00FFFF',
        '--bg-primary': '#000000',
        '--bg-secondary': '#0A0A0A',
        '--bg-dark': '#000000',
        '--border-color': '#00FF00'
    },
    earthy: {
        '--primary-color': '#8FBC8F',
        '--primary-dark': '#556B2F',
        '--secondary-color': '#BDB76B',
        '--accent-color': '#F4A460',
        '--text-primary': '#F5F5DC',
        '--text-secondary': '#DEB887',
        '--text-light': '#CD853F',
        '--bg-primary': '#2F4F2F',
        '--bg-secondary': '#3D4F3D',
        '--bg-dark': '#1A2F1A',
        '--border-color': '#8FBC8F'
    }
};

// Load saved theme on page load
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            applyTheme(theme);
        } catch (error) {
            console.error('Error loading saved theme:', error);
        }
    }
}

// Apply theme to the page
function applyTheme(theme) {
    console.log('Applying theme to page:', theme);
    
    // Try applying to both document root and body to ensure it works
    const root = document.documentElement;
    const body = document.body;
    
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
        body.style.setProperty(property, value);
        console.log(`Set ${property} = ${value}`);
    });
    
    // Also try applying some colors directly to the body to test
    if (theme['--bg-primary']) {
        body.style.backgroundColor = theme['--bg-primary'];
        console.log('Set body background directly to:', theme['--bg-primary']);
    }
    if (theme['--text-primary']) {
        body.style.color = theme['--text-primary'];
        console.log('Set body color directly to:', theme['--text-primary']);
    }
    
    // Force a reflow to ensure the changes are applied
    body.offsetHeight;
    
    // Verify the CSS variables were set
    setTimeout(() => {
        console.log('Verifying CSS variables were set:');
        Object.entries(theme).forEach(([property, value]) => {
            const rootValue = root.style.getPropertyValue(property);
            const bodyValue = body.style.getPropertyValue(property);
            console.log(`${property}: expected=${value}, root=${rootValue}, body=${bodyValue}`);
        });
        
        // Also check computed styles to see if they're actually being applied
        console.log('Checking computed styles:');
        const computedStyle = getComputedStyle(document.body);
        Object.entries(theme).forEach(([property, value]) => {
            const computedValue = computedStyle.getPropertyValue(property);
            console.log(`${property}: computed=${computedValue}`);
        });
        
        // Test if the theme is actually visible by checking body styles
        console.log('Body actual styles:');
        console.log('Background color:', computedStyle.backgroundColor);
        console.log('Color:', computedStyle.color);
    }, 100);
    
    // Update theme indicator
    updateThemeIndicator();
    
    // Update page title with theme name
    updatePageTitle(theme);
}

// Save theme to localStorage
function saveTheme(theme) {
    localStorage.setItem('userTheme', JSON.stringify(theme));
    
    // Add to theme history
    addThemeToHistory(theme);
}

// Add theme to history
function addThemeToHistory(theme) {
    const themeHistory = JSON.parse(localStorage.getItem('themeHistory') || '[]');
    
    // Create theme data
    const themeData = {
        name: 'Custom Theme',
        version: '1.0',
        created: new Date().toISOString(),
        theme: theme
    };
    
    // Try to determine theme name from presets
    Object.entries(themePresets).forEach(([name, preset]) => {
        if (JSON.stringify(preset) === JSON.stringify(theme)) {
            themeData.name = name.charAt(0).toUpperCase() + name.slice(1) + ' Theme';
        }
    });
    
    // Add to beginning of history
    themeHistory.unshift(themeData);
    
    // Keep only last 10 themes
    if (themeHistory.length > 10) {
        themeHistory.splice(10);
    }
    
    localStorage.setItem('themeHistory', JSON.stringify(themeHistory));
}

// Update theme indicator
function updateThemeIndicator() {
    const themeIndicator = document.getElementById('themeIndicatorIcon');
    const themeLabel = document.querySelector('.theme-indicator .stat-label');
    const colorPreview = document.getElementById('themeColorPreview');
    
    if (themeIndicator && themeLabel) {
        const savedTheme = localStorage.getItem('userTheme');
        if (savedTheme) {
            try {
                const theme = JSON.parse(savedTheme);
                themeIndicator.style.color = 'var(--accent-color)';
                themeIndicator.title = 'Custom theme active - Click to customize';
                
                // Try to determine theme name from presets
                let themeName = 'Custom';
                Object.entries(themePresets).forEach(([name, preset]) => {
                    if (JSON.stringify(preset) === savedTheme) {
                        themeName = name.charAt(0).toUpperCase() + name.slice(1);
                    }
                });
                
                themeLabel.textContent = `${themeName} Theme`;
                
                // Update color preview
                updateThemeColorPreview(theme);
            } catch (error) {
                themeIndicator.style.color = 'var(--accent-color)';
                themeIndicator.title = 'Custom theme active - Click to customize';
                themeLabel.textContent = 'Custom Theme';
                
                // Update color preview with current theme
                const currentTheme = getCurrentTheme();
                updateThemeColorPreview(currentTheme);
            }
        } else {
            themeIndicator.style.color = 'var(--text-secondary)';
            themeIndicator.title = 'Default theme active - Click to customize';
            themeLabel.textContent = 'Default Theme';
            
            // Update color preview with default theme
            updateThemeColorPreview(themePresets.default);
        }
    }
}

// Update theme color preview
function updateThemeColorPreview(theme) {
    const colorPreview = document.getElementById('themeColorPreview');
    if (!colorPreview) return;
    
    // Clear existing preview
    colorPreview.innerHTML = '';
    
    // Add color dots for main theme colors
    const mainColors = [
        theme['--primary-color'],
        theme['--accent-color'],
        theme['--text-primary'],
        theme['--border-color']
    ];
    
    mainColors.forEach(color => {
        if (color) {
            const colorDot = document.createElement('div');
            colorDot.className = 'color-dot';
            colorDot.style.backgroundColor = color;
            colorDot.title = color;
            colorPreview.appendChild(colorDot);
        }
    });
}

// Update page title with theme name
function updatePageTitle(theme) {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        try {
            const savedThemeData = JSON.parse(savedTheme);
            let themeName = 'Custom';
            
            // Try to determine theme name from presets
            Object.entries(themePresets).forEach(([name, preset]) => {
                if (JSON.stringify(preset) === savedTheme) {
                    themeName = name.charAt(0).toUpperCase() + name.slice(1);
                }
            });
            
            document.title = `Profile - ${themeName} Theme - GraveGrounds Faction Tracker`;
        } catch (error) {
            document.title = `Profile - Custom Theme - GraveGrounds Faction Tracker`;
        }
    } else {
        document.title = `Profile - GraveGrounds Faction Tracker`;
    }
}

// Show theme customization modal
function showThemeCustomizationModal() {
    const modal = document.getElementById('themeCustomizationModal');
    if (!modal) return;
    
    // Load current theme values
    loadCurrentThemeValues();
    
    // Update modal title with current theme name
    updateModalTitle();
    
    // Generate color palette
    generateColorPalette();
    
    // Show modal
    modal.classList.add('show');
    
    // Add event listeners
    addThemeModalListeners();
}

// Update modal title with current theme name
function updateModalTitle() {
    const modalTitle = document.querySelector('#themeCustomizationModal h2');
    if (!modalTitle) return;
    
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) {
        try {
            const theme = JSON.parse(savedTheme);
            let themeName = 'Custom';
            
            // Try to determine theme name from presets
            Object.entries(themePresets).forEach(([name, preset]) => {
                if (JSON.stringify(preset) === savedTheme) {
                    themeName = name.charAt(0).toUpperCase() + name.slice(1);
                }
            });
            
            modalTitle.innerHTML = `<i class="fas fa-palette"></i> Customize Your Profile Theme - ${themeName}`;
        } catch (error) {
            modalTitle.innerHTML = `<i class="fas fa-palette"></i> Customize Your Profile Theme - Custom`;
        }
    } else {
        modalTitle.innerHTML = `<i class="fas fa-palette"></i> Customize Your Profile Theme - Default`;
    }
}

// Generate color palette
function generateColorPalette() {
    const paletteGrid = document.getElementById('paletteGrid');
    if (!paletteGrid) return;
    
    // Get the current values from the form inputs
    const primaryColor = document.getElementById('primaryColor')?.value || '#374151';
    const accentColor = document.getElementById('accentColor')?.value || '#d1d5db';
    const backgroundColor = document.getElementById('backgroundColor')?.value || '#111827';
    const textColor = document.getElementById('textColor')?.value || '#f9fafb';
    const borderColor = document.getElementById('borderColor')?.value || '#374151';
    
    // Create theme object from form values
    const currentTheme = {
        '--primary-color': primaryColor,
        '--primary-dark': primaryColor,
        '--secondary-color': primaryColor,
        '--accent-color': accentColor,
        '--text-primary': textColor,
        '--text-secondary': textColor,
        '--text-light': textColor,
        '--bg-primary': backgroundColor,
        '--bg-secondary': backgroundColor,
        '--bg-dark': backgroundColor,
        '--border-color': borderColor
    };
    
    // Clear existing palette
    paletteGrid.innerHTML = '';
    
    // Create color swatches for all theme colors
    Object.entries(currentTheme).forEach(([property, color]) => {
        if (color) {
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'palette-color';
            colorSwatch.style.backgroundColor = color;
            colorSwatch.title = `${property}: ${color}`;
            
            // Add color name
            const colorName = document.createElement('div');
            colorName.className = 'color-name';
            colorName.textContent = property.replace('--', '').replace(/-/g, ' ');
            colorSwatch.appendChild(colorName);
            
            // Add click handler to copy color
            colorSwatch.addEventListener('click', () => {
                navigator.clipboard.writeText(color).then(() => {
                    showNotification(`Color ${color} copied to clipboard!`, 'success');
                }).catch(() => {
                    showNotification(`Color ${color} copied to clipboard!`, 'success');
                });
            });
            
            paletteGrid.appendChild(colorSwatch);
        }
    });
}

// Load current theme values into the form
function loadCurrentThemeValues() {
    const currentTheme = getCurrentTheme();
    
    // Set color picker values
    const primaryColorInput = document.getElementById('primaryColor');
    const accentColorInput = document.getElementById('accentColor');
    const backgroundColorInput = document.getElementById('backgroundColor');
    const textColorInput = document.getElementById('textColor');
    const borderColorInput = document.getElementById('borderColor');
    
    if (primaryColorInput) primaryColorInput.value = currentTheme['--primary-color'];
    if (accentColorInput) accentColorInput.value = currentTheme['--accent-color'];
    if (backgroundColorInput) backgroundColorInput.value = currentTheme['--bg-primary'];
    if (textColorInput) textColorInput.value = currentTheme['--text-primary'];
    if (borderColorInput) borderColorInput.value = currentTheme['--border-color'];
    
    // Set text input values
    const primaryColorTextInput = document.getElementById('primaryColorText');
    const accentColorTextInput = document.getElementById('accentColorText');
    const backgroundColorTextInput = document.getElementById('backgroundColorText');
    const textColorTextInput = document.getElementById('textColorText');
    const borderColorTextInput = document.getElementById('borderColorText');
    
    if (primaryColorTextInput) primaryColorTextInput.value = currentTheme['--primary-color'];
    if (accentColorTextInput) accentColorTextInput.value = currentTheme['--accent-color'];
    if (backgroundColorTextInput) backgroundColorTextInput.value = currentTheme['--bg-primary'];
    if (textColorTextInput) textColorTextInput.value = currentTheme['--text-primary'];
    if (borderColorTextInput) borderColorTextInput.value = currentTheme['--border-color'];
}

// Get current theme from CSS variables
function getCurrentTheme() {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    return {
        '--primary-color': computedStyle.getPropertyValue('--primary-color').trim() || '#374151',
        '--primary-dark': computedStyle.getPropertyValue('--primary-dark').trim() || '#1f2937',
        '--secondary-color': computedStyle.getPropertyValue('--secondary-color').trim() || '#6b7280',
        '--accent-color': computedStyle.getPropertyValue('--accent-color').trim() || '#d1d5db',
        '--text-primary': computedStyle.getPropertyValue('--text-primary').trim() || '#f9fafb',
        '--text-secondary': computedStyle.getPropertyValue('--text-secondary').trim() || '#d1d5db',
        '--text-light': computedStyle.getPropertyValue('--text-light').trim() || '#9ca3af',
        '--bg-primary': computedStyle.getPropertyValue('--bg-primary').trim() || '#111827',
        '--bg-secondary': computedStyle.getPropertyValue('--bg-secondary').trim() || '#1f2937',
        '--bg-dark': computedStyle.getPropertyValue('--bg-dark').trim() || '#030712',
        '--border-color': computedStyle.getPropertyValue('--border-color').trim() || '#374151'
    };
}

// Add event listeners to theme modal
function addThemeModalListeners() {
    const modal = document.getElementById('themeCustomizationModal');
    
    // Close button
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Preset buttons
    const presetBtns = modal.querySelectorAll('.preset-btn');
    console.log('Setting up preset button listeners. Found:', presetBtns.length, 'preset buttons');
    
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            console.log('Preset button clicked:', preset);
            
            applyPreset(preset);
            
            // Update active state
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            console.log('Set active state for preset:', preset);
        });
    });
    
    // Color picker and text input synchronization
    const colorInputs = modal.querySelectorAll('input[type="color"]');
    const textInputs = modal.querySelectorAll('input[type="text"]');
    
    console.log('Setting up color input listeners. Found:', {
        colorInputs: colorInputs.length,
        textInputs: textInputs.length
    });
    
    colorInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            console.log(`Color input ${index} changed to:`, e.target.value);
            const textInput = textInputs[index];
            if (textInput) textInput.value = e.target.value;
            updateLivePreview();
            generateColorPalette();
        });
    });
    
    textInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            console.log(`Text input ${index} changed to:`, e.target.value);
            const colorInput = colorInputs[index];
            const value = e.target.value;
            
            // Validate hex color
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                if (colorInput) colorInput.value = value;
                updateLivePreview();
                generateColorPalette();
            }
        });
    });
    
    // Reset button
    const resetBtn = document.getElementById('resetThemeBtn');
    resetBtn.addEventListener('click', () => {
        resetToDefaultTheme();
    });
    
    // Save button
    const saveBtn = document.getElementById('saveThemeBtn');
    saveBtn.addEventListener('click', () => {
        saveCurrentTheme();
    });
    
    // Export button
    const exportBtn = document.getElementById('exportThemeBtn');
    exportBtn.addEventListener('click', () => {
        exportCurrentTheme();
    });
    
    // Import button
    const importBtn = document.getElementById('importThemeBtn');
    importBtn.addEventListener('click', () => {
        document.getElementById('themeImportInput').click();
    });
    
    // Import file input
    const importInput = document.getElementById('themeImportInput');
    importInput.addEventListener('change', (e) => {
        importThemeFromFile(e.target.files[0]);
    });
    
    // Theme history button
    const historyBtn = document.getElementById('themeHistoryBtn');
    historyBtn.addEventListener('click', () => {
        showThemeHistory();
    });
    
    // Compare themes button
    const compareBtn = document.getElementById('compareThemesBtn');
    compareBtn.addEventListener('click', () => {
        showThemeComparison();
    });
}

// Apply preset theme
function applyPreset(presetName) {
    const preset = themePresets[presetName];
    if (preset) {
        console.log('Applying preset theme:', presetName, preset);
        
        // Apply the preset theme
        applyTheme(preset);
        
        // Update form values
        document.getElementById('primaryColor').value = preset['--primary-color'];
        document.getElementById('accentColor').value = preset['--accent-color'];
        document.getElementById('backgroundColor').value = preset['--bg-primary'];
        document.getElementById('textColor').value = preset['--text-primary'];
        document.getElementById('borderColor').value = preset['--border-color'];
        
        document.getElementById('primaryColorText').value = preset['--primary-color'];
        document.getElementById('accentColorText').value = preset['--accent-color'];
        document.getElementById('backgroundColorText').value = preset['--bg-primary'];
        document.getElementById('textColorText').value = preset['--text-primary'];
        document.getElementById('borderColorText').value = preset['--border-color'];
        
        // Update the color palette to show the new colors
        generateColorPalette();
    }
}

// Update live preview
function updateLivePreview() {
    // Get the current values from the form inputs
    const primaryColor = document.getElementById('primaryColor').value;
    const accentColor = document.getElementById('accentColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const textColor = document.getElementById('textColor').value;
    const borderColor = document.getElementById('borderColor').value;
    
    console.log('Updating live preview with colors:', {
        primaryColor,
        accentColor,
        backgroundColor,
        textColor,
        borderColor
    });
    
    // Create a temporary theme object with the current form values
    const tempTheme = {
        '--primary-color': primaryColor,
        '--primary-dark': primaryColor, // Use primary color for dark variant
        '--secondary-color': primaryColor, // Use primary color for secondary
        '--accent-color': accentColor,
        '--text-primary': textColor,
        '--text-secondary': textColor, // Use text color for secondary
        '--text-light': textColor, // Use text color for light variant
        '--bg-primary': backgroundColor,
        '--bg-secondary': backgroundColor, // Use background color for secondary
        '--bg-dark': backgroundColor, // Use background color for dark variant
        '--border-color': borderColor
    };
    
    console.log('Applying temporary theme:', tempTheme);
    
    // Apply the temporary theme
    applyTheme(tempTheme);
    
    // Debug: check if CSS variables were applied
    setTimeout(() => {
        debugCSSVariables();
    }, 100);
}

// Reset to default theme
function resetToDefaultTheme() {
    applyPreset('default');
    showNotification('Theme reset to default', 'success');
}

// Save current theme
function saveCurrentTheme() {
    // Get the current values from the form inputs
    const primaryColor = document.getElementById('primaryColor').value;
    const accentColor = document.getElementById('accentColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    const textColor = document.getElementById('textColor').value;
    const borderColor = document.getElementById('borderColor').value;
    
    // Create the theme object with the form values
    const currentTheme = {
        '--primary-color': primaryColor,
        '--primary-dark': primaryColor, // Use primary color for dark variant
        '--secondary-color': primaryColor, // Use primary color for secondary
        '--accent-color': accentColor,
        '--text-primary': textColor,
        '--text-secondary': textColor, // Use text color for secondary
        '--text-light': textColor, // Use text color for light variant
        '--bg-primary': backgroundColor,
        '--bg-secondary': backgroundColor, // Use background color for secondary
        '--bg-dark': backgroundColor, // Use background color for dark variant
        '--border-color': borderColor
    };
    
    saveTheme(currentTheme);
    showNotification('Theme saved successfully!', 'success');
    
    // Close modal
    const modal = document.getElementById('themeCustomizationModal');
    modal.classList.remove('show');
}

// Export current theme
function exportCurrentTheme() {
    const currentTheme = getCurrentTheme();
    const themeData = {
        name: 'Custom Theme',
        version: '1.0',
        created: new Date().toISOString(),
        theme: currentTheme
    };
    
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gravegrounds-theme.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Theme exported successfully!', 'success');
}

// Import theme from file
function importThemeFromFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const themeData = JSON.parse(e.target.result);
            if (themeData.theme) {
                applyTheme(themeData.theme);
                updateLivePreview();
                showNotification('Theme imported successfully!', 'success');
            } else {
                showNotification('Invalid theme file format', 'error');
            }
        } catch (error) {
            showNotification('Error reading theme file', 'error');
        }
    };
    reader.readAsText(file);
}

// Show theme history
function showThemeHistory() {
    const savedThemes = JSON.parse(localStorage.getItem('themeHistory') || '[]');
    
    if (savedThemes.length === 0) {
        showNotification('No theme history found', 'info');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-content theme-history-modal">
            <span class="close">&times;</span>
            <h2><i class="fas fa-history"></i> Theme History</h2>
            <div class="theme-history-list">
                ${savedThemes.map((themeData, index) => `
                    <div class="theme-history-item">
                        <div class="theme-history-info">
                            <h4>${themeData.name || 'Custom Theme'}</h4>
                            <p>Created: ${new Date(themeData.created).toLocaleDateString()}</p>
                        </div>
                        <div class="theme-history-actions">
                            <button class="btn btn-outline btn-sm" onclick="loadThemeFromHistory(${index})">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="restoreThemeFromHistory(${index})">
                                <i class="fas fa-undo"></i> Restore
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Load theme from history for preview
function loadThemeFromHistory(index) {
    const savedThemes = JSON.parse(localStorage.getItem('themeHistory') || '[]');
    const themeData = savedThemes[index];
    
    if (themeData && themeData.theme) {
        applyTheme(themeData.theme);
        updateLivePreview();
        showNotification('Theme preview loaded!', 'success');
    }
}

// Restore theme from history
function restoreThemeFromHistory(index) {
    const savedThemes = JSON.parse(localStorage.getItem('themeHistory') || '[]');
    const themeData = savedThemes[index];
    
    if (themeData && themeData.theme) {
        saveTheme(themeData.theme);
        applyTheme(themeData.theme);
        updateThemeIndicator();
        updatePageTitle(themeData.theme);
        showNotification('Theme restored successfully!', 'success');
    }
}

// Show theme comparison
function showThemeComparison() {
    const currentTheme = getCurrentTheme();
    const defaultTheme = themePresets.default;
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-content theme-comparison-modal">
            <span class="close">&times;</span>
            <h2><i class="fas fa-balance-scale"></i> Theme Comparison</h2>
            <div class="theme-comparison-grid">
                <div class="comparison-column">
                    <h3>Current Theme</h3>
                    <div class="comparison-preview">
                        <div class="comparison-card">
                            <h4>Sample Card</h4>
                            <p>This shows your current theme</p>
                            <button class="btn btn-primary">Button</button>
                        </div>
                        <div class="comparison-colors">
                            <div class="comparison-color" style="background: ${currentTheme['--primary-color']}">
                                <span>Primary</span>
                            </div>
                            <div class="comparison-color" style="background: ${currentTheme['--accent-color']}">
                                <span>Accent</span>
                            </div>
                            <div class="comparison-color" style="background: ${currentTheme['--text-primary']}">
                                <span>Text</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="comparison-column">
                    <h3>Default Theme</h3>
                    <div class="comparison-preview">
                        <div class="comparison-card default-theme">
                            <h4>Sample Card</h4>
                            <p>This shows the default theme</p>
                            <button class="btn btn-primary">Button</button>
                        </div>
                        <div class="comparison-colors">
                            <div class="comparison-color" style="background: ${defaultTheme['--primary-color']}">
                                <span>Primary</span>
                            </div>
                            <div class="comparison-color" style="background: ${defaultTheme['--accent-color']}">
                                <span>Accent</span>
                            </div>
                            <div class="comparison-color" style="background: ${defaultTheme['--text-primary']}">
                                <span>Text</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Initialize theme system
document.addEventListener('DOMContentLoaded', () => {
    loadSavedTheme();
});

// Debug function to check CSS variables
function debugCSSVariables() {
    const root = document.documentElement;
    const body = document.body;
    const computedStyle = getComputedStyle(body);
    
    console.log('=== CSS Variables Debug ===');
    console.log('Document root styles:');
    console.log('--primary-color:', root.style.getPropertyValue('--primary-color'));
    console.log('--accent-color:', root.style.getPropertyValue('--accent-color'));
    console.log('--bg-primary:', root.style.getPropertyValue('--bg-primary'));
    console.log('--text-primary:', root.style.getPropertyValue('--text-primary'));
    console.log('--border-color:', root.style.getPropertyValue('--border-color'));
    
    console.log('Body styles:');
    console.log('--primary-color:', body.style.getPropertyValue('--primary-color'));
    console.log('--accent-color:', body.style.getPropertyValue('--accent-color'));
    console.log('--bg-primary:', body.style.getPropertyValue('--bg-primary'));
    console.log('--text-primary:', body.style.getPropertyValue('--text-primary'));
    console.log('--border-color:', body.style.getPropertyValue('--border-color'));
    
    console.log('Computed styles:');
    console.log('--primary-color:', computedStyle.getPropertyValue('--primary-color'));
    console.log('--accent-color:', computedStyle.getPropertyValue('--accent-color'));
    console.log('--bg-primary:', computedStyle.getPropertyValue('--bg-primary'));
    console.log('--text-primary:', computedStyle.getPropertyValue('--text-primary'));
    console.log('--border-color:', computedStyle.getPropertyValue('--border-color'));
    
    // Test if the theme is actually visible
    console.log('=== Visual Test ===');
    console.log('Body background color:', computedStyle.backgroundColor);
    console.log('Body color:', computedStyle.color);
}


