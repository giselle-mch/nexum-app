import React, { useEffect, useRef } from "react";
import MapView, { Marker, Region } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";

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

export default function PropertyMap({
  region,
  properties,
  fitToMarkersToken,
  onSelectProperty,
  onRegionChangeComplete,
}: Props) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!fitToMarkersToken || properties.length === 0) return;

    mapRef.current?.fitToCoordinates(
      properties.map((property) => ({
        latitude: Number(property.latitud),
        longitude: Number(property.longitud),
      })),
      {
        animated: true,
        edgePadding: { top: 110, right: 60, bottom: 120, left: 60 },
      }
    );
  }, [fitToMarkersToken]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {properties.map((property) => (
        <Marker
          key={property.id}
          coordinate={{
            latitude: Number(property.latitud),
            longitude: Number(property.longitud),
          }}
          title={property.titulo}
          description={
            property.precio !== null && property.precio !== undefined
              ? `$${property.precio}`
              : "Precio a consultar"
          }
          tracksViewChanges={false}
          onCalloutPress={() => onSelectProperty?.(property)}
        >
          <View style={styles.pinWrap}>
            <View style={styles.pin}>
              <Text style={styles.pinText}>$</Text>
            </View>
            <View style={styles.pinTip} />
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pinWrap: {
    alignItems: "center",
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: "#0A1526",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  pinText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.accent,
  },
});
