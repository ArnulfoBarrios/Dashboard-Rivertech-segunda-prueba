import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Sun, Moon, Box } from 'lucide-react';
import type { FleetUnit, MapStyle } from '../../types/telemetry';

interface OpenFreeMapContainerProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelectUnit: (deviceId: string) => void;
  mapStyle: MapStyle;
  onChangeMapStyle: (style: MapStyle) => void;
}

export function OpenFreeMapContainer({
  fleet,
  selectedDeviceId,
  onSelectUnit,
  mapStyle,
  onChangeMapStyle,
}: OpenFreeMapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // Get Map Style (Provides vector style with raster tile fallback for Vercel/Production deployment)
  const getStyleDefinition = (style: MapStyle): maplibregl.StyleSpecification | string => {
    // Standard raster tile style spec that works 100% reliably on Vercel without WebWorker/CSP blocks
    const tileBase = style === 'fiord' ? 'fiord' : 'liberty';
    return {
      version: 8,
      sources: {
        'openfreemap-raster': {
          type: 'raster',
          tiles: [`https://tiles.openfreemap.org/styles/${tileBase}/{z}/{x}/{y}.png`],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap',
        },
      },
      layers: [
        {
          id: 'openfreemap-raster-layer',
          type: 'raster',
          source: 'openfreemap-raster',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };
  };

  // Helper function to sync markers on map
  const syncMarkers = (map: maplibregl.Map) => {
    if (!map) return;

    // Remove markers no longer in fleet
    markersRef.current.forEach((marker, id) => {
      if (!fleet.some((u) => u.deviceId === id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    fleet.forEach((unit) => {
      const isSelected = unit.deviceId === selectedDeviceId;
      const markerColor =
        unit.state === 'moving' ? '#16a34a' : unit.state === 'idle' ? '#2563eb' : '#dc2626';

      let marker = markersRef.current.get(unit.deviceId);

      if (!marker) {
        // Outer container for MapLibre positioning
        const containerEl = document.createElement('div');
        containerEl.style.width = '36px';
        containerEl.style.height = '36px';
        containerEl.style.cursor = 'pointer';

        // Inner container for styling and isolated SVG rotation
        const innerEl = document.createElement('div');
        innerEl.className = `custom-vessel-marker ${isSelected ? 'is-selected' : ''}`;
        innerEl.style.setProperty('--marker-color', markerColor);
        innerEl.style.width = '100%';
        innerEl.style.height = '100%';
        innerEl.style.borderRadius = '50%';
        innerEl.style.display = 'flex';
        innerEl.style.alignItems = 'center';
        innerEl.style.justifyContent = 'center';
        innerEl.style.boxShadow = isSelected
          ? `0 0 0 4px rgba(37, 99, 235, 0.35), 0 0 16px ${markerColor}`
          : '0 4px 10px rgba(0, 0, 0, 0.2)';
        innerEl.style.background = '#ffffff';

        const svgWrapper = document.createElement('div');
        svgWrapper.style.transform = `rotate(${unit.latest.cog}deg)`;
        svgWrapper.style.display = 'flex';
        svgWrapper.style.alignItems = 'center';
        svgWrapper.style.justifyContent = 'center';
        svgWrapper.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="${markerColor}" stroke="${markerColor}" stroke-width="2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`;

        innerEl.appendChild(svgWrapper);
        containerEl.appendChild(innerEl);

        const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(`
          <div style="padding: 10px; font-family: system-ui; display: flex; flex-direction: column; gap: 4px; color: #0f172a;">
            <strong style="font-size: 13px; color: #1e40af;">${unit.name}</strong>
            <span style="font-size: 11px; color: #475569;">ID Dispositivo: #${unit.deviceId}</span>
            <span style="font-size: 11px; font-weight: 700; color: #16a34a;">Velocidad: ${unit.latest.speedKnots.toFixed(1)} nudos</span>
            <span style="font-size: 10px; color: #64748b;">Rumbo: ${unit.latest.cog}° | Satélites: ${unit.latest.attributes.sat || 0}</span>
            <span style="font-size: 10px; color: #0284c7;">Sector: ${unit.latest.attributes.locationDescription || unit.latest.location || 'Canal Principal'}</span>
          </div>
        `);

        marker = new maplibregl.Marker({ element: containerEl, anchor: 'center' })
          .setLngLat([unit.latest.longitude, unit.latest.latitude])
          .setPopup(popup)
          .addTo(map);

        containerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectUnit(unit.deviceId);
        });

        markersRef.current.set(unit.deviceId, marker);
      } else {
        // Update existing marker position
        marker.setLngLat([unit.latest.longitude, unit.latest.latitude]);
        marker.addTo(map);

        const containerEl = marker.getElement();
        const innerEl = containerEl.firstElementChild as HTMLElement;
        if (innerEl) {
          innerEl.className = `custom-vessel-marker ${isSelected ? 'is-selected' : ''}`;
          innerEl.style.boxShadow = isSelected
            ? `0 0 0 4px rgba(37, 99, 235, 0.35), 0 0 16px ${markerColor}`
            : '0 4px 10px rgba(0, 0, 0, 0.2)';
          const svgWrapper = innerEl.firstElementChild as HTMLElement;
          if (svgWrapper) {
            svgWrapper.style.transform = `rotate(${unit.latest.cog}deg)`;
          }
        }
      }
    });
  };

  // Initialize Map ONCE on Mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialUnit = fleet.find((u) => u.deviceId === selectedDeviceId) || fleet[0];
    const initialLat = initialUnit ? initialUnit.latest.latitude : 9.5;
    const initialLng = initialUnit ? initialUnit.latest.longitude : -74.5;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleDefinition(mapStyle),
      center: [initialLng, initialLat],
      zoom: mapStyle === '3d' ? 12 : 9,
      pitch: mapStyle === '3d' ? 60 : 0,
      bearing: mapStyle === '3d' ? -25 : 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

    map.on('load', () => {
      map.resize();
      syncMarkers(map);
    });

    map.on('style.load', () => {
      map.resize();
      syncMarkers(map);
    });

    mapRef.current = map;

    const handleResize = () => {
      if (mapRef.current) mapRef.current.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Change Style dynamically without destroying map instance
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(getStyleDefinition(mapStyle));

    if (mapStyle === '3d') {
      map.easeTo({ pitch: 60, bearing: -25, zoom: Math.max(map.getZoom(), 11), duration: 1000 });
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    }
  }, [mapStyle]);

  // Keep markers synced when fleet or selectedDeviceId changes
  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      syncMarkers(map);
    }
  }, [fleet, selectedDeviceId]);

  // Fly to selected vessel
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedDeviceId) return;

    const selectedUnit = fleet.find((u) => u.deviceId === selectedDeviceId);
    if (selectedUnit) {
      map.flyTo({
        center: [selectedUnit.latest.longitude, selectedUnit.latest.latitude],
        zoom: mapStyle === '3d' ? 13 : 11,
        duration: 1200,
      });
    }
  }, [selectedDeviceId, mapStyle]);

  return (
    <div className="openfreemap-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map Style Selector Bar */}
      <div className="map-style-bar">
        <button
          type="button"
          className={`btn-darkone-outline ${mapStyle === 'liberty' ? 'is-active' : ''}`}
          onClick={() => onChangeMapStyle('liberty')}
          title="Estilo Liberty Claro"
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          <Sun size={14} />
          <span>Liberty (Claro)</span>
        </button>

        <button
          type="button"
          className={`btn-darkone-outline ${mapStyle === 'fiord' ? 'is-active' : ''}`}
          onClick={() => onChangeMapStyle('fiord')}
          title="Estilo Fiord Oscuro"
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          <Moon size={14} />
          <span>Fiord (Oscuro)</span>
        </button>

        <button
          type="button"
          className={`btn-darkone-outline ${mapStyle === '3d' ? 'is-active' : ''}`}
          onClick={() => onChangeMapStyle('3d')}
          title="Vista Perspectiva 3D"
          style={{ padding: '6px 14px', fontSize: '11px' }}
        >
          <Box size={14} />
          <span>Vista 3D</span>
        </button>
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
