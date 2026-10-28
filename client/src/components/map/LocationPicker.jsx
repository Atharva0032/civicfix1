import { useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, Loader2, MapPin, Navigation } from 'lucide-react';
import { createPickerIcon } from './markerIcon';
import { Button, Input } from '../ui';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../lib/constants';

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

/** Keeps the map centred when the coordinates change from outside (geolocation). */
function FollowValue({ value, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return;
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.lat, value.lng, enabled]);
  return null;
}

/**
 * Interactive coordinate picker used by the report form.
 * Click anywhere on the map, drag the pin, or use the device location.
 */
export function LocationPicker({ value, onChange, height = 340, className }) {
  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const hasPoint = Number.isFinite(value?.lat) && Number.isFinite(value?.lng);

  const handlePick = useCallback(
    (coords) => {
      onChange({ lat: Number(coords.lat.toFixed(6)), lng: Number(coords.lng.toFixed(6)) });
    },
    [onChange],
  );

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setFeedback('This browser does not support location access.');
      return;
    }

    setIsLocating(true);
    setFeedback('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePick({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        setFeedback('Location captured from your device.');
      },
      () => {
        setIsLocating(false);
        setFeedback(
          'Could not read your location. Please click the exact spot on the map instead.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  /**
   * Optional convenience: turns the picked coordinates into a street address
   * using the OpenStreetMap Nominatim service (no API key required).
   */
  const resolveAddress = async () => {
    if (!hasPoint) return;
    setIsResolving(true);
    setFeedback('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${value.lat}&lon=${value.lng}&zoom=18`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error('Lookup failed');
      const payload = await response.json();
      const address = payload.display_name;
      if (address) {
        onChange({ ...value, address });
        setFeedback('Address filled in from the map pin — please verify it.');
      } else {
        setFeedback('No address found for this point. Please type it manually.');
      }
    } catch {
      setFeedback('Address lookup is unavailable right now. Please type the address manually.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={isLocating ? Loader2 : Crosshair}
          onClick={useDeviceLocation}
          disabled={isLocating}
        >
          {isLocating ? 'Locating…' : 'Use my current location'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          leftIcon={isResolving ? Loader2 : Navigation}
          onClick={resolveAddress}
          disabled={!hasPoint || isResolving}
        >
          {isResolving ? 'Looking up…' : 'Fill address from pin'}
        </Button>

        <span className="text-xs text-slate-500">
          or click anywhere on the map to drop the pin
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="lat-input">
            Latitude
          </label>
          <Input
            id="lat-input"
            type="number"
            step="0.000001"
            min="-90"
            max="90"
            value={value?.lat ?? ''}
            onChange={(event) => onChange({ ...value, lat: Number(event.target.value) })}
            placeholder="18.520430"
            required
          />
        </div>
        <div>
          <label className="field-label" htmlFor="lng-input">
            Longitude
          </label>
          <Input
            id="lng-input"
            type="number"
            step="0.000001"
            min="-180"
            max="180"
            value={value?.lng ?? ''}
            onChange={(event) => onChange({ ...value, lng: Number(event.target.value) })}
            placeholder="73.856744"
            required
          />
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={hasPoint ? [value.lat, value.lng] : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
          zoom={hasPoint ? 16 : DEFAULT_MAP_ZOOM}
          scrollWheelZoom
          style={{ height }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClickHandler onPick={handlePick} />
          <FollowValue value={value || {}} enabled={hasPoint} />
          {hasPoint && (
            <Marker
              position={[value.lat, value.lng]}
              icon={createPickerIcon()}
              draggable
              eventHandlers={{
                dragend(event) {
                  const position = event.target.getLatLng();
                  handlePick({ lat: position.lat, lng: position.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5 text-primary-500" />
        {hasPoint
          ? `Pin set at ${Number(value.lat).toFixed(5)}, ${Number(value.lng).toFixed(5)}`
          : 'No location selected yet.'}
      </p>

      {feedback && <p className="mt-1 text-xs font-medium text-primary-700">{feedback}</p>}
    </div>
  );
}

export default LocationPicker;
