import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const StatusCard = ({ color, label, value, status, onToggle }) => {
  return (
    // Substituindo o 'div' por 'View' para o container do card
    <View style={styles.card}>
      {/* View para agrupar o círculo de status e o texto */}
      <View style={styles.labelContainer}>
        {/* O círculo de status. O background é dinâmico */}
        <View style={[styles.statusCircle, { backgroundColor: color }]}></View>
        <Text style={styles.labelText}>{label}</Text>
      </View>

      {/* View para agrupar o valor e o botão */}
      <View style={styles.controlContainer}>
        <Text style={styles.valueText}>{value}</Text>

        {/* TouchableOpacity adiciona o comportamento de toque ao botão */}
        <TouchableOpacity
          onPress={onToggle}
          style={[
            styles.toggleButton,
            { backgroundColor: status ? "#22C55E" : "#9CA3AF" },
          ]}
          activeOpacity={0.7} // Controla a opacidade quando o botão é pressionado
        >
          {/* A 'bola' do botão de toggle */}
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

// StyleSheet.create é usado para otimizar os estilos
const styles = StyleSheet.create({
  card: {
    flexDirection: "row", // Alinha os itens na horizontal
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
    // Transição de animação no React Native é feita de forma diferente (LayoutAnimation)
    // por enquanto, vamos focar apenas na posição
  },
  toggleOn: {
    transform: [{ translateX: 19 }],
  },
  toggleOff: {
    transform: [{ translateX: 4 }],
  },
});

export default StatusCard;
