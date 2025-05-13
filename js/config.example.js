/**
 * Supabase configuration
 * Copy this file to config.js and replace with your actual Supabase project URL and anon key
 */
const SUPABASE_URL = 'https://your-supabase-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

/**
 * Application Settings
 */
const APP_SETTINGS = {
    // Number of featured campaigns to display on home page
    featuredCampaignsCount: 3,
    
    // Sort options for campaigns
    sortOptions: {
        NEWEST: 'newest',
        OLDEST: 'oldest',
        MOST_SIGNATURES: 'most_signatures',
        LEAST_SIGNATURES: 'least_signatures',
        CLOSING_SOON: 'closing_soon'
    },
    
    // Default sort option
    defaultSort: 'newest',
    
    // Text truncation settings
    truncation: {
        title: 80,
        description: 150
    }
}; 