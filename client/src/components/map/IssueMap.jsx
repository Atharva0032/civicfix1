import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { ArrowBigUp, Clock, ExternalLink, MapPin } from 'lucide-react';
import { createIssueMarkerIcon } from './markerIcon';
import { CategoryBadge, StatusBadge } from '../ui';
import { STATUS_STYLES } from '../../lib/constants';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../lib/constants';
import { timeAgo, truncate } from '../../lib/format';
import { resolveAssetUrl } from '../../lib/api';

/** Padding / zoom ceiling shared by the initial view and the live fit. */
const FIT_PADDING = [48, 48];
const FIT_MAX_ZOOM = 15;
const SINGLE_POINT_ZOOM = 15;

/**
 * Keeps the viewport in sync with the marker set.
 *
 * `skipInitial` is set when `MapContainer` was already given these markers as
 * its starting view — re-fitting an identical viewport would be a no-op, and
 * skipping it keeps Leaflet from reloading the same tile batch.
 */
function FitToMarkers({ points, enabled, skipInitial = false }) {
  const map = useMap();
  const isFirstRun = useRef(true);

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (!enabled || points.length === 0) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (skipInitial) return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], SINGLE_POINT_ZOOM, { animate: true });
      return;
    }
    map.fitBounds(points.map((point) => [point.lat, point.lng]), {
      padding: FIT_PADDING,
      maxZoom: FIT_MAX_ZOOM,
      animate: true,
    });
  }, [map, points, enabled, skipInitial]);

  return null;
}

function RecenterControl({ center }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.setView([center.lat, center.lng], DEFAULT_MAP_ZOOM, { animate: true })}
      className="absolute bottom-4 right-4 z-[500] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-navy-800 shadow-card transition hover:bg-white"
    >
      <MapPin className="h-3.5 w-3.5 text-primary-600" />
      Reset view
    </button>
  );
}

/**
 * Read-only complaint map. Markers are colour-coded by status and clicking one
 * opens a popup with the headline details and a link to the full complaint.
 */
export function IssueMap({
  issues = [],
  height = 480,
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  activeId = null,
  fitOnLoad = true,
  showLegend = true,
  className = '',
}) {
  const points = useMemo(
    () =>
      issues
        .filter((issue) => Number.isFinite(issue.lat) && Number.isFinite(issue.lng))
        .map((issue) => ({ ...issue, lat: Number(issue.lat), lng: Number(issue.lng) })),
    [issues],
  );

  /**
   * The view Leaflet starts with.
   *
   * `MapContainer` reads these props once, at construction. Deriving the view
   * from the markers up-front means Leaflet never downloads a batch of tiles
   * for a default viewport that `fitBounds` is about to replace — which is what
   * produced the burst of `net::ERR_ABORTED` tile requests.
   */
  const initialView = useMemo(() => {
    if (!fitOnLoad || points.length === 0) {
      return { center: [center.lat, center.lng], zoom };
    }
    if (points.length === 1) {
      return { center: [points[0].lat, points[0].lng], zoom: SINGLE_POINT_ZOOM };
    }
    return {
      bounds: points.map((point) => [point.lat, point.lng]),
      boundsOptions: { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM },
    };
  }, [fitOnLoad, points, center.lat, center.lng, zoom]);

  /**
   * Captured at mount, because `MapContainer` only ever reads `initialView`
   * once. When the map starts on a default viewport (markers not loaded yet)
   * the live fit must still run as soon as they arrive.
   */
  const startedOnMarkers = useRef(fitOnLoad && points.length > 0).current;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <MapContainer
        {...initialView}
        scrollWheelZoom
        style={{ height }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        <FitToMarkers points={points} enabled={fitOnLoad} skipInitial={startedOnMarkers} />

        {points.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={createIssueMarkerIcon({
              status: issue.status,
              isActive: activeId === issue.id,
            })}
          >
            <Popup>
              <div className="space-y-2.5">
                {issue.thumbnail && (
                  <img
                    src={resolveAssetUrl(issue.thumbnail)}
                    alt=""
                    className="h-28 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={issue.status} />
                  <CategoryBadge category={issue.category} />
                </div>
                <p className="text-sm font-bold leading-snug text-navy-900">
                  {truncate(issue.title, 70)}
                </p>
                <p className="flex items-start gap-1.5 text-xs text-slate-500">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {issue.address || issue.area}
                </p>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowBigUp className="h-3.5 w-3.5 text-primary-500" />
                    {issue.upvoteCount} supporter{issue.upvoteCount === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {timeAgo(issue.createdAt)}
                  </span>
                </div>
                <Link
                  to={`/issues/${issue.id}`}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-800"
                >
                  View complaint
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        <RecenterControl center={center} />
      </MapContainer>

      {showLegend && (
        <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-card backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Status
          </p>
          <ul className="mt-2 space-y-1.5">
            {Object.entries(STATUS_STYLES).map(([status, style]) => (
              <li key={status} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: style.marker }}
                />
                {style.label}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-500">
            {points.length} marker{points.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  );
}

export default IssueMap;
