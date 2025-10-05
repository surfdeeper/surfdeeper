/**
 * Map configuration constants
 */
export const MAP_DEFAULTS = {
  CENTER: [37.44, -122.36] as [number, number],
  ZOOM: 9,
  SPOT_ZOOM: 13,
};

/**
 * Leaflet CDN URLs
 */
export const LEAFLET = {
  CSS: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  JS: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
};

/**
 * Theme color constants
 */
export const THEME_COLORS = {
  PRIMARY: '#00ff88',
  PRIMARY_DARK: '#00cc6a',
  BACKGROUND: '#0f172a',
  SURFACE: '#1e293b',
  BORDER: '#334155',
  TEXT_SECONDARY: '#cbd5e1',
  TEXT_MUTED: '#94a3b8',
};

/**
 * Map tile themes configuration
 */
export interface MapTheme {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
}

export const MAP_THEMES: Record<string, MapTheme> = {
  'esri-imagery': {
    id: 'esri-imagery',
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
  },
  'esri-ocean': {
    id: 'esri-ocean',
    name: 'Esri Ocean',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
    maxZoom: 13,
  },
  'esri-natgeo': {
    id: 'esri-natgeo',
    name: 'Esri NatGeo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
    maxZoom: 16,
  },
};

// Default themes for different map types
export const DEFAULT_THEME_HOMEPAGE = 'esri-ocean';
export const DEFAULT_THEME_SPOT = 'esri-ocean';
export const DEFAULT_THEME_FULL_MAP = 'esri-ocean';

