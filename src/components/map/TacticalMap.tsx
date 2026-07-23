import L, { type DivIcon, type LatLngBoundsExpression } from 'leaflet';
import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { FleetUnit } from '../../types/telemetry';
import { formatCoordinate, formatDateTime, formatNumber } from '../../lib/format';

interface TacticalMapProps {
  fleet: FleetUnit[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
}

interface MapViewportProps {
  fleet: FleetUnit[];
  selectedUnit: FleetUnit | undefined;
}

function MapViewport({ fleet, selectedUnit }: MapViewportProps) {
  const map = useMap();

  useEffect(() => {
    if (selectedUnit) {
      map.flyTo(
        [selectedUnit.latest.latitude, selectedUnit.latest.longitude],
        Math.max(map.getZoom(), 11),
        { duration: 0.7 },
      );
      return;
    }

    if (fleet.length === 0) return;
    const bounds = fleet.map(
      (unit) => [unit.latest.latitude, unit.latest.longitude] as [number, number],
    ) as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [fleet, map, selectedUnit]);

  return null;
}

function markerIcon(unit: FleetUnit, selected: boolean): DivIcon {
  const stateClass = `unit-marker--${unit.state}`;
  return L.divIcon({
    className: 'unit-marker-wrapper',
    html: `<div class="unit-marker ${stateClass} ${selected ? 'is-selected' : ''}" style="--heading:${unit.latest.cog}deg"><span></span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

export function TacticalMap({ fleet, selectedDeviceId, onSelect }: TacticalMapProps) {
  const selectedUnit = fleet.find((unit) => unit.deviceId === selectedDeviceId);
  const selectedPath = useMemo(
    () =>
      selectedUnit?.history
        .slice(-180)
        .map((record) => [record.latitude, record.longitude] as [number, number]) ?? [],
    [selectedUnit],
  );

  return (
    <div className="tactical-map" aria-label="Mapa táctico de flota">
      <MapContainer center={[8.9, -74.1]} zoom={7} zoomControl={false} preferCanvas>
        <TileLayer
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapViewport fleet={fleet} selectedUnit={selectedUnit} />
        {selectedPath.length > 1 && (
          <Polyline positions={selectedPath} pathOptions={{ color: '#00f0ff', weight: 2, opacity: 0.8 }} />
        )}
        {fleet.map((unit) => (
          <Marker
            key={unit.deviceId}
            position={[unit.latest.latitude, unit.latest.longitude]}
            icon={markerIcon(unit, unit.deviceId === selectedDeviceId)}
            eventHandlers={{ click: () => onSelect(unit.deviceId) }}
          >
            <Popup className="tactical-popup">
              <strong>{unit.name}</strong>
              <span>ID {unit.deviceId}</span>
              <span>{formatNumber(unit.latest.speedKnots, ' kn')}</span>
              <span>
                {formatCoordinate(unit.latest.latitude)}, {formatCoordinate(unit.latest.longitude)}
              </span>
              <small>{formatDateTime(unit.latest.deviceTime)}</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-reticle" aria-hidden="true" />
      <div className="map-coordinates" aria-hidden="true">
        SECTOR COLOMBIA // RIVERTECH GEOINT
      </div>
    </div>
  );
}
