/**
 * Calendar Booking Configuration
 *
 * Using Cal.com for scheduling (open source, generous free tier)
 * API Key stored for future backend integrations
 */

// Calendar booking is now enabled with Cal.com
export const CALENDAR_ENABLED = true;

// Cal.com booking URL
export const CALENDAR_URL = 'https://cal.com/christopher-at-yellowcircle/';

// Calendar service name for display
export const CALENDAR_SERVICE = 'Cal.com';

// Cal.com API key should be stored in environment variables for backend use
// Do not commit API keys to source code
// Use: import.meta.env.VITE_CAL_API_KEY for frontend (if needed)

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
