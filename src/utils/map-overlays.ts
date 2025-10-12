/**
 * Map overlay utilities for visualizing marine conditions
 */

import { fetchMarineConditions, degreesToCardinal, metersToFeet } from './marine-weather';
import type { MarineConditions } from './marine-weather';

declare const L: any;

// Simple in-memory cache to reduce API calls during zoom/move refreshes
const CONDITIONS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
type CacheEntry = { ts: number; data: MarineConditions | null };
const conditionsCache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lng: number) {
  // Round to ~0.02° so neighboring zoom refreshes reuse data
  const r = (n: number) => Number(n.toFixed(2));
  return `${r(lat)},${r(lng)}`;
}

async function fetchWithCache(lat: number, lng: number): Promise<MarineConditions | null> {
  const key = cacheKey(lat, lng);
  const now = Date.now();
  const cached = conditionsCache.get(key);
  if (cached && now - cached.ts < CONDITIONS_CACHE_TTL_MS) return cached.data;
  const data = await fetchMarineConditions(lat, lng);
  conditionsCache.set(key, { ts: now, data });
  return data;
}

/** Determine grid size/spacing based on zoom (keeps points ~< 40) */
export function gridParamsForZoom(zoom: number, latitude: number): { gridSize: number; spacing: number } {
  // Keep a rough constant screen density. Spacing is degrees; adjust by latitude
  // to account for longitude convergence.
  const cosLat = Math.max(Math.cos((latitude * Math.PI) / 180), 0.3);
  if (zoom <= 6) return { gridSize: 3, spacing: 0.6 };
  if (zoom <= 7) return { gridSize: 3, spacing: 0.4 };
  if (zoom <= 8) return { gridSize: 5, spacing: 0.25 };
  if (zoom <= 9) return { gridSize: 5, spacing: 0.18 };
  if (zoom <= 10) return { gridSize: 5, spacing: 0.12 };
  if (zoom <= 11) return { gridSize: 7, spacing: 0.08 };
  if (zoom <= 12) return { gridSize: 7, spacing: 0.06 };
  if (zoom <= 13) return { gridSize: 9, spacing: 0.045 };
  return { gridSize: 9, spacing: 0.035 * cosLat };
}

/**
 * SVG factories as requested:
 * - Wind: black filled circle with speed text (white/Yellow/Red by severity)
 * - Swell: colored circle (heat) with period text (e.g. 16s)
 */
function windTextColor(mph: number): string {
  if (mph > 18) return '#ef4444'; // too strong
  if (mph > 12) return '#fde047'; // strong
  return '#ffffff';
}

function createWindSVG(mph: number, size: number): string {
  const s = size;
  const value = Math.round(mph).toString();
  const textColor = windTextColor(mph);
  return `
    <svg width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="12" cy="12" r="9.5" fill="#0b1321" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1"/>
      </g>
      <text x="12" y="12.5" text-anchor="middle" dominant-baseline="middle" font-size="9" font-family="system-ui, sans-serif" font-weight="700" fill="${textColor}">${value}</text>
    </svg>
  `;
}

function createSwellSVG(color: string, period: number, size: number): string {
  const s = size;
  const value = `${Math.round(period)}s`;
  return `
    <svg width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.4"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="12" cy="12" r="9.5" fill="${color}" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1"/>
      </g>
      <text x="12" y="12.5" text-anchor="middle" dominant-baseline="middle" font-size="8" font-family="system-ui, sans-serif" font-weight="800" fill="#ffffff">${value}</text>
    </svg>
  `;
}

/**
 * Gets color based on intensity
 */
export function getIntensityColor(value: number, type: 'swell' | 'wind'): string {
  if (type === 'swell') {
    // Distinct purple scale for swell (feet)
    if (value < 2) return '#c4b5fd'; // light purple
    if (value < 4) return '#a78bfa';
    if (value < 6) return '#8b5cf6';
    if (value < 10) return '#7c3aed';
    return '#6d28d9'; // darkest for huge
  } else {
    // Distinct green scale for wind (mph)
    if (value < 5) return '#bbf7d0'; // very light
    if (value < 10) return '#86efac';
    if (value < 15) return '#22c55e';
    if (value < 20) return '#16a34a';
    return '#15803d'; // very strong
  }
}

/**
 * Creates a wind arrow marker
 */
export function createWindArrow(
  map: any,
  lat: number,
  lng: number,
  windSpeed: number,
  windDirection: number
): any {
  const windMph = windSpeed * 0.621371;
  const size = 22 + Math.min(windSpeed * 1.2, 22); // compact circle marker
  
  const icon = L.divIcon({
    className: 'wind-arrow-icon',
    html: `
      <div style="width: ${size}px; height: ${size}px;">
        ${createWindSVG(windMph, size)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });

  const marker = L.marker([lat, lng], { icon });
  const popup = `
    <div style="text-align: center;">
      <strong>Wind</strong><br/>
      ${windMph.toFixed(1)} mph<br/>
      ${degreesToCardinal(windDirection)}
    </div>
  `;
  marker.bindPopup(popup);
  
  return marker;
}

/**
 * Creates a swell arrow marker
 */
export function createSwellArrow(
  map: any,
  lat: number,
  lng: number,
  swellHeight: number,
  swellPeriod: number,
  swellDirection: number
): any {
  const swellFt = metersToFeet(swellHeight);
  const color = getIntensityColor(swellFt, 'swell');
  const size = 22 + Math.min(swellHeight * 10, 26); // compact circle marker
  
  const icon = L.divIcon({
    className: 'swell-arrow-icon',
    html: `
      <div style="width: ${size}px; height: ${size}px;">
        ${createSwellSVG(color, swellPeriod, size)}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });

  const marker = L.marker([lat, lng], { icon });
  const popup = `
    <div style="text-align: center;">
      <strong>Swell</strong><br/>
      ${swellFt.toFixed(1)} ft @ ${swellPeriod.toFixed(0)}s<br/>
      ${degreesToCardinal(swellDirection)}
    </div>
  `;
  marker.bindPopup(popup);
  
  return marker;
}

/**
 * Creates a grid of condition markers around a center point
 */
export async function createConditionsGrid(
  centerLat: number,
  centerLng: number,
  gridSize: number = 3,
  spacing: number = 0.1
): Promise<{ wind: any[], swell: any[] }> {
  const windMarkers: any[] = [];
  const swellMarkers: any[] = [];
  const offset = Math.floor(gridSize / 2);
  
  // Small helper to offset a lat/lng by a bearing (deg) and a tiny distance (deg)
  const offsetByBearing = (lat: number, lng: number, bearingDeg: number, distDeg: number) => {
    const rad = (bearingDeg * Math.PI) / 180;
    const dLat = distDeg * Math.cos(rad);
    const dLng = (distDeg * Math.sin(rad)) / Math.max(Math.cos((lat * Math.PI) / 180), 0.000001);
    return { lat: lat + dLat, lng: lng + dLng };
  };

  // Cap maximum number of points and fetch in parallel so loading is fast
  const MAX_POINTS = 25;
  const stride = Math.max(1, Math.ceil(gridSize / Math.sqrt(MAX_POINTS)));
  const points: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < gridSize; i += stride) {
    for (let j = 0; j < gridSize; j += stride) {
      const lat = centerLat + (i - offset) * spacing;
      const lng = centerLng + (j - offset) * spacing;
      points.push({ lat, lng });
    }
  }

  const results = await Promise.allSettled(points.map(async ({ lat, lng }) => {
    const conditions = await fetchWithCache(lat, lng);
    if (!conditions) return null;
    const baseNudge = Math.min(spacing * 0.25, 0.04);
    const swellBack = offsetByBearing(lat, lng, (conditions.swellDirection ?? 0) + 180, baseNudge);
    const windFwd = offsetByBearing(lat, lng, (conditions.windDirection ?? 0), baseNudge * 0.6);

    const windMarker = createWindArrow(null, windFwd.lat, windFwd.lng, conditions.windSpeed, conditions.windDirection);

    let swellMarker: any | null = null;
    if ((conditions.swellHeight ?? 0) > 0.05 || (conditions.waveHeight ?? 0) > 0.1) {
      swellMarker = createSwellArrow(null, swellBack.lat, swellBack.lng, conditions.swellHeight, conditions.swellPeriod, conditions.swellDirection);
    }
    return { windMarker, swellMarker };
  }));

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      windMarkers.push(r.value.windMarker);
      if (r.value.swellMarker) swellMarkers.push(r.value.swellMarker);
    }
  }

  return { wind: windMarkers, swell: swellMarkers };
}

/** Refresh existing layer groups according to current zoom */
export async function refreshConditionsOverlays(
  map: any,
  windLayer: any,
  swellLayer: any
): Promise<void> {
  const center = map.getCenter();
  const { gridSize, spacing } = gridParamsForZoom(map.getZoom(), center.lat);
  const { wind, swell } = await createConditionsGrid(center.lat, center.lng, gridSize, spacing);
  windLayer.clearLayers();
  swellLayer.clearLayers();
  wind.forEach((m) => windLayer.addLayer(m));
  swell.forEach((m) => swellLayer.addLayer(m));
}

/**
 * Creates a legend control for Leaflet
 */
export function createLegend(type: 'wind' | 'swell'): any {
  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'map-legend');
    
    if (type === 'wind') {
      div.innerHTML = `
        <div class="legend-title">Wind (mph)</div>
        <div class="legend-item">Black circle shows speed</div>
        <div class="legend-item"><span style="background: #ffffff;"></span> Normal (≤ 12)</div>
        <div class="legend-item"><span style="background: #fde047;"></span> Strong (13–18)</div>
        <div class="legend-item"><span style="background: #ef4444;"></span> Too strong (19+)</div>
      `;
    } else {
      div.innerHTML = `
        <div class="legend-title">Swell heat (ft) • Period text</div>
        <div class="legend-item"><span style="background: #c4b5fd;"></span> 0-2 ft</div>
        <div class="legend-item"><span style="background: #a78bfa;"></span> 2-4 ft</div>
        <div class="legend-item"><span style="background: #8b5cf6;"></span> 4-6 ft</div>
        <div class="legend-item"><span style="background: #7c3aed;"></span> 6-10 ft</div>
        <div class="legend-item"><span style="background: #6d28d9;"></span> 10+ ft</div>
      `;
    }
    
    return div;
  };

  return legend;
}

/**
 * Creates layer control for toggling overlays
 */
export function addLayerControls(
  map: any,
  windLayer: any,
  swellLayer: any,
  windLegend: any,
  swellLegend: any
): void {
  // Custom control for toggling layers
  const layerControl = L.control({ position: 'topright' });

  layerControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'layer-control');
    div.innerHTML = `
      <div class="layer-control-content">
        <div class="layer-toggle">
          <label>
            <input type="checkbox" id="toggle-wind" checked>
            <span class="legend-dot wind"></span>
            <span class="toggle-label">Wind</span>
          </label>
        </div>
        <div class="layer-toggle">
          <label>
            <input type="checkbox" id="toggle-swell" checked>
            <span class="legend-dot swell"></span>
            <span class="toggle-label">Swell</span>
          </label>
        </div>
      </div>
    `;
    
    // Prevent map interactions when clicking control
    L.DomEvent.disableClickPropagation(div);
    
    return div;
  };

  layerControl.addTo(map);

  // Add event listeners after control is added to DOM
  setTimeout(() => {
    const windToggle = document.getElementById('toggle-wind') as HTMLInputElement;
    const swellToggle = document.getElementById('toggle-swell') as HTMLInputElement;

    if (windToggle) {
      windToggle.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
          windLayer.addTo(map);
          windLegend.addTo(map);
        } else {
          map.removeLayer(windLayer);
          map.removeControl(windLegend);
        }
      });
    }

    if (swellToggle) {
      swellToggle.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
          swellLayer.addTo(map);
          swellLegend.addTo(map);
        } else {
          map.removeLayer(swellLayer);
          map.removeControl(swellLegend);
        }
      });
    }
  }, 100);
}

