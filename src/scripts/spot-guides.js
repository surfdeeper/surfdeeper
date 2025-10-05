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

function createPopupContent(spot, marker, isDragging = false) {
  const position = marker.getLatLng();
  const lat = position.lat.toFixed(4);
  const lng = position.lng.toFixed(4);
  
  if (isDragging) {
    return `
      <div class="marker-popup">
        <b>${spot.title}</b>
        <div class="coordinates">
          <strong>Latitude:</strong> ${lat}<br/>
          <strong>Longitude:</strong> ${lng}
        </div>
        <div class="popup-actions">
          <button class="done-dragging-btn" data-slug="${spot.slug}">Done - Show Instructions</button>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="marker-popup">
      <b>${spot.title}</b>
      ${spot.description ? `<br/>${spot.description}` : ''}
      <div class="popup-actions">
        <a href="/spots/${spot.slug}" class="view-spot-link">View Spot →</a>
        <a href="#" class="edit-location-link" data-slug="${spot.slug}">📍 Pin in wrong location?</a>
      </div>
    </div>
  `;
}

function showContributionInstructions(spot, newLat, newLng) {
  const modal = document.createElement('div');
  modal.className = 'contribution-modal';
  modal.innerHTML = `
    <div class="contribution-modal-content">
      <h2>Update ${spot.title} Coordinates</h2>
      <p>To contribute this location correction:</p>
      <ol>
        <li>Go to the <a href="https://github.com/surfdeeper/surfdeeper/blob/main/src/content/spots/${spot.slug}.md" target="_blank">spot file on GitHub</a></li>
        <li>Click the pencil icon to edit</li>
        <li>Update the frontmatter coordinates to:</li>
      </ol>
      <div class="code-block">
latitude: ${newLat}<br/>
longitude: ${newLng}
      </div>
      <p>Then submit a pull request with your changes!</p>
      <p>Or visit our <a href="/contribute">contribution guide</a> for more help.</p>
      <button class="close-modal-btn">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeBtn = modal.querySelector('.close-modal-btn');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
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
      const popup = createPopupContent(spot, marker, false);
      marker.bindPopup(popup);
      
      // Store spot data on marker for later use
      marker.spotData = spot;
      
      // Listen for popup open events to attach event listeners
      marker.on('popupopen', () => {
        const editLink = document.querySelector(`.edit-location-link[data-slug="${spot.slug}"]`);
        const doneBtn = document.querySelector(`.done-dragging-btn[data-slug="${spot.slug}"]`);
        
        if (editLink) {
          editLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Enable dragging
            marker.dragging.enable();
            // Prevent popup from closing on drag
            marker.getPopup().options.closeOnClick = false;
            marker.getPopup().options.autoClose = false;
            marker.getPopup().options.closeButton = false;
            // Update popup to show coordinates
            marker.setPopupContent(createPopupContent(spot, marker, true));
            // Ensure popup stays open
            if (!marker.isPopupOpen()) {
              marker.openPopup();
            }
          });
        }
        
        if (doneBtn) {
          doneBtn.addEventListener('click', () => {
            const position = marker.getLatLng();
            showContributionInstructions(
              spot,
              position.lat.toFixed(4),
              position.lng.toFixed(4)
            );
            // Disable dragging
            marker.dragging.disable();
            // Restore normal popup behavior
            marker.getPopup().options.closeOnClick = true;
            marker.getPopup().options.autoClose = true;
            marker.getPopup().options.closeButton = true;
            // Reset popup
            marker.setPopupContent(createPopupContent(spot, marker, false));
            // Close the popup since they're done
            marker.closePopup();
          });
        }
      });
      
      // Update coordinates in popup while dragging
      marker.on('drag', () => {
        if (marker.isPopupOpen()) {
          marker.setPopupContent(createPopupContent(spot, marker, true));
        }
      });
      
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


