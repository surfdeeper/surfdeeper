function getSpotsFromJson() {
  const dataElement = document.getElementById('spots-data');
  if (!dataElement) return [];
  try {
    const json = dataElement.textContent || '[]';
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse spots JSON:', error);
    return [];
  }
}

function initMap() {
  if (!window.L) {
    requestAnimationFrame(initMap);
    return;
  }

  const spots = getSpotsFromJson();
  const map = L.map('map');
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
  tiles.addTo(map);

  const markers = [];
  for (const spot of spots) {
    if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
      const marker = L.marker([spot.latitude, spot.longitude]).addTo(map);
      const popup = `<b>${spot.title}</b>${spot.description ? `<br/>${spot.description}` : ''}`;
      marker.bindPopup(popup);
      markers.push(marker);
    }
  }

  // Set view to show entire Santa Cruz to Bolinas coastline
  // Center approximately between Santa Cruz (36.97°N, -122.03°W) and Bolinas (37.91°N, -122.69°W)
  map.setView([37.44, -122.36], 9);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initMap();
} else {
  document.addEventListener('DOMContentLoaded', initMap);
}


