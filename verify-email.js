// Email Verification Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a valid verification token from URL
    checkVerificationToken();
    
    // Initialize verification functionality
    initializeVerification();
});

// Check if we have a valid verification token from the URL
function checkVerificationToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Invalid or missing verification token. Please check your email for the correct link.');
        return;
    }
    
    // Store the token for later use
    window.verificationToken = token;
    
    // Automatically verify the token
    verifyEmailToken(token);
}

// Initialize verification functionality
function initializeVerification() {
    const resendEmailLink = document.getElementById('resendEmailLink');
    
    if (resendEmailLink) {
        resendEmailLink.addEventListener('click', handleResendVerificationEmail);
    }
}

// Verify the email verification token with the server
async function verifyEmailToken(token) {
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to verify email');
        }
        
        // Email verified successfully
        showSuccess('Email verified successfully! Your account is now active. Redirecting to login...');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        showError(`Verification failed: ${error.message}`);
    }
}

// Handle resending verification email
async function handleResendVerificationEmail(e) {
    e.preventDefault();
    
    const resendLink = e.target;
    const originalText = resendLink.textContent;
    
    try {
        // Show loading state
        resendLink.textContent = 'Sending...';
        resendLink.style.pointerEvents = 'none';
        
        // Get email from URL or prompt user
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        
        if (!email) {
            // Prompt user for email if not in URL
            const userEmail = prompt('Please enter your email address to resend the verification email:');
            if (!userEmail) return;
            
            // Update URL to include email
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('email', userEmail);
            window.history.replaceState({}, '', newUrl);
        }
        
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email || urlParams.get('email') 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to resend verification email');
        }
        
        showSuccess('Verification email resent successfully! Please check your inbox.');
        
    } catch (error) {
        showError(`Failed to resend email: ${error.message}`);
    } finally {
        // Reset the link
        resendLink.textContent = originalText;
        resendLink.style.pointerEvents = 'auto';
    }
}

// Show error message
function showError(message) {
    const verificationStatus = document.getElementById('verificationStatus');
    
    verificationStatus.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Show success message
function showSuccess(message) {
    const verificationStatus = document.getElementById('verificationStatus');
    
    verificationStatus.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <p>${message}</p>
        </div>
    `;
}
