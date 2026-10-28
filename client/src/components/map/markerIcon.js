import L from 'leaflet';
import { STATUS_STYLES } from '../../lib/constants';

const PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 4.5 7 13 7 13s7-8.5 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z';

/**
 * Status-coloured map pin. Using `L.divIcon` (instead of Leaflet's default
 * image markers) keeps the colours dynamic and avoids the well-known broken
 * marker-asset issue with bundlers.
 */
export function createIssueMarkerIcon({ status = 'submitted', isActive = false } = {}) {
  const color = STATUS_STYLES[status]?.marker || '#64748b';
  const scale = isActive ? 1.22 : 1;

  return L.divIcon({
    className: 'civicfix-marker',
    html: `
      <div style="
        transform: translateZ(0) scale(${scale});
        transform-origin: bottom center;
        transition: transform 160ms ease;
        filter: drop-shadow(0 4px 6px rgba(10,16,36,.32));
      ">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="${PIN_PATH}" fill="${color}" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round" />
          <circle cx="12" cy="9" r="2.6" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}

/** Neutral "you are here" pin used by the location picker. */
export function createPickerIcon() {
  return L.divIcon({
    className: 'civicfix-marker',
    html: `
      <div style="filter: drop-shadow(0 4px 8px rgba(10,16,36,.35));">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#3562e6" fill-opacity="0.18" />
          <path d="${PIN_PATH}" fill="#3562e6" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
          <circle cx="12" cy="9" r="2.4" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 32],
  });
}

export default createIssueMarkerIcon;
