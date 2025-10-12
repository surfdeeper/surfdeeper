/**
 * Utility functions for visualizing surf conditions with color coding and ratings
 */

/**
 * Wind speed thresholds in mph
 * Safe/ideal surfing conditions are typically 0-15 mph
 * 15-25 mph is challenging but manageable
 * 25+ mph is dangerous for most surfers
 */
export const WIND_THRESHOLDS = {
  IDEAL: 8,      // 0-8 mph: glass/light offshore
  GOOD: 15,      // 8-15 mph: manageable
  ROUGH: 25,     // 15-25 mph: challenging
  MAXED: 35,     // 25-35 mph: dangerous (this is our "100%")
} as const;

/**
 * Swell period thresholds in seconds
 * Longer periods = more powerful, cleaner waves
 * Shorter periods = choppy, weak waves
 */
export const SWELL_PERIOD_THRESHOLDS = {
  TERRIBLE: 6,   // < 6s: wind chop, very poor
  POOR: 9,       // 6-9s: weak swell, not ideal
  FAIR: 12,      // 9-12s: decent swell
  GOOD: 16,      // 12-16s: good swell
  EXCELLENT: 20, // 16-20s: very good swell
  EPIC: 25,      // 20s+: epic groundswell
} as const;

export interface WindRating {
  percentage: number;      // 0-100, where 100 = maxed out
  color: string;          // CSS color
  label: string;          // Text description
  emoji: string;          // Visual indicator
}

export interface SwellPeriodRating {
  color: string;          // CSS color
  label: string;          // Text description
  emoji: string;          // Visual indicator
  quality: 'terrible' | 'poor' | 'fair' | 'good' | 'excellent' | 'epic';
}

/**
 * Gets wind speed rating and visualization data
 * @param windSpeedMph Wind speed in mph
 * @returns Wind rating with color, percentage, and label
 */
export function getWindRating(windSpeedMph: number): WindRating {
  const percentage = Math.min(100, Math.round((windSpeedMph / WIND_THRESHOLDS.MAXED) * 100));
  
  if (windSpeedMph <= WIND_THRESHOLDS.IDEAL) {
    return {
      percentage,
      color: '#00ff88',      // Green - perfect
      label: 'Ideal',
      emoji: '✨',
    };
  } else if (windSpeedMph <= WIND_THRESHOLDS.GOOD) {
    return {
      percentage,
      color: '#a3e635',      // Light green - good
      label: 'Good',
      emoji: '👍',
    };
  } else if (windSpeedMph <= WIND_THRESHOLDS.ROUGH) {
    return {
      percentage,
      color: '#fbbf24',      // Yellow/amber - challenging
      label: 'Rough',
      emoji: '⚠️',
    };
  } else {
    return {
      percentage,
      color: '#f87171',      // Red - dangerous
      label: 'Maxed',
      emoji: '🚫',
    };
  }
}

/**
 * Gets swell period rating and visualization data
 * @param periodSeconds Swell period in seconds
 * @returns Swell period rating with color and label
 */
export function getSwellPeriodRating(periodSeconds: number): SwellPeriodRating {
  if (periodSeconds < SWELL_PERIOD_THRESHOLDS.TERRIBLE) {
    return {
      color: '#991b1b',      // Dark red
      label: 'Terrible',
      emoji: '💀',
      quality: 'terrible',
    };
  } else if (periodSeconds < SWELL_PERIOD_THRESHOLDS.POOR) {
    return {
      color: '#f87171',      // Red
      label: 'Poor',
      emoji: '😞',
      quality: 'poor',
    };
  } else if (periodSeconds < SWELL_PERIOD_THRESHOLDS.FAIR) {
    return {
      color: '#fbbf24',      // Amber
      label: 'Fair',
      emoji: '😐',
      quality: 'fair',
    };
  } else if (periodSeconds < SWELL_PERIOD_THRESHOLDS.GOOD) {
    return {
      color: '#a3e635',      // Light green
      label: 'Good',
      emoji: '🙂',
      quality: 'good',
    };
  } else if (periodSeconds < SWELL_PERIOD_THRESHOLDS.EXCELLENT) {
    return {
      color: '#00ff88',      // Bright green
      label: 'Excellent',
      emoji: '😃',
      quality: 'excellent',
    };
  } else {
    return {
      color: '#0ea5e9',      // Blue - epic groundswell
      label: 'Epic',
      emoji: '🤩',
      quality: 'epic',
    };
  }
}

/**
 * Creates an inline HTML progress bar for wind speed
 * @param windSpeedMph Wind speed in mph
 * @returns HTML string for progress bar
 */
export function createWindProgressBar(windSpeedMph: number): string {
  const rating = getWindRating(windSpeedMph);
  return `
    <div style="display: inline-flex; align-items: center; gap: 0.5rem;">
      <div style="width: 60px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; display: inline-block;">
        <div style="width: ${rating.percentage}%; height: 100%; background: ${rating.color}; transition: width 0.3s ease;"></div>
      </div>
      <span style="color: ${rating.color}; font-size: 0.85em; font-weight: 600;">${rating.label}</span>
    </div>
  `.trim();
}

/**
 * Creates a colored dot indicator for swell period
 * @param periodSeconds Swell period in seconds
 * @returns HTML string for colored indicator
 */
export function createSwellPeriodIndicator(periodSeconds: number): string {
  const rating = getSwellPeriodRating(periodSeconds);
  return `
    <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${rating.color};"></span>
      <span style="color: ${rating.color}; font-weight: 600;">${rating.label}</span>
    </span>
  `.trim();
}

/**
 * Formats wind speed with rating for display in marquee
 * @param windSpeedMph Wind speed in mph
 * @param windDirection Cardinal direction
 * @returns Formatted HTML string
 */
export function formatWindForMarquee(windSpeedMph: number, windDirection: string): string {
  const rating = getWindRating(windSpeedMph);
  const roundedSpeed = Math.round(windSpeedMph);
  return `Wind <span style="color: ${rating.color}; font-weight: 700;">${roundedSpeed}mph</span> ${windDirection} <span style="font-size: 0.9em;">${rating.emoji}</span>`;
}

/**
 * Formats swell period with rating for display in marquee
 * @param periodSeconds Swell period in seconds
 * @returns Formatted HTML string
 */
export function formatSwellPeriodForMarquee(periodSeconds: number): string {
  const rating = getSwellPeriodRating(periodSeconds);
  const roundedPeriod = Math.round(periodSeconds);
  return `<span style="color: ${rating.color}; font-weight: 700;">${roundedPeriod}s</span> <span style="font-size: 0.9em;">${rating.emoji}</span>`;
}

/**
 * Formats complete spot conditions for marquee display
 * @param spotName Name of the surf spot
 * @param spotSlug Slug for the spot URL
 * @param waveHeightFt Wave height in feet
 * @param swellPeriod Swell period in seconds
 * @param swellDirection Cardinal direction
 * @param windSpeedMph Wind speed in mph
 * @param windDirection Cardinal direction
 * @returns Formatted HTML string
 */
export function formatSpotForMarquee(
  spotName: string,
  spotSlug: string,
  waveHeightFt: string,
  swellPeriod: number,
  swellDirection: string,
  windSpeedMph: number,
  windDirection: string
): string {
  return `<a href="/maps/${spotSlug}" style="color: #00ff88; text-decoration: none; border-bottom: 1px dotted #00ff88;">${spotName}</a>: ${waveHeightFt}ft @ ${formatSwellPeriodForMarquee(swellPeriod)} ${swellDirection} • ${formatWindForMarquee(windSpeedMph, windDirection)}`;
}

