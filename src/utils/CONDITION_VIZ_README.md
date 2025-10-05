# Condition Visualization System

This document explains the data visualization system for surf conditions.

## Overview

The condition visualization system provides color-coded, visual indicators for wind speeds and swell periods across the site. This helps surfers quickly assess conditions at a glance.

## Architecture

### Single Source of Truth

All visualization logic lives in `/src/utils/condition-viz.ts`. This ensures:
- Consistent ratings across the entire site
- Easy updates to thresholds and colors
- DRY code - no duplication of logic

### Used By

1. **Homepage Marquee** (`/src/pages/index.astro`) - Shows real-time conditions with color coding
2. **Spot Pages** (`/src/pages/maps/[...slug].astro`) - Displays detailed condition data with visual indicators

## Wind Speed Visualization

### Thresholds (in mph)

- **0-8 mph**: ✨ Ideal (Green `#00ff88`) - Glass/light offshore
- **8-15 mph**: 👍 Good (Light green `#a3e635`) - Manageable
- **15-25 mph**: ⚠️ Rough (Yellow `#fbbf24`) - Challenging
- **25-35 mph**: 🚫 Maxed (Red `#f87171`) - Dangerous (100% on scale)

### Display Features

- **Progress Bar**: Shows wind speed as percentage of maximum safe limit (35 mph = 100%)
- **Color Coding**: Background color indicates safety level
- **Emoji Indicators**: Visual cues for quick recognition
- **Labels**: Text descriptions (Ideal, Good, Rough, Maxed)

## Swell Period Visualization

### Thresholds (in seconds)

- **< 6s**: 💀 Terrible (Dark red `#991b1b`) - Wind chop
- **6-9s**: 😞 Poor (Red `#f87171`) - Weak swell
- **9-12s**: 😐 Fair (Amber `#fbbf24`) - Decent swell
- **12-16s**: 🙂 Good (Light green `#a3e635`) - Good swell
- **16-20s**: 😃 Excellent (Bright green `#00ff88`) - Very good swell
- **20s+**: 🤩 Epic (Blue `#0ea5e9`) - Groundswell

### Display Features

- **Color-Coded Text**: Period displayed in color matching quality
- **Emoji Indicators**: Face emojis show quality at a glance
- **Colored Dots**: Small indicators in marquee

## API Reference

### Key Functions

```typescript
// Get wind rating with percentage, color, and label
getWindRating(windSpeedMph: number): WindRating

// Get swell period rating with color and label
getSwellPeriodRating(periodSeconds: number): SwellPeriodRating

// Format complete spot data for marquee
formatSpotForMarquee(spotName, spotSlug, waveHeightFt, swellPeriod, swellDirection, windSpeedMph, windDirection): string
```

## Updating Thresholds

To modify thresholds, edit `/src/utils/condition-viz.ts`:

```typescript
export const WIND_THRESHOLDS = {
  IDEAL: 8,
  GOOD: 15,
  ROUGH: 25,
  MAXED: 35,  // This is "100%" on the progress bar
} as const;

export const SWELL_PERIOD_THRESHOLDS = {
  TERRIBLE: 6,
  POOR: 9,
  FAIR: 12,
  GOOD: 16,
  EXCELLENT: 20,
  EPIC: 25,
} as const;
```

## Color Palette

All colors are defined in the visualization functions for easy theming:

- **Ideal/Excellent**: `#00ff88` (Brand green)
- **Good**: `#a3e635` (Light green)
- **Fair/Rough**: `#fbbf24` (Amber)
- **Poor**: `#f87171` (Red)
- **Terrible**: `#991b1b` (Dark red)
- **Epic**: `#0ea5e9` (Blue)

## Examples

### Marquee Display

```
Ocean Beach: 4.2ft @ 14s 🙂 W • Wind 12mph 👍 NW ✨
```

### Spot Page Display

- **Wind**: Progress bar showing 34% (12 mph), colored light green, labeled "Good 👍"
- **Swell Period**: "14s 🙂" in light green, labeled "Good"

