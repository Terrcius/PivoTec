import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const StatusCard = ({
  color,
  label,
  value,
  status,
  onToggle,
  isAdjustable,
  theme,
}) => {
  return (
    <View style={[styles(theme).card, !isAdjustable && styles(theme).disabled]}>
      <View style={styles(theme).left}>
        <View style={[styles(theme).dot, { backgroundColor: color }]} />
        <Text style={styles(theme).label}>{label}</Text>
      </View>
      <View style={styles(theme).right}>
        <Text style={styles(theme).value}>{value}</Text>
        <TouchableOpacity
          onPress={onToggle}
          style={[
            styles(theme).toggle,
            { backgroundColor: status ? theme.primary : theme.track },
          ]}
          activeOpacity={0.7}
          disabled={!isAdjustable}
        >
          <View
            style={[
              styles(theme).ball,
              status ? styles(theme).on : styles(theme).off,
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = (theme) =>
  StyleSheet.create({
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
    toggle: {
      width: 42,
      height: 24,
      borderRadius: 20,
      justifyContent: "center",
    },
    ball: {
      width: 18,
      height: 18,
      borderRadius: 10,
      backgroundColor: "#FFF",
    },
    on: { transform: [{ translateX: 20 }] },
    off: { transform: [{ translateX: 3 }] },
  });

export default StatusCard;