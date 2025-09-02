// Reset Password Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have a valid reset token from URL
    checkResetToken();
    
    // Initialize reset password functionality
    initializeResetPassword();
});

// Check if we have a valid reset token from the URL
function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Invalid or missing reset token. Please request a new password reset link.');
        disableForm();
        return;
    }
    
    // Store the token for later use
    window.resetToken = token;
    
    // Verify the token is valid
    verifyResetToken(token);
}

// Verify the reset token with the server
async function verifyResetToken(token) {
    try {
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/verify-reset-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            throw new Error('Invalid or expired reset token');
        }
        
        // Token is valid, enable the form
        enableForm();
        showSuccess('Token verified! Please enter your new password.');
        
    } catch (error) {
        showError('Invalid or expired reset token. Please request a new password reset link.');
        disableForm();
    }
}

// Initialize reset password functionality
function initializeResetPassword() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
    
    // Add password confirmation validation
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (newPasswordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            validatePasswordMatch();
        });
    }
}

// Handle password reset form submission
async function handleResetPassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showError('Passwords do not match. Please try again.');
        return;
    }
    
    // Validate password length
    if (newPassword.length < 8) {
        showError('Password must be at least 8 characters long.');
        return;
    }
    
    try {
        // Show loading state
        const resetPasswordBtn = document.getElementById('resetPasswordBtn');
        const originalText = resetPasswordBtn.textContent;
        resetPasswordBtn.textContent = 'Resetting Password...';
        resetPasswordBtn.disabled = true;
        
        const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://gravegrounds-faction-tracker-production.up.railway.app';
        
        const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                token: window.resetToken,
                newPassword 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to reset password');
        }
        
        showSuccess('Password reset successfully! Redirecting to login page...');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Reset button
        const resetPasswordBtn = document.getElementById('resetPasswordBtn');
        if (resetPasswordBtn) {
            resetPasswordBtn.textContent = 'Reset Password';
            resetPasswordBtn.disabled = false;
        }
    }
}

// Validate that passwords match
function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    
    if (confirmPassword && newPassword !== confirmPassword) {
        showError('Passwords do not match');
        if (resetPasswordBtn) resetPasswordBtn.disabled = true;
    } else {
        clearError();
        if (resetPasswordBtn) resetPasswordBtn.disabled = false;
    }
}

// Disable the form
function disableForm() {
    const form = document.getElementById('resetPasswordForm');
    const inputs = form.querySelectorAll('input, button');
    
    inputs.forEach(input => {
        input.disabled = true;
    });
}

// Enable the form
function enableForm() {
    const form = document.getElementById('resetPasswordForm');
    const inputs = form.querySelectorAll('input, button');
    
    inputs.forEach(input => {
        input.disabled = false;
    });
}

// Show error message
function showError(message) {
    clearError();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.getElementById('resetPasswordForm');
    form.insertBefore(errorDiv, form.firstChild);
}

// Clear error message
function clearError() {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Show success message
function showSuccess(message) {
    clearSuccess();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const form = document.getElementById('resetPasswordForm');
    form.insertBefore(successDiv, form.firstChild);
}

// Clear success message
function clearSuccess() {
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
}
