/**
 * Create Campaign Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById('createCampaignForm');
    const formStatus = document.getElementById('formStatus');
    
    if (createForm) {
        createForm.addEventListener('submit', handleCampaignSubmit);
    }
});

/**
 * Handle campaign form submission
 * @param {Event} event - Form submit event
 */
async function handleCampaignSubmit(event) {
    event.preventDefault();
    
    const formStatus = document.getElementById('formStatus');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // Get form values
    const title = document.getElementById('campaignTitle').value.trim();
    const description = document.getElementById('campaignDescription').value.trim();
    const targetSignatures = parseInt(document.getElementById('targetSignatures').value);
    const imageFile = document.getElementById('campaignImage').files[0];
    
    // Basic validation
    if (!title || !description || isNaN(targetSignatures) || targetSignatures < 10) {
        showFormStatus('Please fill in all required fields correctly. Target signatures must be at least 10.', 'error');
        return;
    }
    
    // Disable form and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';
    showFormStatus('Creating your petition...', 'info');
    
    try {
        // Create campaign data object
        const campaignData = {
            title,
            description,
            target_signatures: targetSignatures,
            // Other fields will be added by the createCampaign function
        };
        
        // Handle image upload if provided
        if (imageFile) {
            // Image handling would typically involve uploading to Supabase Storage
            // For simplicity in this initial version, we'll skip actual image upload
            campaignData.has_image = true;
            // In a complete implementation, you would:
            // 1. Upload image to Supabase Storage
            // 2. Get the URL
            // 3. Add the URL to campaignData
        }
        
        // Create the campaign in Supabase
        const newCampaign = await createCampaign(campaignData);
        
        if (newCampaign) {
            // Show success message
            showFormStatus('Your petition has been created successfully!', 'success');
            
            // Reset form
            document.getElementById('createCampaignForm').reset();
            
            // Redirect to the new campaign page after a short delay
            setTimeout(() => {
                window.location.href = `campaign.html?id=${newCampaign.id}`;
            }, 2000);
        } else {
            showFormStatus('There was a problem creating your petition. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        showFormStatus('An error occurred while creating your petition. Please try again later.', 'error');
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = 'Create Petition';
    }
}

/**
 * Show form status message
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, error, info)
 */
function showFormStatus(message, type = 'info') {
    const formStatus = document.getElementById('formStatus');
    
    if (!formStatus) return;
    
    // Clear existing classes
    formStatus.className = 'form-status';
    
    // Add appropriate class based on type
    formStatus.classList.add(type);
    
    // Set message
    formStatus.textContent = message;
    
    // Show the status
    formStatus.style.display = 'block';
    
    // If it's an info message, don't auto-hide
    if (type === 'info') return;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            formStatus.style.display = 'none';
        }, 5000);
    }
} 