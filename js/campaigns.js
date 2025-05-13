/**
 * Campaigns List Page JavaScript
 * This script is used for both active.html and past.html
 */

// Track state for pagination and filtering
const state = {
    page: 0,
    pageSize: 6,
    sortBy: APP_SETTINGS.defaultSort,
    searchQuery: '',
    hasMore: true,
    isLoading: false,
    isActive: true // Will be set based on current page
};

document.addEventListener('DOMContentLoaded', () => {
    // Determine if we're on the active or past campaigns page
    const currentPage = window.location.pathname;
    state.isActive = !currentPage.includes('past');
    
    // Initialize UI elements
    initializeUI();
    
    // Load initial campaigns
    loadCampaigns();
});

/**
 * Initialize UI event listeners and elements
 */
function initializeUI() {
    // Sort options
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            state.sortBy = sortSelect.value;
            resetAndReload();
        });
    }
    
    // Search functionality
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            state.searchQuery = searchInput.value.trim();
            resetAndReload();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = searchInput.value.trim();
                resetAndReload();
            }
        });
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadCampaigns(true);
        });
    }
}

/**
 * Reset pagination state and reload campaigns
 */
function resetAndReload() {
    state.page = 0;
    state.hasMore = true;
    
    const campaignsContainer = document.getElementById('campaignsContainer');
    if (campaignsContainer) {
        campaignsContainer.innerHTML = '<div class="loading">Loading campaigns...</div>';
    }
    
    loadCampaigns();
}

/**
 * Load campaigns from Supabase
 * @param {boolean} append - Whether to append results or replace
 */
async function loadCampaigns(append = false) {
    if (state.isLoading || !state.hasMore) return;
    
    const campaignsContainer = document.getElementById('campaignsContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (!campaignsContainer) return;
    
    try {
        state.isLoading = true;
        
        // Show loading state if not appending
        if (!append) {
            campaignsContainer.innerHTML = '<div class="loading">Loading campaigns...</div>';
        }
        
        // Fetch campaigns
        const campaigns = await fetchCampaigns(
            state.isActive, 
            state.sortBy, 
            state.pageSize, 
            state.page * state.pageSize
        );
        
        // Check if we have more results
        state.hasMore = campaigns.length === state.pageSize;
        
        // Update load more button
        if (loadMoreBtn) {
            loadMoreBtn.style.display = state.hasMore ? 'block' : 'none';
        }
        
        // Handle no results case
        if (campaigns.length === 0 && !append) {
            campaignsContainer.innerHTML = `
                <div class="no-campaigns">
                    No ${state.isActive ? 'active' : 'past'} campaigns found. 
                    ${state.isActive ? '<a href="create.html">Create one now!</a>' : ''}
                </div>
            `;
            return;
        }
        
        // Clear container if not appending
        if (!append) {
            campaignsContainer.innerHTML = '';
        } else {
            // Remove loading indicator if it exists
            const loadingEl = campaignsContainer.querySelector('.loading');
            if (loadingEl) {
                loadingEl.remove();
            }
        }
        
        // Render each campaign
        campaigns.forEach(campaign => {
            const campaignElement = createCampaignElement(campaign);
            campaignsContainer.appendChild(campaignElement);
        });
        
        // Increment page for next load
        state.page++;
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        if (!append) {
            campaignsContainer.innerHTML = '<div class="error">Error loading campaigns. Please try again later.</div>';
        }
    } finally {
        state.isLoading = false;
    }
}

/**
 * Create a campaign card element
 * @param {Object} campaign - Campaign data
 * @returns {HTMLElement} - Campaign card element
 */
function createCampaignElement(campaign) {
    // Calculate progress percentage
    const progressPercentage = Math.min(
        Math.round((campaign.signatures_count / campaign.target_signatures) * 100),
        100
    );
    
    // Create the campaign card element
    const campaignCard = document.createElement('div');
    campaignCard.className = 'campaign-card';
    
    // Add success class for past campaigns
    if (!state.isActive || progressPercentage >= 100) {
        campaignCard.classList.add('success');
    }
    
    // Truncate title and description
    const truncatedTitle = truncateText(campaign.title, APP_SETTINGS.truncation.title);
    const truncatedDescription = truncateText(campaign.description, APP_SETTINGS.truncation.description);
    
    // Format the date
    const createdDate = new Date(campaign.created_at).toLocaleDateString();
    
    // Create HTML for the campaign card
    campaignCard.innerHTML = `
        <div class="campaign-content">
            <h3 class="campaign-title">${truncatedTitle}</h3>
            <p class="campaign-description">${truncatedDescription}</p>
            
            <div class="campaign-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="campaign-stats">
                    <span>${campaign.signatures_count} of ${campaign.target_signatures} signatures</span>
                    <span>Created on ${createdDate}</span>
                </div>
            </div>
            
            <div class="campaign-actions">
                <a href="campaign.html?id=${campaign.id}" class="btn primary">View Campaign</a>
                ${state.isActive ? `<button class="btn secondary sign-petition-btn" data-id="${campaign.id}">Sign Petition</button>` : ''}
            </div>
        </div>
    `;
    
    // Add event listener for sign button if this is active campaign
    if (state.isActive) {
        const signButton = campaignCard.querySelector('.sign-petition-btn');
        if (signButton) {
            signButton.addEventListener('click', () => handleSignPetition(campaign.id, signButton));
        }
    }
    
    return campaignCard;
}

/**
 * Handle signing a petition
 * @param {string} campaignId - ID of campaign to sign
 * @param {HTMLElement} button - Button element that was clicked
 */
async function handleSignPetition(campaignId, button) {
    if (!campaignId || !button) return;
    
    // Disable button
    button.disabled = true;
    button.textContent = 'Signing...';
    
    try {
        // Get a simple identifier (we're not implementing full auth in this version)
        // In a real app, you'd use the user's authenticated ID
        const signerIp = await getSimpleIdentifier();
        
        // Sign the campaign
        const success = await signCampaign(campaignId, signerIp);
        
        if (success) {
            // Update button
            button.textContent = 'Signed!';
            button.classList.remove('secondary');
            button.classList.add('primary');
            
            // Check if we need to reload the page (campaign might be completed)
            setTimeout(() => {
                resetAndReload();
            }, 1500);
        } else {
            button.textContent = 'Already Signed';
        }
    } catch (error) {
        console.error('Error signing petition:', error);
        button.textContent = 'Error';
    }
}

/**
 * Get a simple identifier for the current user
 * This is a placeholder for a proper auth system
 * @returns {Promise<string>} - A simple identifier
 */
async function getSimpleIdentifier() {
    // In a real app, you'd use the user's authenticated ID
    // For simplicity, we'll use a fingerprint of their browser info
    // This is NOT a proper authentication system!
    const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height;
    
    // Create a simple hash from the browser info
    let hash = 0;
    for (let i = 0; i < browserInfo.length; i++) {
        hash = ((hash << 5) - hash) + browserInfo.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return 'anon_' + Math.abs(hash).toString(16);
} 