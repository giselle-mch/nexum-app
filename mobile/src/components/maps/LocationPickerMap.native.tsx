import React, { useEffect, useRef } from "react";
import MapView, { Marker, Region, MapPressEvent } from "react-native-maps";
import { StyleSheet } from "react-native";

type Location = {
  latitude: number;
  longitude: number;
};

type Props = {
  region: Region;
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
};

export default function LocationPickerMap({
  region,
  selectedLocation,
  onSelectLocation,
}: Props) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
  }, [region]);

  const handlePress = (event: MapPressEvent) => {
    onSelectLocation(event.nativeEvent.coordinate);
  };

  return (
    <MapView ref={mapRef} style={styles.map} initialRegion={region} onPress={handlePress}>
      {selectedLocation && (
        <Marker coordinate={selectedLocation} title="Ubicación seleccionada" />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
