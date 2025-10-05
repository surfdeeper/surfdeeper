// Map preview logic extracted from index.astro
import { DEFAULT_THEME_HOMEPAGE } from '../config/map-constants';
import { getStoredTheme } from '../utils/leaflet-setup';
import { getTheme, addThemeSwitcherToMap } from '../utils/map-theme-switcher';

interface SpotData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  slug: string;
}

declare global {
  interface Window {
    L: any;
  }
}

export function initMapPreview() {
  if (!window.L) {
    requestAnimationFrame(initMapPreview);
    return;
  }

  const mapContainer = document.getElementById('map-preview');
  if (!mapContainer) return;
  
  const dataElement = document.getElementById('spots-data');
  if (!dataElement) return;
  
  let spots: SpotData[] = [];
  try {
    const json = dataElement.textContent || '[]';
    spots = JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse spots JSON:', error);
    return;
  }

  // Get the user's preferred theme or use default
  const currentThemeId = getStoredTheme(DEFAULT_THEME_HOMEPAGE);
  const theme = getTheme(currentThemeId, DEFAULT_THEME_HOMEPAGE);

  const L = window.L;
  
  // Initialize map after a brief delay to ensure container has proper dimensions
  setTimeout(() => {
    const map = L.map('map-preview', {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
      backgroundColor: '#111a22'
    });
    
    // Add tiles with the selected theme
    const tiles = L.tileLayer(theme.url, {
      attribution: theme.attribution,
      maxZoom: theme.maxZoom,
      className: 'map-tiles',
      ...(theme.subdomains ? { subdomains: theme.subdomains } : {})
    });
    tiles.addTo(map);
    map._tileLayer = tiles;

    // Add theme switcher control
    addThemeSwitcherToMap(map, DEFAULT_THEME_HOMEPAGE, 'topright');

    // Sort spots alphabetically for consistent numbering
    const sortedSpots = [...spots].sort((a, b) => a.title.localeCompare(b.title));
    
    sortedSpots.forEach((spot, index) => {
      if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
        const spotNumber = index + 1;
        
        // Create numbered marker with floating label
        const icon = L.divIcon({
          className: 'numbered-marker-with-label-homepage',
          html: `
            <div class="marker-with-label-homepage">
              <div class="marker-badge-homepage">${spotNumber}</div>
              <div class="marker-label-homepage">${spot.title}</div>
              <div class="marker-pointer-homepage"></div>
            </div>
          `,
          iconSize: [null, null],
          iconAnchor: [18, 32],
          popupAnchor: [0, -32]
        });
        
        const marker = L.marker([spot.latitude, spot.longitude], { icon }).addTo(map);
        const popup = `
          <div style="font-family: inherit;">
            <b>${spot.title}</b>
            ${spot.description ? `<br/>${spot.description}` : ''}
            <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid rgba(254, 188, 8, 0.2);">
              <a href="/spots/${spot.slug}" style="display: inline-block; color: #111a22; background-color: #febc08; font-size: 0.95rem; font-weight: 600; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; text-align: center;">View Spot →</a>
            </div>
          </div>
        `;
        marker.bindPopup(popup);
        (marker as any).spotData = spot;
        (marker as any).spotNumber = spotNumber;
      }
    });

    // Set view to show entire Santa Cruz to Bolinas coastline
    map.setView([37.44, -122.36], 9);
    
    // Force map to recalculate size after initialization
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, 50); // End of setTimeout for map initialization
}

// Initialize map preview
export function initializeMapPreview() {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initMapPreview();
  } else {
    document.addEventListener('DOMContentLoaded', initMapPreview);
  }
}