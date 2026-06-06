import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

const MetricCard = ({
  value,
  label,
  onClick,
  icon = "analytics",
  accent = theme.primary,
}) => {
  return (
    <TouchableOpacity onPress={onClick} style={styles.card} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: accent + "22" }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 90,
    backgroundColor: theme.bgCard,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    borderRadius: 16,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: { fontSize: 20, fontWeight: "bold" },
  label: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
});

export default MetricCard;
