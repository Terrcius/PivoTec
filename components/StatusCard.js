// components/StatusCard.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// 1. Adicionamos a nova prop 'isAdjustable'
const StatusCard = ({
  color,
  label,
  value,
  status,
  onToggle,
  isAdjustable,
}) => {
  return (
    // 2. Adicionamos um estilo que aplica opacidade se não for ajustável
    <View style={[styles.card, !isAdjustable && styles.disabledCard]}>
      <View style={styles.labelContainer}>
        <View style={[styles.statusCircle, { backgroundColor: color }]}></View>
        <Text style={styles.labelText}>{label}</Text>
      </View>

      <View style={styles.controlContainer}>
        <Text style={styles.valueText}>{value}</Text>

        <TouchableOpacity
          onPress={onToggle}
          style={[
            styles.toggleButton,
            { backgroundColor: status ? "#22C55E" : "#9CA3AF" },
          ]}
          activeOpacity={0.7}
          // 3. Adicionamos a propriedade 'disabled' para bloquear o toque
          disabled={!isAdjustable}
        >
          <View
            style={[
              styles.toggleBall,
              status ? styles.toggleOn : styles.toggleOff,
            ]}
          ></View>
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
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  // 4. Novo estilo para o feedback visual de desabilitado
  disabledCard: {
    opacity: 0.5,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  labelText: {
    fontWeight: "500",
    fontSize: 14,
    color: "#374151",
  },
  controlContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleButton: {
    width: 40,
    height: 24,
    borderRadius: 20,
    justifyContent: "center",
  },
  toggleBall: {
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleOn: {
    transform: [{ translateX: 19 }],
  },
  toggleOff: {
    transform: [{ translateX: 4 }],
  },
});

export default StatusCard;
