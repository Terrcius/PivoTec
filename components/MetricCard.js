import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const MetricCard = ({ value, label, onClick }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onClick} activeOpacity={0.7}>
      <Text style={styles.valueText}>{value}</Text>
      <Text style={styles.labelText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1, // 🌟 ISSO AQUI É O SEGREDO: força os 3 cards a dividirem o espaço igualmente!
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    // Seus estilos de sombra atuais...
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  valueText: {
    fontSize: 18, // Um tamanho bom para caber mesmo em telas menores
    fontWeight: "bold",
    color: "#10B981", // Cor verde que você está usando
    marginBottom: 4,
  },
  labelText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default MetricCard;
