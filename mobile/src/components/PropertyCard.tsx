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
  const imageUri = toAssetUrl(property.thumbnail) ?? "https://via.placeholder.com/300";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: COLORS.white,
        marginHorizontal: 12,
        marginBottom: 14,
        borderRadius: 18,
        overflow: "hidden",
        shadowColor: "#0A1526",
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View>
        <Image source={{ uri: imageUri }} style={{ width: "100%", height: 186 }} />

        <View
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(11,31,51,0.84)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: COLORS.white, fontWeight: "700" }}>
              {property.price !== null ? `$${property.price}` : "Precio a consultar"}
            </Text>
          </View>

          {typeof property.distanceKm === "number" ? (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.92)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: COLORS.ink, fontWeight: "700" }}>
                {property.distanceKm.toFixed(1)} km
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text style={{ fontWeight: "800", fontSize: 17, color: COLORS.ink }} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={{ color: COLORS.secondary, marginTop: 4, fontWeight: "600" }}>
          {property.city}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
