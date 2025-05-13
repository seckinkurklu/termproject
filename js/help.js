/**
 * Help & FAQ Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize FAQ accordion
    initFAQAccordion();
    
    // Initialize contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
});

/**
 * Initialize FAQ accordion functionality
 */
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                // Toggle active class on this item
                item.classList.toggle('active');
                
                // Close other items (if desired)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
            });
        }
    });
}

/**
 * Handle contact form submission
 * @param {Event} event - Form submit event
 */
async function handleContactSubmit(event) {
    event.preventDefault();
    
    const formStatus = document.getElementById('formStatus');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // Get form values
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    // Basic validation
    if (!email || !subject || !message) {
        showFormStatus('Please fill in all required fields.', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFormStatus('Please enter a valid email address.', 'error');
        return;
    }
    
    // Disable form and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    showFormStatus('Sending your message...', 'info');
    
    try {
        // Create contact data object
        const contactData = {
            email,
            subject,
            message
        };
        
        // Submit to Supabase
        const success = await submitContactForm(contactData);
        
        if (success) {
            // Show success message
            showFormStatus('Your message has been sent! We\'ll get back to you as soon as possible.', 'success');
            
            // Reset form
            document.getElementById('contactForm').reset();
        } else {
            showFormStatus('There was a problem sending your message. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting contact form:', error);
        showFormStatus('An error occurred while sending your message. Please try again later.', 'error');
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
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