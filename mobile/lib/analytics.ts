// Analytics module — swap backend as needed (Segment, Amplitude, etc.)
// Currently logs to console for development.

type EventName =
  | 'session_started'
  | 'persona_selected'
  | 'message_sent'
  | 'vote_cast'
  | 'report_viewed'
  | 'report_generated'
  | 'share_tapped'
  | 'deep_dive_started'
  | 'session_completed';

type EventProps = Record<string, unknown>;

let analyticsProvider: {
  track: (event: string, props?: EventProps) => void;
} | null = null;

/**
 * Initialize analytics with a provider (Segment, Amplitude, etc.).
 * Call once at app startup.
 */
export function initAnalytics(provider: typeof analyticsProvider) {
  analyticsProvider = provider;
}

/**
 * Track an analytics event.
 * Falls back to console.log in development.
 */
export function trackEvent(event: EventName, props?: EventProps) {
  if (__DEV__) {
    console.log('[Analytics]', event, props);
  }

  if (analyticsProvider) {
    analyticsProvider.track(event, props);
  }
}
