/**
 * Map theme switcher utility
 */

import { MAP_THEMES } from "../config/map-constants";
import type { MapTheme } from "../config/map-constants";
import { changeMapTheme, getStoredTheme } from "./leaflet-setup";

/**
 * Creates a theme switcher control for a Leaflet map
 * @param map The Leaflet map instance
 * @param defaultTheme The default theme ID to use
 * @returns The control element
 */
export function createThemeSwitcher(
  map: any,
  defaultTheme: string,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "leaflet-theme-switcher leaflet-bar leaflet-control";
  container.style.cssText =
    "background: var(--color-surface-secondary); border: 2px solid var(--color-border); border-radius: 4px; padding: 0.5rem;";

  const select = document.createElement("select");
  select.className = "theme-select";
  select.style.cssText = `
    background: var(--color-surface-deep);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    font-family: inherit;
  `;

  // Get current theme from localStorage or use default
  const currentTheme = getStoredTheme(defaultTheme);

  // Add theme options
  Object.values(MAP_THEMES).forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    option.selected = theme.id === currentTheme;
    select.appendChild(option);
  });

  // Handle theme change
  select.addEventListener("change", (e) => {
    const themeId = (e.target as HTMLSelectElement).value;
    const theme = MAP_THEMES[themeId];
    if (theme) {
      changeMapTheme(map, theme);
    }
  });

  // Add hover effect
  select.addEventListener("mouseenter", () => {
    select.style.borderColor = "var(--color-border-accent)";
  });

  select.addEventListener("mouseleave", () => {
    select.style.borderColor = "var(--color-border)";
  });

  container.appendChild(select);
  return container;
}

/**
 * Adds a theme switcher control to a Leaflet map
 * @param map The Leaflet map instance
 * @param defaultTheme The default theme ID to use
 * @param position The position on the map (default: 'topright')
 */
export function addThemeSwitcherToMap(
  map: any,
  defaultTheme: string,
  position: "topleft" | "topright" | "bottomleft" | "bottomright" = "topright",
): void {
  if (!map || typeof window === "undefined") return;

  const L = (window as any).L;

  // Create a custom Leaflet control
  const ThemeSwitcherControl = L.Control.extend({
    options: {
      position: position,
    },

    onAdd: function (mapInstance: any) {
      return createThemeSwitcher(mapInstance, defaultTheme);
    },
  });

  // Add the control to the map
  map.addControl(new ThemeSwitcherControl());
}

/**
 * Gets the theme configuration by ID
 * @param themeId The theme ID
 * @param defaultTheme The default theme ID if the requested one is not found
 * @returns The theme configuration
 */
export function getTheme(themeId: string, defaultTheme: string): MapTheme {
  return (
    MAP_THEMES[themeId] || MAP_THEMES[defaultTheme] || MAP_THEMES["esri-ocean"]
  );
}
