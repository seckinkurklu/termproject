/**
 * Supabase configuration
 * Replace these with your actual Supabase project URL and anon key
 */
const SUPABASE_URL = 'https://syfwktlmqhrqdlvmcmmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZndrdGxtcWhycWRsdm1jbW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMjc3MTAsImV4cCI6MjA2MjcwMzcxMH0.5EtuCsp6qk2kC72O_wLU-rrCUai_jVNhRhRIIBZl7YU';

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