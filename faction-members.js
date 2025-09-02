// Shared Faction Members Modal Functions
// This file contains the common functionality for viewing faction members across all faction pages

console.log('faction-members.js loaded successfully');

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';

// Faction Members Modal Functions
function showFactionMembers(factionName) {
    console.log('showFactionMembers called with faction:', factionName);
    alert('showFactionMembers called with faction: ' + factionName);
    
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('No auth token found, showing auth modal');
        // Show auth modal instead
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('show');
        }
        return;
    }
    
    const modal = document.getElementById('factionMembersModal');
    const title = document.getElementById('factionMembersTitle');
    const loadingState = document.getElementById('membersLoadingState');
    const noMembersState = document.getElementById('noMembersState');
    const membersGrid = document.getElementById('factionMembersGrid');
    
    console.log('Modal elements found:', {
        modal: !!modal,
        title: !!title,
        loadingState: !!loadingState,
        noMembersState: !!noMembersState,
        membersGrid: !!membersGrid
    });
    
    if (!modal || !title || !loadingState || !noMembersState || !membersGrid) {
        console.error('Required modal elements not found');
        return;
    }
    
    // Set title
    const factionDisplayName = getFactionDisplayName(factionName);
    title.textContent = `${factionDisplayName} Members`;
    
    // Show modal and loading state
    modal.classList.add('show');
    loadingState.style.display = 'block';
    noMembersState.style.display = 'none';
    membersGrid.style.display = 'none';
    
    // Fetch faction members
    fetchFactionMembers(factionName);
}

async function fetchFactionMembers(factionName) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/users/faction/${factionName}?limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch faction members: ${response.status}`);
        }
        
        const members = await response.json();
        displayFactionMembers(members);
        
    } catch (error) {
        console.error('Error fetching faction members:', error);
        showMembersError('Failed to load faction members. Please try again.');
    }
}

function displayFactionMembers(members) {
    const loadingState = document.getElementById('membersLoadingState');
    const noMembersState = document.getElementById('noMembersState');
    const membersGrid = document.getElementById('factionMembersGrid');
    
    if (!loadingState || !noMembersState || !membersGrid) {
        console.error('Required modal elements not found');
        return;
    }
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    if (members.length === 0) {
        noMembersState.style.display = 'block';
        membersGrid.style.display = 'none';
    } else {
        noMembersState.style.display = 'none';
        membersGrid.style.display = 'grid';
        
        // Generate member cards
        const memberCards = members.map(member => createMemberCard(member)).join('');
        membersGrid.innerHTML = memberCards;
    }
}

function createMemberCard(member) {
    const avatarHtml = member.avatarUrl 
        ? `<img src="${member.avatarUrl}" alt="${member.username}" class="user-avatar">`
        : `<i class="fas fa-user"></i>`;
    
    const lastActivity = formatLastActivity(member.lastActivity);
    
    return `
        <div class="user-card">
            <div class="user-card-header">
                <div class="user-avatar">
                    ${avatarHtml}
                </div>
                <div class="user-info">
                    <h3 class="user-username">${member.username}</h3>
                    <p class="user-faction">${getFactionDisplayName(member.faction)}</p>
                </div>
            </div>
            <div class="user-card-body">
                <div class="user-stats">
                    <div class="user-stat">
                        <span class="stat-label">Member Since</span>
                        <span class="stat-value">${formatDate(member.factionJoinDate || member.created_at)}</span>
                    </div>
                    <div class="user-stat">
                        <span class="stat-label">Last Active</span>
                        <span class="stat-value">${lastActivity}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showMembersError(message) {
    const loadingState = document.getElementById('membersLoadingState');
    const noMembersState = document.getElementById('noMembersState');
    const membersGrid = document.getElementById('factionMembersGrid');
    
    if (!loadingState || !noMembersState || !membersGrid) {
        console.error('Required modal elements not found');
        return;
    }
    
    loadingState.style.display = 'none';
    noMembersState.style.display = 'none';
    membersGrid.style.display = 'block';
    membersGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function hideFactionMembersModal() {
    const modal = document.getElementById('factionMembersModal');
    if (modal) {
        modal.classList.remove('show');
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

// Make functions globally available
window.showFactionMembers = showFactionMembers;
window.hideFactionMembersModal = hideFactionMembersModal;

// Set up modal close event listener
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closeFactionMembersModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideFactionMembersModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('factionMembersModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideFactionMembersModal();
            }
        });
    }
});
