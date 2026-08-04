import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";

interface LocationPickerMapProps {
  latitude: string;
  longitude: string;
  label: string;
  markerTitle: string;
  onLocationChange: (latitude: number, longitude: number) => void;
}

const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 16;

const markerIcon = L.divIcon({
  className: "",
  html: '<span aria-hidden="true" style="display:block;width:1.25rem;height:1.25rem;border:3px solid white;border-radius:9999px;background:#2563eb;box-shadow:0 2px 8px rgb(15 23 42 / 45%)"></span>',
  iconAnchor: [10, 10],
  iconSize: [20, 20],
});

const parsePosition = (latitude: string, longitude: string): L.LatLng | null => {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    latitude.trim() === "" ||
    longitude.trim() === "" ||
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return L.latLng(parsedLatitude, parsedLongitude);
};

const createMarker = (
  map: L.Map,
  position: L.LatLngExpression,
  title: string,
  onMove: (position: L.LatLng) => void,
): L.Marker => {
  const marker = L.marker(position, {
    alt: title,
    draggable: true,
    icon: markerIcon,
    keyboard: true,
    title,
  }).addTo(map);

  marker.on("dragend", () => {
    onMove(marker.getLatLng());
  });

  return marker;
};

export const LocationPickerMap = ({
  latitude,
  longitude,
  label,
  markerTitle,
  onLocationChange,
}: LocationPickerMapProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const initialPositionRef = useRef(parsePosition(latitude, longitude));
  const onLocationChangeRef = useRef(onLocationChange);
  const markerTitleRef = useRef(markerTitle);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    markerTitleRef.current = markerTitle;
  }, [markerTitle]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || mapRef.current) {
      return;
    }

    const initialPosition = initialPositionRef.current;
    const map = L.map(container, {
      center: initialPosition ?? DEFAULT_CENTER,
      zoom: initialPosition ? SELECTED_ZOOM : DEFAULT_ZOOM,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const notifyPosition = (position: L.LatLng): void => {
      onLocationChangeRef.current(position.lat, position.lng);
    };
    const selectPosition = (position: L.LatLng): void => {
      if (markerRef.current) {
        markerRef.current.setLatLng(position);
      } else {
        markerRef.current = createMarker(map, position, markerTitleRef.current, notifyPosition);
      }

      notifyPosition(position);
    };

    if (initialPosition) {
      markerRef.current = createMarker(map, initialPosition, markerTitleRef.current, notifyPosition);
    }

    map.on("click", (event: L.LeafletMouseEvent) => {
      selectPosition(event.latlng);
    });
    mapRef.current = map;

    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const position = parsePosition(latitude, longitude);

    if (!map) {
      return;
    }

    if (!position) {
      markerRef.current?.remove();
      markerRef.current = null;

      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = createMarker(map, position, markerTitleRef.current, (nextPosition) => {
        onLocationChangeRef.current(nextPosition.lat, nextPosition.lng);
      });
    }

    map.panTo(position);
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-lg border border-border-default bg-surface-primary"
      role="region"
      aria-label={label}
    />
  );
};
