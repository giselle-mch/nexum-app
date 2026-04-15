import { View, Text, Image, TouchableOpacity } from "react-native";
import { COLORS } from "../constants/colors";
import { toAssetUrl } from "../services/api";

type PropertyListItem = {
  id: number;
  title: string;
  price: number | null;
  city: string;
  thumbnail: string | null;
  distanceKm?: number;
};

interface PropertyCardProps {
  property: PropertyListItem;
  onPress: () => void;
}

export default function PropertyCard({ property, onPress }: PropertyCardProps) {
  const imageUri =
    toAssetUrl(property.thumbnail) ?? "https://via.placeholder.com/300";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "white",
        margin: 10,
        borderRadius: 10,
        overflow: "hidden",
        elevation: 3,
      }}
    >
      <Image
        source={{
          uri: imageUri,
        }}
        style={{ width: "100%", height: 180 }}
      />

      <View style={{ padding: 10 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
          {property.title}
        </Text>

        <Text style={{ color: COLORS.secondary }}>
          {property.price !== null ? `$${property.price}` : "Precio a consultar"}
        </Text>

        <Text style={{ color: "gray" }}>
          {property.city}
        </Text>

        {typeof property.distanceKm === "number" ? (
          <Text style={{ color: "gray", marginTop: 4 }}>
            {property.distanceKm.toFixed(1)} km
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
