/**
 * Map overlay utilities for visualizing marine conditions
 */

import { fetchMarineConditions, degreesToCardinal, metersToFeet } from './marine-weather';
import type { MarineConditions } from './marine-weather';

declare const L: any;

/**
 * Creates an arrow SVG for wind/swell direction
 */
function createArrowSVG(color: string, size: number): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L12 18M12 2L8 6M12 2L16 6" 
            stroke="${color}" 
            stroke-width="2" 
            fill="none" 
            stroke-linecap="round" 
            stroke-linejoin="round"/>
      <circle cx="12" cy="20" r="2" fill="${color}"/>
    </svg>
  `;
}

/**
 * Gets color based on intensity
 */
export function getIntensityColor(value: number, type: 'swell' | 'wind'): string {
  if (type === 'swell') {
    // Swell height in feet
    if (value < 2) return '#3b82f6'; // blue - small
    if (value < 4) return '#22c55e'; // green - good
    if (value < 6) return '#eab308'; // yellow - medium
    if (value < 10) return '#f97316'; // orange - big
    return '#ef4444'; // red - huge
  } else {
    // Wind speed in mph
    if (value < 5) return '#22c55e'; // green - calm
    if (value < 10) return '#3b82f6'; // blue - light
    if (value < 15) return '#eab308'; // yellow - moderate
    if (value < 20) return '#f97316'; // orange - strong
    return '#ef4444'; // red - very strong
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
  const color = getIntensityColor(windMph, 'wind');
  const size = 30 + Math.min(windSpeed * 2, 40); // Scale size by wind speed
  
  const icon = L.divIcon({
    className: 'wind-arrow-icon',
    html: `
      <div style="transform: rotate(${windDirection}deg); width: ${size}px; height: ${size}px;">
        ${createArrowSVG(color, size)}
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
  const size = 30 + Math.min(swellHeight * 15, 50); // Scale size by swell height
  
  const icon = L.divIcon({
    className: 'swell-arrow-icon',
    html: `
      <div style="transform: rotate(${swellDirection}deg); width: ${size}px; height: ${size}px;">
        ${createArrowSVG(color, size)}
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

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat + (i - offset) * spacing;
      const lng = centerLng + (j - offset) * spacing;

      try {
        const conditions = await fetchMarineConditions(lat, lng);
        if (!conditions) continue;

        // Create markers but don't add to map yet
        const windMarker = createWindArrow(
          null,
          lat,
          lng,
          conditions.windSpeed,
          conditions.windDirection
        );
        windMarkers.push(windMarker);

        const swellMarker = createSwellArrow(
          null,
          lat,
          lng,
          conditions.swellHeight,
          conditions.swellPeriod,
          conditions.swellDirection
        );
        swellMarkers.push(swellMarker);
      } catch (error) {
        console.error(`Failed to fetch conditions for ${lat}, ${lng}:`, error);
      }
    }
  }

  return { wind: windMarkers, swell: swellMarkers };
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
        <div class="legend-title">Wind Speed (mph)</div>
        <div class="legend-item"><span style="background: #22c55e;"></span> 0-5 Calm</div>
        <div class="legend-item"><span style="background: #3b82f6;"></span> 5-10 Light</div>
        <div class="legend-item"><span style="background: #eab308;"></span> 10-15 Moderate</div>
        <div class="legend-item"><span style="background: #f97316;"></span> 15-20 Strong</div>
        <div class="legend-item"><span style="background: #ef4444;"></span> 20+ Very Strong</div>
      `;
    } else {
      div.innerHTML = `
        <div class="legend-title">Swell Height (ft)</div>
        <div class="legend-item"><span style="background: #3b82f6;"></span> 0-2 Small</div>
        <div class="legend-item"><span style="background: #22c55e;"></span> 2-4 Good</div>
        <div class="legend-item"><span style="background: #eab308;"></span> 4-6 Medium</div>
        <div class="legend-item"><span style="background: #f97316;"></span> 6-10 Big</div>
        <div class="legend-item"><span style="background: #ef4444;"></span> 10+ Huge</div>
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
            <span class="toggle-label">Wind</span>
          </label>
        </div>
        <div class="layer-toggle">
          <label>
            <input type="checkbox" id="toggle-swell" checked>
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

