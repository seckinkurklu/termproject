/**
 * Supabase Client and Database Functions
 */

// Initialize the Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch campaigns from Supabase
 * @param {boolean} isActive - Whether to fetch active or past campaigns
 * @param {string} sortBy - Sort option
 * @param {number} limit - Number of campaigns to fetch
 * @returns {Promise<Array>} - Array of campaign objects
 */
async function fetchCampaigns(isActive = true, sortBy = APP_SETTINGS.defaultSort, limit = 20) {
    let query = supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', isActive);
    
    // Apply sorting based on option
    switch (sortBy) {
        case APP_SETTINGS.sortOptions.NEWEST:
            query = query.order('created_at', { ascending: false });
            break;
        case APP_SETTINGS.sortOptions.OLDEST:
            query = query.order('created_at', { ascending: true });
            break;
        case APP_SETTINGS.sortOptions.MOST_SIGNATURES:
            query = query.order('signatures_count', { ascending: false });
            break;
        case APP_SETTINGS.sortOptions.LEAST_SIGNATURES:
            query = query.order('signatures_count', { ascending: true });
            break;
        default:
            query = query.order('created_at', { ascending: false });
    }
    
    // Apply limit
    if (limit) {
        query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
    }
    
    return data;
}

/**
 * Fetch a single campaign by its ID
 * @param {string} campaignId - The ID of the campaign to fetch
 * @returns {Promise<Object|null>} - Campaign object or null if not found
 */
async function fetchCampaignById(campaignId) {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
    
    if (error) {
        console.error('Error fetching campaign:', error);
        return null;
    }
    
    return data;
}

/**
 * Create a new campaign
 * @param {Object} campaignData - Campaign data object
 * @returns {Promise<Object|null>} - Created campaign or null if error
 */
async function createCampaign(campaignData) {
    // Ensure the campaign starts as active
    const campaign = {
        ...campaignData,
        is_active: true,
        signatures_count: 0,
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select();
    
    if (error) {
        console.error('Error creating campaign:', error);
        return null;
    }
    
    return data[0];
}

/**
 * Sign a campaign
 * @param {string} campaignId - ID of campaign to sign
 * @param {string} signerIp - IP address or unique identifier of signer (optional)
 * @returns {Promise<boolean>} - Success status
 */
async function signCampaign(campaignId, signerIp = null) {
    // First check if this IP has already signed
    if (signerIp) {
        const { data: existingSignature } = await supabase
            .from('signatures')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('signer_ip', signerIp)
            .maybeSingle();
        
        if (existingSignature) {
            console.log('This IP has already signed this petition');
            return false;
        }
    }
    
    // Begin a transaction to both add signature and update count
    // First, add the signature record
    const { error: signatureError } = await supabase
        .from('signatures')
        .insert([
            { 
                campaign_id: campaignId, 
                signer_ip: signerIp,
                signed_at: new Date().toISOString()
            }
        ]);
    
    if (signatureError) {
        console.error('Error adding signature:', signatureError);
        return false;
    }
    
    // Then increment the signatures count on the campaign
    const { data: campaign, error: updateError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
    
    if (updateError) {
        console.error('Error fetching campaign to update:', updateError);
        return false;
    }
    
    // Increment signatures and check if target reached
    const newSignatureCount = (campaign.signatures_count || 0) + 1;
    const isActive = newSignatureCount < campaign.target_signatures;
    
    const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({ 
            signatures_count: newSignatureCount,
            is_active: isActive
        })
        .eq('id', campaignId);
    
    if (campaignUpdateError) {
        console.error('Error updating campaign signature count:', campaignUpdateError);
        return false;
    }
    
    return true;
}

/**
 * Submit a contact form
 * @param {Object} contactData - Contact form data
 * @returns {Promise<boolean>} - Success status
 */
async function submitContactForm(contactData) {
    const { data, error } = await supabase
        .from('contact_messages')
        .insert([
            { 
                ...contactData,
                submitted_at: new Date().toISOString()
            }
        ]);
    
    if (error) {
        console.error('Error submitting contact form:', error);
        return false;
    }
    
    return true;
}

/**
 * Fetch featured campaigns for the home page
 * @returns {Promise<Array>} - Array of featured campaign objects
 */
async function fetchFeaturedCampaigns() {
    // Featured campaigns are active campaigns with high signature count
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('signatures_count', { ascending: false })
        .limit(APP_SETTINGS.featuredCampaignsCount);
    
    if (error) {
        console.error('Error fetching featured campaigns:', error);
        return [];
    }
    
    return data;
}

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
} 