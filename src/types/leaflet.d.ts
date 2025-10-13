// Minimal Leaflet ambient types to replace explicit any usages
// This is intentionally tiny and can be expanded later or replaced with @types/leaflet

declare namespace L {
  interface LatLng {
    lat: number;
    lng: number;
  }

  interface PopupOptions {
    closeOnClick?: boolean;
    autoClose?: boolean;
    closeButton?: boolean;
  }

  interface Popup {
    options: PopupOptions;
  }

  interface Dragging {
    enable(): void;
    disable(): void;
  }

  interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number | null, number | null] | null;
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
  }

  interface DivIcon {
    // marker icon object
  }

  function divIcon(options?: DivIconOptions): DivIcon;

  interface Marker {
    bindPopup(html: string): this;
    setPopupContent(html: string): this;
    openPopup(): this;
    closePopup(): this;
    isPopupOpen(): boolean;
    getLatLng(): LatLng;
    getPopup(): Popup;
    on(event: "popupopen" | "drag", handler: () => void): this;
    dragging: Dragging;
    addTo(map: Map): this;
  }

  interface TileLayer {
    addTo(map: Map): this;
  }

  interface MapOptions {
    scrollWheelZoom?: boolean;
    dragging?: boolean;
    zoomControl?: boolean;
    backgroundColor?: string;
  }

  interface Map {
    setView(center: [number, number], zoom: number): this;
    addControl(control: Control): this;
    removeLayer(layer: TileLayer): this;
    invalidateSize(): void;
    _tileLayer?: TileLayer;
  }

  interface ControlOptions {
    position?: "topleft" | "topright" | "bottomleft" | "bottomright";
  }

  interface Control {
    options: ControlOptions;
  }

  function marker(
    latlng: [number, number],
    options?: { icon?: DivIcon },
  ): Marker;
  function tileLayer(
    url: string,
    options: {
      attribution?: string;
      maxZoom?: number;
      className?: string;
      subdomains?: string[];
    },
  ): TileLayer;
  function map(id: string, options?: MapOptions): Map;

  namespace Control {
    function extend(def: {
      options?: ControlOptions;
      onAdd(map: Map): HTMLElement;
    }): new () => Control;
  }
}

interface Window {
  L: typeof L;
}
