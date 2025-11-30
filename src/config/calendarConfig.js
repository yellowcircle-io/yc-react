/**
 * Calendar Booking Configuration
 *
 * Configure your calendar booking service (Calendly, Cal.com, etc.)
 *
 * To enable calendar booking:
 * 1. Sign up at calendly.com or cal.com
 * 2. Create a 30-minute discovery call event type
 * 3. Copy your booking URL and paste it below
 * 4. Set CALENDAR_ENABLED to true
 */

// Set to true when you have a calendar URL configured
export const CALENDAR_ENABLED = false;

// Your calendar booking URL (Calendly or Cal.com)
// Examples:
// - Calendly: https://calendly.com/yellowcircle/discovery-call
// - Cal.com: https://cal.com/yellowcircle/discovery-call
export const CALENDAR_URL = '';

// Calendar service name for display
export const CALENDAR_SERVICE = 'Calendly';

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
