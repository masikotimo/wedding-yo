// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Track page views
export const trackPageView = (pageName: string, pagePath?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-BFL3H3XHGC', {
      page_path: pagePath || `/${pageName}`,
      page_title: pageName,
    });
    
    // Also send as event for better tracking
    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_path: pagePath || `/${pageName}`,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventCategory: string,
  eventLabel?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: eventCategory,
      event_label: eventLabel,
      value: value,
    });
  }
};

// Track user registration
export const trackRegistration = (currency?: string) => {
  trackEvent('sign_up', 'engagement', 'user_registration');
  
  if (currency) {
    trackEvent('registration_currency', 'user_preference', currency);
  }
};

// Track user login
export const trackLogin = () => {
  trackEvent('login', 'engagement', 'user_login');
};

// Track tab/page navigation
export const trackTabChange = (tabName: string) => {
  trackEvent('tab_change', 'navigation', tabName);
  trackPageView(tabName, `/${tabName}`);
};

// Track key user actions
export const trackUserAction = (action: string, category: string, details?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      ...details,
    });
  }
};

