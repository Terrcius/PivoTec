import React from "react";
import { View, StyleSheet, Text } from "react-native";

// Este componente agora também recebe o objeto 'sectors'
const PivotVisualization = ({ angle, sectors = {} }) => {
  const pivotArmStyle = {
    transform: [{ rotate: `${angle}deg` }],
  };

  // Garante uma ordem consistente dos setores
  const sectorKeys = Object.keys(sectors).sort();
  const numSectors = sectorKeys.length;
  const sliceAngle = numSectors > 0 ? 360 / numSectors : 0;

  return (
    <View style={styles.container}>
      {/* Wrapper para centralizar a base e os pontos dos setores */}
      <View style={styles.visualizationWrapper}>
        <View style={styles.base}>
          <View style={[styles.pivotArm, pivotArmStyle]}>
            <View style={styles.pivotTip} />
          </View>
          <View style={styles.centerCircle} />
        </View>

        {/* Renderiza os pontos de status dos setores ao redor da base */}
        {numSectors > 0 &&
          sectorKeys.map((key, index) => {
            const sector = sectors[key];
            // Calcula o ângulo para posicionar o ponto
            const sectorAngle = index * sliceAngle;

            // Usa trigonometria para posicionar os pontos em um círculo
            // -90 graus para começar do topo (posição de 12 horas)
            const angleRad = (sectorAngle - 90) * (Math.PI / 180);
            const radius = 85; // Distância do centro onde os pontos aparecerão

            const dotStyle = {
              // A posição é calculada a partir do centro do wrapper
              top: "50%",
              left: "50%",
              // A transformação move o ponto para sua posição final no círculo
              transform: [
                { translateX: radius * Math.cos(angleRad) - 6 }, // -6 para centralizar o ponto (metade da sua largura)
                { translateY: radius * Math.sin(angleRad) - 6 }, // -6 para centralizar o ponto (metade da sua altura)
              ],
              // Usa a cor do setor se estiver ativo, senão usa um cinza
              backgroundColor: sector.is_active
                ? sector.color || "#3B82F6"
                : "#A1A1AA",
            };

            return <View key={key} style={[styles.sectorDot, dotStyle]} />;
          })}
      </View>

      <Text style={styles.angleText}>{Math.round(angle)}°</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingBottom: 20, // Espaço para o texto do ângulo abaixo
  },
  visualizationWrapper: {
    width: 200, // Tamanho aumentado para acomodar os pontos
    height: 200, // Tamanho aumentado para acomodar os pontos
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Essencial para posicionar os pontos absolutamente
  },
  base: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 10,
    borderColor: "#D1D5DB",
    position: "absolute", // Garante que fique no centro do wrapper
  },
  centerCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#4B5563",
    position: "absolute",
    zIndex: 2,
  },
  pivotArm: {
    width: "50%",
    height: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 4,
    position: "absolute",
    left: "50%",
    zIndex: 1,
  },
  pivotTip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#1D4ED8",
    position: "absolute",
    right: -8,
    top: -4,
  },
  angleText: {
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 18,
    color: "#374151",
  },
  sectorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    position: "absolute", // Essencial para o posicionamento
    zIndex: 3,
  },
});

export default PivotVisualization;
