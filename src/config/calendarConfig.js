/**
 * Calendar Booking Configuration
 *
 * Using Cal.com for scheduling (open source, generous free tier)
 * API Key stored for future backend integrations
 */

// Calendar booking is now enabled with Cal.com
export const CALENDAR_ENABLED = true;

// Cal.com booking URL
// Format: https://cal.com/[username]/[event-type]
// Update the username below after creating your Cal.com account
export const CALENDAR_URL = 'https://cal.com/yellowcircle/discovery-call';

// Calendar service name for display
export const CALENDAR_SERVICE = 'Cal.com';

// Cal.com API key for future backend integrations (webhooks, availability API, etc.)
// Note: This is a live API key - keep secure
export const CAL_API_KEY = 'cal_live_2062ddf01a278109f6419d7508dc72bb';

/**
 * Opens the calendar booking page
 * Falls back to contact modal if calendar not configured
 */
export const openCalendarBooking = (fallbackFn) => {
  if (CALENDAR_ENABLED && CALENDAR_URL) {
    window.open(CALENDAR_URL, '_blank', 'noopener,noreferrer');
    return true;
  }

  // Fallback to contact modal if calendar not configured
  if (fallbackFn) {
    fallbackFn();
  }
  return false;
};

export default {
  CALENDAR_ENABLED,
  CALENDAR_URL,
  CALENDAR_SERVICE,
  openCalendarBooking
};
