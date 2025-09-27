import React from "react";
import { View, StyleSheet } from "react-native";

const PivotVisualization = ({ angle, sectors = {} }) => {
  const pivotContainerStyle = {
    transform: [{ rotate: `${angle}deg` }],
  };

  const sectorKeys = Object.keys(sectors).sort();

  // Função para obter os dados de um setor de forma segura
  const getSector = (index) => {
    if (sectorKeys[index]) {
      const sector = sectors[sectorKeys[index]];
      return {
        is_active: sector.is_active,
        color: sector.color || "#3B82F6",
      };
    }
    // Retorna um setor padrão inativo se os dados não existirem
    return { is_active: false, color: "#D1D5DB" };
  };

  // Mapeia os setores para os arcos
  const arcs = [
    getSector(0), // Top-Right
    getSector(1), // Bottom-Right
    getSector(2), // Bottom-Left
    getSector(3), // Top-Left
  ];

  // Array para criar as 4 linhas separadoras
  const separators = [0, 1]; // Só precisamos de 2 linhas para formar a cruz

  return (
    <View style={styles.container}>
      <View style={styles.visualizationWrapper}>
        {/* Camada 1: Os arcos dos setores */}
        <View style={styles.arcsContainer}>
          {arcs.map((arc, index) => (
            <View
              key={`arc-${index}`}
              style={[
                styles.arcWrapper,
                { transform: [{ rotate: `${index * 90}deg` }] },
              ]}
            >
              <View
                style={[
                  styles.arc,
                  { borderTopColor: arc.is_active ? arc.color : "#E5E7EB" },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Camada 2: Linhas separadoras para criar o efeito de cruz */}
        <View style={styles.separatorsContainer}>
          {separators.map((_, index) => (
            <View
              key={`sep-${index}`}
              style={[
                styles.separatorLine,
                // **CORREÇÃO 1: Rotaciona para formar a cruz (0 e 90 graus)**
                { transform: [{ rotate: `${index * 90}deg` }] },
              ]}
            />
          ))}
        </View>

        {/* Camada 3: A base cinza interna, agora por cima dos separadores */}
        <View style={styles.innerBase} />

        {/* Camada 4: O braço giratório do pivô */}
        <View style={[styles.pivotArmContainer, pivotContainerStyle]}>
          <View style={styles.pivotArm}>
            <View style={styles.pivotTip} />
          </View>
        </View>

        {/* Camada 5: Ponto central para acabamento */}
        <View style={styles.centerCircle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 20,
  },
  visualizationWrapper: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  arcsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1, // Camada base
  },
  arcWrapper: {
    width: "100%",
    height: "100%",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  arc: {
    width: "100%",
    height: "100%",
    borderRadius: 85,
    borderWidth: 12,
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    transform: [{ rotate: "-45deg" }],
  },
  separatorsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2, // Acima dos arcos
  },
  separatorLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    marginLeft: -1.5,
    width: 3,
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  innerBase: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    // **CORREÇÃO 2: zIndex maior para cobrir o centro dos separadores**
    zIndex: 3,
  },
  pivotArmContainer: {
    position: "absolute",
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4, // Acima da base interna
  },
  pivotArm: {
    width: "48%",
    height: 6,
    backgroundColor: "#3B82F6",
    borderRadius: 3,
    position: "absolute",
    left: "50%",
  },
  pivotTip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1D4ED8",
    position: "absolute",
    right: -7,
    top: -4,
  },
  centerCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#4B5563",
    position: "absolute",
    zIndex: 5, // Camada superior
  },
});

export default PivotVisualization;
