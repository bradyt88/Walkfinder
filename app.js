const STORAGE_KEYS = {
  pendingRoute: 'walkfinder.pendingRoute',
  savedWalks: 'walkfinder.savedWalks',
  lastPublished: 'walkfinder.lastPublished'
};

const DEFAULT_ROUTE_IMAGE = 'assets/walks/pendle.jpg';

const discoverWalks = [
  {
    id: 'pendle-view-loop',
    name: 'Pendle View Loop',
    location: 'Pendle, Lancashire',
    category: 'hills',
    distance: '4.8 mi',
    difficulty: 'Moderate',
    time: '1h 40m',
    rating: '4.8',
    reviews: '162',
    image: 'assets/walks/pendle.jpg',
    coverPhoto: 'assets/walks/pendle.jpg',
    tags: ['Hills', 'Views', 'Moderate'],
    description: 'A long ridge walk with broad views across the valley and gentle rolling climbs.',
    advice: 'Carry water and expect a few uneven patches on the higher sections.',
    coordinates: [53.843, -2.401],
    routeType: 'Loop',
    source: 'Demo walk'
  },
  {
    id: 'river-calder-walk',
    name: 'River Calder Walk',
    location: 'River Calder, Lancashire',
    category: 'water',
    distance: '3.2 mi',
    difficulty: 'Easy',
    time: '1h 05m',
    rating: '4.7',
    reviews: '98',
    image: 'assets/walks/calder.jpg',
    coverPhoto: 'assets/walks/calder.jpg',
    tags: ['Water', 'Family', 'Easy'],
    description: 'A flexible riverside walk with easy gradients and plenty of places to pause.',
    advice: 'Great for a relaxed afternoon, with parking and cafés nearby.',
    coordinates: [53.755, -2.187],
    routeType: 'Out & Back',
    source: 'Demo walk'
  },
  {
    id: 'hidden-woodland-path',
    name: 'Hidden Woodland Path',
    location: 'Lancashire woodland',
    category: 'woodland',
    distance: '2.6 mi',
    difficulty: 'Easy',
    time: '55m',
    rating: '4.9',
    reviews: '143',
    image: 'assets/walks/woodland.jpg',
    coverPhoto: 'assets/walks/woodland.jpg',
    tags: ['Woodland', 'Photography', 'Easy'],
    description: 'A quiet forest path with dappled light, shade and a peaceful stream crossing.',
    advice: 'Take the lower loop if you want a slower and more shaded route.',
    coordinates: [53.735, -2.407],
    routeType: 'Loop',
    source: 'Demo walk'
  }
];

function getCurrentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function navigate(page) {
  window.location.href = page;
}

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored);
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSavedWalks() {
  const stored = readStorage(STORAGE_KEYS.savedWalks, null);
  if (stored && Array.isArray(stored) && stored.length) {
    return stored;
  }

  const seededWalks = discoverWalks.map((walk, index) => ({
    ...walk,
    id: `saved-demo-${index + 1}`,
    visibility: 'Public',
    savedAt: new Date().toISOString()
  }));

  writeStorage(STORAGE_KEYS.savedWalks, seededWalks);
  return seededWalks;
}

function saveWalks(walks) {
  writeStorage(STORAGE_KEYS.savedWalks, walks);
}

function getPendingRoute() {
  return readStorage(STORAGE_KEYS.pendingRoute, null);
}

function savePendingRoute(route) {
  writeStorage(STORAGE_KEYS.pendingRoute, route);
}

function clearPendingRoute() {
  localStorage.removeItem(STORAGE_KEYS.pendingRoute);
}

function setLastPublished(walk) {
  writeStorage(STORAGE_KEYS.lastPublished, walk);
}

function readWalkParam() {
  return new URLSearchParams(window.location.search).get('walk') || '';
}

function showInlineMessage(element, message, isError = false) {
  if (!element) return;
  element.hidden = false;
  element.textContent = message;
  element.classList.toggle('error', !!isError);
}

function hideInlineMessage(element) {
  if (!element) return;
  element.hidden = true;
  element.textContent = '';
  element.classList.remove('error');
}

function setActiveNav() {
  const currentPage = getCurrentPage();
  document.querySelectorAll('.nav-item').forEach((button) => {
    const active = button.dataset.page === currentPage;
    button.classList.toggle('active', active);
  });
}

function bindSharedControls() {
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      navigate(button.dataset.page);
    });
  });

  document.querySelectorAll('[data-back]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.back === 'history') {
        window.history.back();
        return;
      }
      navigate(button.dataset.back);
    });
  });
}

function getWalkByName(name) {
  return discoverWalks.find((walk) => walk.name === name) || null;
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function haversineMiles(start, end) {
  if (!start || !end) return 0;

  const toRadians = (value) => (value * Math.PI) / 180;
  const lat1 = toRadians(start[0]);
  const lat2 = toRadians(end[0]);
  const deltaLat = toRadians(end[0] - start[0]);
  const deltaLng = toRadians(end[1] - start[1]);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadiusMiles = 3958.8;

  return earthRadiusMiles * c;
}

function totalDistanceMiles(points) {
  if (!Array.isArray(points) || points.length < 2) return 0;

  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const distance = haversineMiles(points[index - 1], points[index]);
    if (Number.isFinite(distance) && distance > 0 && distance < 5) {
      total += distance;
    }
  }

  return total;
}

function averageSpeedMph(distanceMiles, seconds) {
  const timeHours = Math.max(seconds, 1) / 3600;
  return distanceMiles / timeHours;
}

function renderWalkCards(walks) {
  const walkList = document.getElementById('walkList');
  if (!walkList) return;

  walkList.innerHTML = '';

  const savedWalks = getSavedWalks();

  walks.forEach((walk) => {
    const card = document.createElement('article');
    card.className = 'walk-card';
    card.dataset.name = walk.name;
    card.dataset.location = walk.location;
    card.dataset.category = walk.category;

    const isSaved = savedWalks.some((item) => item.name === walk.name);
    const cardImage = walk.coverPhoto || walk.image || DEFAULT_ROUTE_IMAGE;

    card.innerHTML = `
      <div class="walk-media">
        <img src="${cardImage}" alt="${walk.name}">
        <div class="walk-distance">${walk.distance}</div>
        <button class="card-save ${isSaved ? 'saved' : ''}" type="button" data-name="${walk.name}" aria-label="Save ${walk.name}">${isSaved ? 'Saved' : 'Save'}</button>
      </div>
      <div class="walk-content">
        <div class="walk-header-row">
          <div>
            <h3>${walk.name}</h3>
            <p class="walk-location">${walk.location}</p>
          </div>
          <div class="walk-rating">★ ${walk.rating}</div>
        </div>
        <div class="walk-stats">
          <span>${walk.time}</span>
          <span>${walk.difficulty}</span>
          <span>${walk.reviews} reviews</span>
        </div>
        <div class="walk-tags">
          ${walk.tags.map((tag) => `<span>${tag}</span>`).join('')}
        </div>
      </div>
    `;

    card.addEventListener('click', (event) => {
      if (event.target.closest('.card-save')) return;
      navigate(`route-details.html?walk=${encodeURIComponent(walk.name)}`);
    });

    card.querySelector('.card-save').addEventListener('click', (event) => {
      event.stopPropagation();
      toggleSavedWalk(walk);
      renderWalkCards(currentFilteredWalks || walks);
    });

    walkList.appendChild(card);
  });
}

let currentFilteredWalks = [...discoverWalks];

function toggleSavedWalk(walk) {
  const savedWalks = getSavedWalks();
  const exists = savedWalks.some((item) => item.name === walk.name);

  if (exists) {
    const filtered = savedWalks.filter((item) => item.name !== walk.name);
    saveWalks(filtered);
    return;
  }

  const normalized = {
    ...walk,
    id: `saved-${Date.now()}`,
    visibility: 'Public',
    routeType: walk.routeType || (walk.category === 'water' ? 'Out & Back' : 'Loop'),
    source: walk.source || 'Demo walk',
    savedAt: new Date().toISOString(),
    photos: walk.photos || [],
    coverPhoto: walk.coverPhoto || walk.image || DEFAULT_ROUTE_IMAGE
  };

  saveWalks([normalized, ...savedWalks]);
}

function initializeDiscoverPage() {
  const searchInput = document.getElementById('searchInput');
  const emptyState = document.getElementById('emptyState');
  const clearFiltersButton = document.getElementById('clearFilters');
  const categoryButtons = [...document.querySelectorAll('.category-chip')];
  const discoverMapTarget = document.getElementById('discoverMap');

  if (discoverMapTarget && window.WalkfinderMaps && window.L) {
    const map = window.WalkfinderMaps.createMap(discoverMapTarget, {
      center: [53.805, -2.86],
      zoom: 11,
      zoomControl: true,
      attributionControl: true
    });

    if (map) {
      const bounds = [];
      discoverWalks.forEach((walk) => {
        if (Array.isArray(walk.coordinates)) {
          bounds.push(walk.coordinates);
          const marker = window.WalkfinderMaps.createMarker(walk.coordinates, {
            title: walk.name
          });

          if (marker) {
            marker.bindPopup(`
              <div style="font-family: Arial, sans-serif; color: #07110d;">
                <strong>${walk.name}</strong><br>
                ${walk.location}
              </div>
            `);
            marker.addTo(map);
          }
        }
      });

      if (bounds.length) {
        map.fitBounds(bounds, { padding: [28, 28] });
      }
    }
  }

  let activeCategory = 'all';

  function applyFilters() {
    const searchTerm = (searchInput?.value || '').trim().toLowerCase();
    const filtered = discoverWalks.filter((walk) => {
      const matchesCategory = activeCategory === 'all' || walk.category === activeCategory;
      const matchesSearch = !searchTerm || walk.name.toLowerCase().includes(searchTerm) || walk.location.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });

    currentFilteredWalks = filtered;
    renderWalkCards(filtered);

    if (emptyState) {
      emptyState.hidden = filtered.length > 0;
    }
  }

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      categoryButtons.forEach((item) => item.classList.toggle('active', item === button));
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', applyFilters);

  clearFiltersButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    activeCategory = 'all';
    categoryButtons.forEach((button) => button.classList.toggle('active', button.dataset.category === 'all'));
    applyFilters();
  });

  applyFilters();
}

function initializeSavedPage() {
  const savedList = document.getElementById('savedList');
  const savedEmpty = document.getElementById('savedEmpty');

  if (!savedList || !savedEmpty) return;

  const savedWalks = getSavedWalks();
  savedList.innerHTML = '';

  if (!savedWalks.length) {
    savedEmpty.hidden = false;
    return;
  }

  savedEmpty.hidden = true;

  savedWalks.forEach((walk) => {
    const card = document.createElement('article');
    card.className = 'saved-card';
    card.innerHTML = `
      <div class="saved-media">
        <img src="${walk.coverPhoto || walk.image || DEFAULT_ROUTE_IMAGE}" alt="${walk.name}">
      </div>
      <div class="saved-copy">
        <div class="saved-header">
          <h3>${walk.name}</h3>
          <span class="saved-pill">${walk.visibility || 'Public'}</span>
        </div>
        <div class="saved-meta">
          ${walk.distance || '—'} · ${walk.difficulty || '—'}<br>
          ${walk.routeType || 'Walk'} · ${walk.time || walk.duration || '—'}
        </div>
        <div class="saved-tags">
          ${(walk.tags || []).slice(0, 3).map((tag) => `<span>${tag}</span>`).join('')}
        </div>
      </div>
    `;
    savedList.appendChild(card);
  });
}

function initializeRouteDetailsPage() {
  const nameInput = document.getElementById('name');
  const descriptionInput = document.getElementById('description');
  const difficultyInput = document.getElementById('difficulty');
  const routeTypeInput = document.getElementById('routeType');
  const adviceInput = document.getElementById('advice');
  const routeStatusInput = document.getElementById('routeStatus');
  const visibilityInput = document.getElementById('visibility');
  const formMessage = document.getElementById('formMessage');
  const nextToPhotos = document.getElementById('nextToPhotos');
  const summaryBox = document.getElementById('routeSummary');
  const cover = document.getElementById('detailCover');

  const walkNameParam = readWalkParam();
  const pendingRoute = getPendingRoute();
  const routeContext = walkNameParam ? getWalkByName(walkNameParam) : null;
  const baseRoute = pendingRoute || routeContext || {
    source: 'Walk',
    distance: '0.00 mi',
    duration: '00:00',
    image: DEFAULT_ROUTE_IMAGE,
    coverPhoto: DEFAULT_ROUTE_IMAGE
  };

  if (nameInput && walkNameParam && !nameInput.value) {
    nameInput.value = walkNameParam;
  }

  const coverPhoto = baseRoute.coverPhoto || baseRoute.image || DEFAULT_ROUTE_IMAGE;

  if (cover) {
    cover.style.backgroundImage = `linear-gradient(rgba(7,17,13,0.18), rgba(7,17,13,0.3)), url('${coverPhoto}')`;
    cover.dataset.image = coverPhoto;
  }

  const routeMethodText = pendingRoute?.recordingMethod === 'gps'
    ? 'Recorded Walk'
    : pendingRoute?.recordingMethod === 'drawn'
      ? 'Drawn Route'
      : ((pendingRoute?.routeType || routeContext?.routeType || 'Walk')).toString();

  if (summaryBox) {
    summaryBox.innerHTML = `
      <div class="summary-grid">
        <div class="summary-item">
          <strong>${baseRoute.distance || '0.00 mi'}</strong>
          <span>Distance</span>
        </div>
        <div class="summary-item">
          <strong>${baseRoute.duration || '00:00'}</strong>
          <span>Time</span>
        </div>
        <div class="summary-item">
          <strong>${routeMethodText}</strong>
          <span>Route</span>
        </div>
      </div>
    `;
  }

  document.querySelectorAll('.tag-button').forEach((button) => {
    button.addEventListener('click', () => {
      button.classList.toggle('active');
    });
  });

  nextToPhotos?.addEventListener('click', () => {
    const name = nameInput?.value.trim() || '';
    if (!name) {
      showInlineMessage(formMessage, 'Give your walk a name first.', true);
      return;
    }

    hideInlineMessage(formMessage);

    const selectedTags = [...document.querySelectorAll('.tag-button.active')].map((button) => button.dataset.tag);

    const updatedPendingRoute = {
      ...(baseRoute || {}),
      name,
      description: descriptionInput?.value.trim() || '',
      difficulty: difficultyInput?.value || 'Moderate',
      routeType: routeTypeInput?.value || baseRoute.routeType || 'Loop',
      tags: selectedTags.length ? selectedTags : ['Local discovery'],
      advice: adviceInput?.value.trim() || '',
      routeStatus: routeStatusInput?.value || 'Community Discovery',
      visibility: visibilityInput?.value || 'Public',
      coverPhoto: cover?.dataset.image || coverPhoto,
      image: cover?.dataset.image || coverPhoto,
      source: pendingRoute?.source || routeContext?.source || 'Walk'
    };

    savePendingRoute(updatedPendingRoute);
    navigate('photos.html');
  });
}

function initializePhotosPage() {
  const coverPreview = document.getElementById('coverPreview');
  const photoInput = document.getElementById('photoInput');
  const photoGrid = document.getElementById('photoGrid');
  const publishButton = document.getElementById('publishButton');
  const photoMessage = document.getElementById('photoMessage');

  const pendingRoute = getPendingRoute();

  if (!pendingRoute) {
    showInlineMessage(photoMessage, 'No route is ready for photos yet. Finish route details first.', true);
    return;
  }

  let uploadedImages = Array.isArray(pendingRoute.photos) ? [...pendingRoute.photos] : [];
  let coverPhoto = pendingRoute.coverPhoto || pendingRoute.image || DEFAULT_ROUTE_IMAGE;

  function persistRouteState() {
    savePendingRoute({
      ...pendingRoute,
      photos: uploadedImages,
      coverPhoto,
      image: coverPhoto
    });
  }

  function renderCover() {
    if (!coverPreview) return;
    coverPreview.style.backgroundImage = `linear-gradient(rgba(7,17,13,0.22), rgba(7,17,13,0.3)), url('${coverPhoto}')`;
  }

  function renderPhotos() {
    if (!photoGrid) return;
    photoGrid.innerHTML = '';

    if (!uploadedImages.length) {
      const placeholder = document.createElement('div');
      placeholder.className = 'empty-state';
      placeholder.style.marginTop = '0';
      placeholder.textContent = 'No photos added yet.';
      photoGrid.appendChild(placeholder);
      return;
    }

    uploadedImages.forEach((image, index) => {
      const card = document.createElement('div');
      card.className = `photo-card ${image === coverPhoto ? 'is-cover' : ''}`;
      card.innerHTML = `
        <img src="${image}" alt="Photo ${index + 1}">
        <div class="photo-actions">
          <button type="button" class="mini-button" data-action="cover" data-index="${index}">${image === coverPhoto ? 'Cover photo' : 'Set as cover'}</button>
          <button type="button" class="mini-button danger" data-action="remove" data-index="${index}">Remove</button>
        </div>
      `;
      photoGrid.appendChild(card);
    });

    photoGrid.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        if (action === 'cover') {
          coverPhoto = uploadedImages[index];
          persistRouteState();
          renderCover();
          renderPhotos();
          return;
        }

        if (action === 'remove') {
          const removedPhoto = uploadedImages[index];
          uploadedImages.splice(index, 1);

          if (uploadedImages.length === 0) {
            coverPhoto = pendingRoute.coverPhoto || pendingRoute.image || DEFAULT_ROUTE_IMAGE;
          } else if (removedPhoto === coverPhoto) {
            coverPhoto = uploadedImages[0];
          }

          persistRouteState();
          renderCover();
          renderPhotos();
        }
      });
    });
  }

  function readFiles(files) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        uploadedImages.unshift(event.target.result);

        if (!coverPhoto || coverPhoto === pendingRoute.image || coverPhoto === DEFAULT_ROUTE_IMAGE) {
          coverPhoto = event.target.result;
        }

        persistRouteState();
        renderPhotos();
        renderCover();
      };
      reader.readAsDataURL(file);
    });
  }

  photoInput?.addEventListener('change', (event) => {
    readFiles(event.target.files);
    event.target.value = '';
  });

  publishButton?.addEventListener('click', () => {
    const routeToPublish = {
      ...(pendingRoute || {}),
      photos: uploadedImages,
      coverPhoto,
      image: coverPhoto,
      publishedAt: new Date().toISOString()
    };

    const savedWalks = getSavedWalks();
    savedWalks.unshift(routeToPublish);
    saveWalks(savedWalks);
    setLastPublished(routeToPublish);
    clearPendingRoute();

    navigate('published.html');
  });

  renderCover();
  renderPhotos();
}

function initializeRecordWalkPage() {
  const startButton = document.getElementById('startButton');
  const pauseButton = document.getElementById('pauseButton');
  const finishButton = document.getElementById('finishButton');
  const secondaryActions = document.getElementById('secondaryActions');
  const status = document.getElementById('statusPill');
  const instruction = document.getElementById('instruction');
  const distance = document.getElementById('distance');
  const timer = document.getElementById('timer');
  const elevation = document.getElementById('elevation');
  const mapContainer = document.getElementById('recordMapContainer');

  if (!startButton || !pauseButton || !finishButton) return;

  const state = {
    map: null,
    routeLayer: null,
    currentMarker: null,
    watchId: null,
    isRecording: false,
    isPaused: false,
    seconds: 0,
    totalDistanceMiles: 0,
    coordinates: [],
    latestPosition: null,
    timerInterval: null,
    gpsStatus: 'READY'
  };

  function updateStatusPill(statusText, modifier = '') {
    if (!status) return;

    const className = ['status-pill'];
    if (modifier) className.push(modifier);
    status.className = className.join(' ');
    status.innerHTML = `<span class="status-dot"></span> ${statusText}`;
  }

  function updateDisplay() {
    if (timer) timer.textContent = formatDuration(state.seconds);
    if (distance) distance.textContent = state.totalDistanceMiles.toFixed(2);
    if (elevation) elevation.textContent = 'Unavailable';
  }

  function attachMap() {
    if (!mapContainer || !window.WalkfinderMaps || !window.L) return;
    if (state.map) return;

    state.map = window.WalkfinderMaps.createMap(mapContainer, {
      center: [53.805, -2.86],
      zoom: 14,
      zoomControl: true,
      attributionControl: true
    });

    state.routeLayer = window.WalkfinderMaps.createPolyline([], {
      color: '#59d68f',
      weight: 5,
      opacity: 1
    });

    state.currentMarker = window.WalkfinderMaps.createCircleMarker([53.805, -2.86], {
      radius: 8,
      color: '#edf5ef',
      fillColor: '#59d68f',
      fillOpacity: 1
    });

    if (state.routeLayer) state.routeLayer.addTo(state.map);
    if (state.currentMarker) state.currentMarker.addTo(state.map);
  }

  function stopTimer() {
    if (state.timerInterval !== null) {
      window.clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function startTimer() {
    if (state.timerInterval !== null) return;

    state.timerInterval = window.setInterval(() => {
      if (!state.isRecording || state.isPaused) return;
      state.seconds += 1;
      updateDisplay();
    }, 1000);
  }

  function clearWatch() {
    if (state.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
    }
  }

  function handleGpsError(error) {
    const messageMap = {
      1: 'Location permission was denied. Allow GPS access to record the walk.',
      2: 'Location is currently unavailable on this device.',
      3: 'Location request timed out. Please try again.',
      default: 'Unable to access GPS right now.'
    };

    stopTimer();
    state.isRecording = false;
    state.isPaused = false;
    state.gpsStatus = 'READY';

    updateStatusPill('GPS Unavailable', 'warning');
    if (instruction) {
      instruction.textContent = messageMap[error?.code] || messageMap.default;
    }

    startButton.disabled = false;
    startButton.textContent = '▶ START WALK';
    pauseButton.disabled = true;
    finishButton.disabled = true;
    secondaryActions?.classList.remove('visible');
  }

  function renderRoute() {
    if (state.routeLayer) {
      state.routeLayer.setLatLngs(state.coordinates);
    }

    if (state.currentMarker && state.latestPosition) {
      state.currentMarker.setLatLng([state.latestPosition.coords.latitude, state.latestPosition.coords.longitude]);
    }
  }

  function updatePosition(position) {
    if (!position || !position.coords) return;

    const nextPoint = [position.coords.latitude, position.coords.longitude];
    const accuracy = position.coords.accuracy || 0;

    state.latestPosition = position;

    if (!state.coordinates.length) {
      state.coordinates.push(nextPoint);
      if (state.map) {
        state.map.setView(nextPoint, Math.max(state.map.getZoom(), 15));
      }
      renderRoute();
    } else {
      const previousPoint = state.coordinates[state.coordinates.length - 1];
      const pointDistance = haversineMiles(previousPoint, nextPoint);

      if (pointDistance > 0.01 && pointDistance < 1.5) {
        state.coordinates.push(nextPoint);
        state.totalDistanceMiles += pointDistance;
      }

      renderRoute();
    }

    state.gpsStatus = accuracy > 60 ? 'GPS WEAK' : 'GPS ACTIVE';
    updateStatusPill(state.gpsStatus === 'GPS WEAK' ? 'GPS WEAK' : 'GPS ACTIVE', state.gpsStatus === 'GPS WEAK' ? 'warning' : 'recording');

    if (instruction) {
      instruction.textContent = state.gpsStatus === 'GPS WEAK'
        ? 'Location accuracy is weak, so your route may be less precise.'
        : 'WalkFinder is recording your walk. Keep moving and your route will update live.';
    }

    updateDisplay();
  }

  function startGpsTracking() {
    if (!navigator.geolocation) {
      handleGpsError({ code: 2 });
      return;
    }

    state.gpsStatus = 'GPS REQUESTING';
    updateStatusPill('GPS REQUESTING', 'warning');
    if (instruction) instruction.textContent = 'Requesting your current location...';

    navigator.geolocation.getCurrentPosition(
      (initialPosition) => {
        updatePosition(initialPosition);
        state.isRecording = true;
        state.isPaused = false;
        state.gpsStatus = 'GPS ACTIVE';
        updateStatusPill('GPS ACTIVE', 'recording');
        if (instruction) instruction.textContent = 'GPS is active. Your route is being tracked live.';

        state.watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!state.isRecording || state.isPaused) return;
            updatePosition(position);
          },
          handleGpsError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );

        startTimer();
        startButton.disabled = true;
        pauseButton.disabled = false;
        finishButton.disabled = false;
        secondaryActions?.classList.add('visible');
      },
      handleGpsError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  function stopTrackingAndContinue() {
    stopTimer();
    clearWatch();

    const pendingRoute = {
      source: 'Recorded walk',
      routeType: 'Recorded walk',
      recordingMethod: 'gps',
      coordinates: state.coordinates,
      distance: `${state.totalDistanceMiles.toFixed(2)} mi`,
      duration: formatDuration(state.seconds),
      averageSpeed: `${averageSpeedMph(state.totalDistanceMiles, state.seconds).toFixed(1)} mph`,
      image: DEFAULT_ROUTE_IMAGE,
      coverPhoto: DEFAULT_ROUTE_IMAGE,
      photos: [],
      date: new Date().toISOString()
    };

    savePendingRoute(pendingRoute);
    navigate('route-details.html?from=record-walk');
  }

  startButton.addEventListener('click', () => {
    attachMap();
    startGpsTracking();
  });

  pauseButton.addEventListener('click', () => {
    if (!state.isRecording) return;

    state.isPaused = !state.isPaused;

    if (state.isPaused) {
      updateStatusPill('PAUSED', 'paused');
      if (instruction) instruction.textContent = 'Your walk is paused. Resume when you are ready.';
      pauseButton.textContent = '▶ Resume';
      return;
    }

    updateStatusPill('GPS ACTIVE', 'recording');
    if (instruction) instruction.textContent = 'GPS is active. Your route is being tracked live.';
    pauseButton.textContent = '⏸ Pause';
  });

  finishButton.addEventListener('click', () => {
    state.isRecording = false;
    state.isPaused = false;
    clearWatch();
    stopTimer();
    updateStatusPill('FINISHED', 'finished');

    if (instruction) {
      instruction.textContent = 'Great walk. Your route is ready to add details and photos.';
    }

    startButton.textContent = '✓ WALK FINISHED';
    startButton.disabled = true;
    pauseButton.disabled = true;
    finishButton.disabled = true;

    stopTrackingAndContinue();
  });

  attachMap();
  updateStatusPill('READY');
  updateDisplay();
}

function initializeDrawRoutePage() {
  const mapContainer = document.getElementById('drawMapContainer');
  const pointCount = document.getElementById('pointCount');
  const distance = document.getElementById('distance');
  const time = document.getElementById('time');
  const message = document.getElementById('mapMessage');
  const continueButton = document.getElementById('continueButton');
  const undoButton = document.getElementById('undoButton');
  const clearButton = document.getElementById('clearButton');

  const state = {
    map: null,
    points: [],
    markers: [],
    routeLine: null
  };

  function updateStats() {
    const totalMiles = totalDistanceMiles(state.points);
    const totalMinutes = Math.max(0, Math.round(totalMiles * 22));

    if (distance) distance.textContent = totalMiles.toFixed(2);
    if (time) time.textContent = `${totalMinutes} min`;
    if (pointCount) pointCount.textContent = `${state.points.length} ${state.points.length === 1 ? 'point' : 'points'}`;
  }

  function renderPoints() {
    state.markers.forEach((marker) => {
      if (marker && marker.remove) marker.remove();
    });
    state.markers = [];

    state.points.forEach((point) => {
      const circleMarker = window.WalkfinderMaps.createCircleMarker(point, {
        radius: 7,
        color: '#edf5ef',
        fillColor: '#6ad89d',
        fillOpacity: 1
      });

      if (circleMarker && state.map) {
        circleMarker.addTo(state.map);
        state.markers.push(circleMarker);
      }
    });

    if (state.routeLine) {
      state.routeLine.setLatLngs(state.points);
    }

    updateStats();
  }

  function attachMap() {
    if (!mapContainer || !window.WalkfinderMaps || !window.L) return;
    if (state.map) return;

    state.map = window.WalkfinderMaps.createMap(mapContainer, {
      center: [53.805, -2.86],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    state.routeLine = window.WalkfinderMaps.createPolyline([], {
      color: '#59d68f',
      weight: 5,
      opacity: 1
    });

    if (state.routeLine) state.routeLine.addTo(state.map);

    state.map.on('click', (event) => {
      const latlng = [event.latlng.lat, event.latlng.lng];
      state.points.push(latlng);
      renderPoints();
    });
  }

  undoButton?.addEventListener('click', () => {
    state.points.pop();
    renderPoints();
  });

  clearButton?.addEventListener('click', () => {
    state.points = [];
    renderPoints();
  });

  continueButton?.addEventListener('click', () => {
    if (state.points.length < 2) {
      showInlineMessage(message, 'Add at least two points to create a route.', true);
      return;
    }

    hideInlineMessage(message);

    const totalMiles = totalDistanceMiles(state.points);

    savePendingRoute({
      source: 'Drawn route',
      routeType: 'Drawn route',
      recordingMethod: 'drawn',
      coordinates: state.points,
      distance: `${totalMiles.toFixed(2)} mi`,
      duration: `${Math.max(0, Math.round(totalMiles * 22))} min`,
      averageSpeed: `${averageSpeedMph(totalMiles, Math.max(1, Math.round(totalMiles * 22) * 60)).toFixed(1)} mph`,
      image: DEFAULT_ROUTE_IMAGE,
      coverPhoto: DEFAULT_ROUTE_IMAGE,
      photos: [],
      date: new Date().toISOString()
    });

    navigate('route-details.html?from=draw-route');
  });

  attachMap();
  updateStats();
}

function initializePublishedPage() {
  const publishedName = document.getElementById('publishedName');
  const publishedDetail = document.getElementById('publishedDetail');
  const lastPublished = readStorage(STORAGE_KEYS.lastPublished, null);

  if (publishedName) {
    publishedName.textContent = lastPublished?.name || 'Your walk';
  }

  if (publishedDetail) {
    publishedDetail.textContent = lastPublished
      ? `Saved in your collection with ${lastPublished.routeType || 'walk'} details and ${lastPublished.visibility || 'public'} visibility.`
      : 'Your route has been published.';
  }
}

function initializeProfilePage() {
  const savedWalks = getSavedWalks();
  const countElement = document.getElementById('savedCount');
  const routeTypeElement = document.getElementById('routeTypeCount');

  if (countElement) countElement.textContent = String(savedWalks.length);
  if (routeTypeElement) {
    routeTypeElement.textContent = String(savedWalks.filter((walk) => walk.routeType).length || savedWalks.length || 0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindSharedControls();
  setActiveNav();

  switch (getCurrentPage()) {
    case 'index.html':
      initializeDiscoverPage();
      break;
    case 'saved.html':
      initializeSavedPage();
      break;
    case 'route-details.html':
      initializeRouteDetailsPage();
      break;
    case 'photos.html':
      initializePhotosPage();
      break;
    case 'record-walk.html':
      initializeRecordWalkPage();
      break;
    case 'draw-route.html':
      initializeDrawRoutePage();
      break;
    case 'published.html':
      initializePublishedPage();
      break;
    case 'profile.html':
      initializeProfilePage();
      break;
    default:
      break;
  }
});
