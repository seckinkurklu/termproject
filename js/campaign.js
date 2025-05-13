/**
 * Campaign Detail Page JavaScript
 */

// Track the current campaign
let currentCampaign = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Get campaign ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('id');
    
    if (!campaignId) {
        // No campaign ID provided, redirect to active campaigns
        window.location.href = 'active.html';
        return;
    }
    
    // Load campaign details
    await loadCampaignDetails(campaignId);
    
    // Set up share modal functionality if campaign was loaded
    if (currentCampaign) {
        setupShareModal();
    }
});

/**
 * Load campaign details from Supabase
 * @param {string} campaignId - ID of campaign to load
 */
async function loadCampaignDetails(campaignId) {
    const campaignContent = document.getElementById('campaignContent');
    
    if (!campaignContent) return;
    
    try {
        // Fetch campaign
        currentCampaign = await fetchCampaignById(campaignId);
        
        if (!currentCampaign) {
            campaignContent.innerHTML = '<div class="error">Campaign not found. It may have been removed.</div>';
            return;
        }
        
        // Update page title
        document.title = `${currentCampaign.title} - PetitionPower`;
        
        // Calculate progress percentage
        const progressPercentage = Math.min(
            Math.round((currentCampaign.signatures_count / currentCampaign.target_signatures) * 100),
            100
        );
        
        // Format the date
        const createdDate = new Date(currentCampaign.created_at).toLocaleDateString();
        
        // Generate campaign HTML
        const campaignHTML = `
            <div class="campaign-header">
                <h1>${currentCampaign.title}</h1>
                <div class="campaign-meta">
                    <span>Created on ${createdDate}</span>
                    <span>${currentCampaign.is_active ? 'Active Campaign' : 'Completed Campaign'}</span>
                </div>
            </div>
            
            ${currentCampaign.has_image ? `<img src="${currentCampaign.image_url || 'img/placeholder.jpg'}" alt="${currentCampaign.title}" class="campaign-image">` : ''}
            
            <div class="campaign-content">
                <p>${currentCampaign.description.replace(/\n/g, '</p><p>')}</p>
            </div>
            
            <div class="campaign-progress-section">
                ${!currentCampaign.is_active ? '<div class="goal-reached">Goal Reached!</div>' : ''}
                
                <div class="campaign-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span class="current">${currentCampaign.signatures_count} signatures</span>
                        <span class="target">of ${currentCampaign.target_signatures} goal</span>
                    </div>
                </div>
                
                <div class="campaign-actions">
                    ${currentCampaign.is_active ? 
                        `<button id="signButton" class="btn primary">Sign This Petition</button>` : 
                        `<button disabled class="btn primary">Goal Reached</button>`
                    }
                    <button id="shareButton" class="btn secondary">Share</button>
                </div>
            </div>
            
            <!-- Share Modal -->
            <div id="shareModal" class="share-modal">
                <div class="share-modal-content">
                    <div class="share-modal-header">
                        <h3>Share this petition</h3>
                        <button class="close-modal" id="closeModal">&times;</button>
                    </div>
                    <div class="share-options">
                        <div class="share-option" data-platform="facebook">
                            <span>Facebook</span>
                        </div>
                        <div class="share-option" data-platform="twitter">
                            <span>Twitter</span>
                        </div>
                        <div class="share-option" data-platform="email">
                            <span>Email</span>
                        </div>
                    </div>
                    <div class="share-link">
                        <label for="shareUrl">Copy link</label>
                        <div class="share-link-input">
                            <input type="text" id="shareUrl" value="${window.location.href}" readonly>
                            <button id="copyLink">Copy</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Update the campaign content
        campaignContent.innerHTML = campaignHTML;
        
        // Add event listener for sign button
        const signButton = document.getElementById('signButton');
        if (signButton) {
            signButton.addEventListener('click', () => handleSignPetition(campaignId, signButton));
        }
        
        // Load signatures and related campaigns
        loadSignatures(campaignId);
        loadRelatedCampaigns(campaignId);
        
    } catch (error) {
        console.error('Error loading campaign details:', error);
        campaignContent.innerHTML = '<div class="error">Error loading campaign details. Please try again later.</div>';
    }
}

/**
 * Load signatures for a campaign
 * @param {string} campaignId - ID of campaign
 */
async function loadSignatures(campaignId) {
    const signaturesContainer = document.getElementById('signaturesContainer');
    
    if (!signaturesContainer) return;
    
    try {
        // Fetch signatures (this would be a new function in supabase.js)
        // For now we'll just create dummy data
        const signatures = [
            { name: 'Anonymous supporter', date: new Date().toISOString() },
            { name: 'Anonymous supporter', date: new Date(Date.now() - 86400000).toISOString() },
            { name: 'Anonymous supporter', date: new Date(Date.now() - 172800000).toISOString() }
        ];
        
        if (signatures.length === 0) {
            signaturesContainer.innerHTML = '<div class="no-signatures">No signatures yet. Be the first to sign this petition!</div>';
            return;
        }
        
        // Render signatures
        signaturesContainer.innerHTML = '';
        signatures.forEach(signature => {
            const signatureEl = document.createElement('div');
            signatureEl.className = 'signature-item';
            
            const date = new Date(signature.date).toLocaleDateString();
            
            signatureEl.innerHTML = `
                <div class="signature-info">
                    <span class="signature-name">${signature.name}</span>
                    <span class="signature-date">${date}</span>
                </div>
            `;
            
            signaturesContainer.appendChild(signatureEl);
        });
        
    } catch (error) {
        console.error('Error loading signatures:', error);
        signaturesContainer.innerHTML = '<div class="error">Error loading signatures. Please try again later.</div>';
    }
}

/**
 * Load related campaigns
 * @param {string} campaignId - Current campaign ID to exclude
 */
async function loadRelatedCampaigns(campaignId) {
    const relatedContainer = document.getElementById('relatedCampaigns');
    
    if (!relatedContainer) return;
    
    try {
        // Fetch active campaigns (limit to 3)
        const campaigns = await fetchCampaigns(true, APP_SETTINGS.defaultSort, 3);
        
        // Filter out current campaign
        const relatedCampaigns = campaigns.filter(campaign => campaign.id !== campaignId);
        
        if (relatedCampaigns.length === 0) {
            relatedContainer.innerHTML = '<div class="no-campaigns">No other active campaigns found.</div>';
            return;
        }
        
        // Render campaigns
        relatedContainer.innerHTML = '';
        relatedCampaigns.forEach(campaign => {
            const campaignEl = createCampaignElement(campaign);
            relatedContainer.appendChild(campaignEl);
        });
        
    } catch (error) {
        console.error('Error loading related campaigns:', error);
        relatedContainer.innerHTML = '<div class="error">Error loading related campaigns. Please try again later.</div>';
    }
}

/**
 * Create a campaign card element (reused from campaigns.js)
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
    
    // Add success class for completed campaigns
    if (!campaign.is_active || progressPercentage >= 100) {
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
            </div>
        </div>
    `;
    
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
            button.textContent = 'Thank You for Signing!';
            button.classList.remove('primary');
            button.classList.add('secondary');
            
            // Reload page after a short delay to show updated signature count
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            button.textContent = 'You Already Signed';
            button.disabled = true;
        }
    } catch (error) {
        console.error('Error signing petition:', error);
        button.textContent = 'Error Signing';
        button.disabled = false;
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

/**
 * Set up share modal functionality
 */
function setupShareModal() {
    const shareButton = document.getElementById('shareButton');
    const shareModal = document.getElementById('shareModal');
    const closeModal = document.getElementById('closeModal');
    const copyLink = document.getElementById('copyLink');
    const shareUrl = document.getElementById('shareUrl');
    const shareOptions = document.querySelectorAll('.share-option');
    
    if (!shareButton || !shareModal) return;
    
    // Open modal
    shareButton.addEventListener('click', () => {
        shareModal.classList.add('active');
    });
    
    // Close modal
    closeModal.addEventListener('click', () => {
        shareModal.classList.remove('active');
    });
    
    // Close on click outside
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.remove('active');
        }
    });
    
    // Copy link button
    if (copyLink && shareUrl) {
        copyLink.addEventListener('click', () => {
            shareUrl.select();
            document.execCommand('copy');
            copyLink.textContent = 'Copied!';
            setTimeout(() => {
                copyLink.textContent = 'Copy';
            }, 2000);
        });
    }
    
    // Share options
    if (shareOptions.length > 0) {
        shareOptions.forEach(option => {
            option.addEventListener('click', () => {
                const platform = option.getAttribute('data-platform');
                const shareUrl = window.location.href;
                const title = currentCampaign.title;
                
                let url = '';
                
                switch (platform) {
                    case 'facebook':
                        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                        break;
                    case 'twitter':
                        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
                        break;
                    case 'email':
                        url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this petition: ${shareUrl}`)}`;
                        break;
                }
                
                if (url) {
                    window.open(url, '_blank');
                }
            });
        });
    }
} 