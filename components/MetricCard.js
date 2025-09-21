import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

const MetricCard = ({ value, label, onClick }) => {
  return (
    // O container do cartão é um botão tocável
    <TouchableOpacity onPress={onClick} style={styles.cardContainer}>
      <View style={styles.cardContent}>
        {/* O valor numérico com estilos dinâmicos */}
        <Text style={styles.valueText}>{value}</Text>
        {/* O rótulo/descrição */}
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Estilos para simular o layout de múltiplos cartões na mesma linha
    flexGrow: 1, // Permite que o cartão se expanda para preencher o espaço
    flexBasis: "45%", // Define o tamanho base para 45%, criando 2 colunas
    minWidth: 100, // Garante que o cartão não fique muito pequeno

    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,

    // Estilos de sombra para Android e iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,

    margin: 5,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22C55E",
  },
  labelText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
});

export default MetricCard;
