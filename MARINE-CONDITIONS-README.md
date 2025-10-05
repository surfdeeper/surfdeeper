# Marine Conditions Overlay Feature

## Overview
Added live swell and wind data visualization to surf spot maps using Open-Meteo's free API.

## Features

### 🌊 Visual Overlays
- **Wind Arrows**: Show wind direction and speed with color-coded intensity
- **Swell Arrows**: Display swell direction, height, and period
- **Grid Pattern**: Multiple data points create a regional view of conditions

### 🎨 Color Coding

**Swell Height (feet)**
- 🔵 Blue (0-2 ft): Small
- 🟢 Green (2-4 ft): Good
- 🟡 Yellow (4-6 ft): Medium
- 🟠 Orange (6-10 ft): Big
- 🔴 Red (10+ ft): Huge

**Wind Speed (mph)**
- 🟢 Green (0-5 mph): Calm
- 🔵 Blue (5-10 mph): Light
- 🟡 Yellow (10-15 mph): Moderate
- 🟠 Orange (15-20 mph): Strong
- 🔴 Red (20+ mph): Very Strong

### 🎛️ Interactive Controls
- **Toggle Layers**: Turn wind and swell overlays on/off independently
- **Legends**: Color-coded legends for both wind and swell
- **Click Arrows**: Click any arrow to see detailed conditions popup

## Files Added

### Core Utilities
- `src/utils/marine-weather.ts` - Fetches data from Open-Meteo API
- `src/utils/map-overlays.ts` - Creates arrows, legends, and controls
- `src/styles/map-overlays.css` - Styling for all overlay elements

### Updated Pages
- `src/pages/maps.astro` - Added overlays to main map (5x5 grid)
- `src/pages/maps/[...slug].astro` - Added overlays to spot detail pages (3x3 grid)

## How It Works

1. **Data Fetching**: 
   - Fetches marine data from `marine-api.open-meteo.com` (wave/swell)
   - Fetches wind data from `api.open-meteo.com` (weather forecast)
   - Both APIs are 100% free with no API keys required

2. **Grid Creation**:
   - Creates a grid of data points around the map center
   - Main map: 5x5 grid with 0.15° spacing (~10 miles)
   - Spot pages: 3x3 grid with 0.08° spacing (~5 miles)

3. **Visualization**:
   - Arrows point in the direction of wind/swell
   - Size scales with intensity (bigger = stronger)
   - Colors indicate magnitude

4. **User Controls**:
   - Top-right: Toggle checkboxes for wind/swell layers
   - Bottom-right: Legends showing color scales
   - Arrows: Clickable for detailed info

## API Details

### Open-Meteo Marine API
- **Endpoint**: `https://marine-api.open-meteo.com/v1/marine`
- **Parameters**: wave_height, wave_period, wave_direction, swell_wave_height, swell_wave_period, swell_wave_direction
- **Update Frequency**: Hourly
- **Coverage**: Global oceans

### Open-Meteo Weather API
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Parameters**: wind_speed_10m, wind_direction_10m
- **Update Frequency**: Hourly
- **Coverage**: Global

## Performance
- Parallel API calls for speed
- Grid size adjustable (smaller grid = faster load)
- Lazy loading on map initialization
- Cached in browser for session

## Future Enhancements
- Add tide data overlay
- Historical conditions comparison
- Forecast timeline slider
- Save favorite conditions
- Weather alerts/notifications

## Usage

Visit any spot page (e.g., `/maps/linda-mar`) to see:
1. Current conditions card (top of page)
2. Interactive map with arrows (bottom of page)
3. Toggle controls (top-right of map)
4. Color legends (bottom-right of map)

Enjoy! 🏄‍♂️

