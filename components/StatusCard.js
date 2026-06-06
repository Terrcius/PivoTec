import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../theme";

const StatusCard = ({
  color,
  label,
  value,
  status,
  onToggle,
  isAdjustable,
}) => {
  return (
    <View style={[styles.card, !isAdjustable && styles.disabled]}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>{value}</Text>
        <TouchableOpacity
          onPress={onToggle}
          style={[
            styles.toggle,
            { backgroundColor: status ? theme.primary : "#3A4F44" },
          ]}
          activeOpacity={0.7}
          disabled={!isAdjustable}
        >
          <View style={[styles.ball, status ? styles.on : styles.off]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.bgCardAlt,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  disabled: { opacity: 0.5 },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontWeight: "500", fontSize: 14, color: theme.text },
  right: { flexDirection: "row", alignItems: "center", gap: 12 },
  value: { fontSize: 14, fontWeight: "600", color: theme.textMuted },
  toggle: { width: 42, height: 24, borderRadius: 20, justifyContent: "center" },
  ball: { width: 18, height: 18, borderRadius: 10, backgroundColor: "#FFF" },
  on: { transform: [{ translateX: 20 }] },
  off: { transform: [{ translateX: 3 }] },
});

export default StatusCard;
