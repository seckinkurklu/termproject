/**
 * Home Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load featured campaigns
    loadFeaturedCampaigns();
});

/**
 * Load featured campaigns from Supabase
 */
async function loadFeaturedCampaigns() {
    const featuredCampaignsContainer = document.getElementById('featuredCampaigns');
    
    if (!featuredCampaignsContainer) return;
    
    try {
        // Show loading state
        featuredCampaignsContainer.innerHTML = '<div class="loading">Loading featured campaigns...</div>';
        
        // Fetch featured campaigns
        const campaigns = await fetchFeaturedCampaigns();
        
        if (campaigns.length === 0) {
            featuredCampaignsContainer.innerHTML = '<div class="no-campaigns">No active campaigns found. <a href="create.html">Create one now!</a></div>';
            return;
        }
        
        // Clear loading state
        featuredCampaignsContainer.innerHTML = '';
        
        // Render each campaign
        campaigns.forEach(campaign => {
            const campaignElement = createCampaignElement(campaign);
            featuredCampaignsContainer.appendChild(campaignElement);
        });
    } catch (error) {
        console.error('Error loading featured campaigns:', error);
        featuredCampaignsContainer.innerHTML = '<div class="error">Error loading campaigns. Please try again later.</div>';
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
            </div>
        </div>
    `;
    
    return campaignCard;
} 