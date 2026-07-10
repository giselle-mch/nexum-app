import React from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
};

type Location = {
  latitude: number;
  longitude: number;
};

type Props = {
  region: Region;
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
};

function ClickHandler({ onSelectLocation }: { onSelectLocation: Props["onSelectLocation"] }) {
  useMapEvents({
    click(event) {
      onSelectLocation({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapCenter({ region }: { region: Region }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView([region.latitude, region.longitude], map.getZoom());
  }, [map, region.latitude, region.longitude]);

  return null;
}

export default function LocationPickerMap({
  region,
  selectedLocation,
  onSelectLocation,
}: Props) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", zIndex: 0 }}>
      <MapContainer
        center={[region.latitude, region.longitude]}
        zoom={13}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onSelectLocation={onSelectLocation} />
        <MapCenter region={region} />

        {selectedLocation && (
          <Marker
            position={[
              selectedLocation.latitude,
              selectedLocation.longitude,
            ]}
          />
        )}
      </MapContainer>
    </div>
  );
}
