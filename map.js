(function (global) {
  const DEFAULT_VIEW = [53.805, -2.86];
  const tileLayerConfig = {
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }
  };

  const WalkfinderMaps = {
    DEFAULT_VIEW,
    tileLayerConfig,
    createMap(container, options = {}) {
      const target = typeof container === 'string' ? document.getElementById(container) : container;

      if (!target || !global.L) {
        return null;
      }

      const map = global.L.map(target, {
        zoomControl: options.zoomControl !== false,
        attributionControl: options.attributionControl !== false,
        scrollWheelZoom: options.scrollWheelZoom !== false,
        tap: options.tap !== false,
        touchZoom: options.touchZoom !== false,
        doubleClickZoom: options.doubleClickZoom !== false,
        worldCopyJump: true
      });

      global.L.tileLayer(tileLayerConfig.url, tileLayerConfig.options).addTo(map);
      map.setView(options.center || DEFAULT_VIEW, options.zoom || 13);

      if (options.fitBounds) {
        map.fitBounds(options.fitBounds, { padding: [20, 20] });
      }

      return map;
    },

    createMarker(latlng, options = {}) {
      if (!global.L) {
        return null;
      }

      return global.L.marker(latlng, options);
    },

    createPolyline(points, options = {}) {
      if (!global.L) {
        return null;
      }

      return global.L.polyline(points, {
        color: '#59d68f',
        weight: 5,
        opacity: 1,
        ...options
      });
    },

    createCircleMarker(latlng, options = {}) {
      if (!global.L) {
        return null;
      }

      return global.L.circleMarker(latlng, {
        radius: 8,
        color: '#edf5ef',
        fillColor: '#59d68f',
        fillOpacity: 1,
        ...options
      });
    }
  };

  global.WalkfinderMaps = WalkfinderMaps;
})(window);
