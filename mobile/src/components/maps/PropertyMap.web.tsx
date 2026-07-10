import React from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Property = {
  id: number;
  titulo: string;
  precio?: number | null;
  latitud: number;
  longitud: number;
};

type Props = {
  region: Region;
  properties: Property[];
  fitToMarkersToken?: number;
  onSelectProperty?: (property: Property) => void;
  onRegionChangeComplete?: (region: Region) => void;
};

const propertyIcon = L.divIcon({
  className: "nexum-property-marker",
  html: `
    <div style="
      width:34px;
      height:34px;
      border-radius:17px;
      background:#C56E3D;
      border:3px solid #FFFFFF;
      color:#FFFFFF;
      font-weight:900;
      font-size:18px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 4px 12px rgba(10,21,38,0.28);
      position:relative;
    ">$</div>
    <div style="
      width:0;
      height:0;
      margin:-2px auto 0;
      border-left:7px solid transparent;
      border-right:7px solid transparent;
      border-top:10px solid #C56E3D;
    "></div>
  `,
  iconSize: [34, 46],
  iconAnchor: [17, 45],
  popupAnchor: [0, -42],
});

function MapEvents({ onRegionChangeComplete }: { onRegionChangeComplete?: (region: Region) => void }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      const bounds = map.getBounds();

      onRegionChangeComplete?.({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
        longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest()),
      });
    },
  });

  return null;
}

function FitMarkers({
  properties,
  fitToMarkersToken,
}: {
  properties: Property[];
  fitToMarkersToken?: number;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (!fitToMarkersToken || properties.length === 0) return;

    const bounds = L.latLngBounds(
      properties.map((property) => [
        Number(property.latitud),
        Number(property.longitud),
      ])
    );

    map.fitBounds(bounds, { padding: [60, 80], maxZoom: 15 });
  }, [fitToMarkersToken, map]);

  return null;
}

export default function PropertyMap({
  region,
  properties,
  fitToMarkersToken,
  onSelectProperty,
  onRegionChangeComplete,
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

        <MapEvents onRegionChangeComplete={onRegionChangeComplete} />
        <FitMarkers properties={properties} fitToMarkersToken={fitToMarkersToken} />

        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[Number(property.latitud), Number(property.longitud)]}
            icon={propertyIcon}
            eventHandlers={{
              click: () => onSelectProperty?.(property),
            }}
          >
            <Popup>
              <strong>{property.titulo}</strong>
              <br />
              {property.precio !== null && property.precio !== undefined
                ? `$${property.precio}`
                : "Precio a consultar"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
