import React from "react";
import { View, StyleSheet, Text } from "react-native";

const PivotVisualization = ({ angle, sectors = {} }) => {
  const pivotContainerStyle = {
    transform: [{ rotate: `${angle}deg` }],
  };

  const sectorKeys = Object.keys(sectors).sort();
  const sectorCount = sectorKeys.length;
  const validSectorCount = sectorCount > 0 ? sectorCount : 4;
  const sectorAngle = 360 / validSectorCount;

  const getSector = (index) => {
    if (sectorKeys[index]) {
      const sector = sectors[sectorKeys[index]];
      return {
        is_active: sector.is_active,
        color: sector.color || "#3B82F6",
      };
    }
    return { is_active: false, color: "#D1D5DB" };
  };

  const arcs = [];
  for (let i = 0; i < validSectorCount; i++) {
    arcs.push(getSector(i));
  }

  return (
    <View style={styles.container}>
      <View style={styles.visualizationWrapper}>
        {/* Informação sobre setores - NOVA POSIÇÃO */}
        <View style={styles.infoContainer}>
          <View style={styles.infoText}>
            <View style={styles.infoRow}>
              <View style={styles.infoDot} />
              <View style={styles.infoLabelContainer}>
                <Text style={styles.infoLabel}>
                  Setores: {validSectorCount}
                </Text>
                <Text style={styles.infoSubLabel}>
                  {sectorAngle.toFixed(0)}° cada
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Camada 1: Os arcos dos setores COM GAPS */}
        <View style={styles.arcsContainer}>
          {arcs.map((arc, index) => (
            <View
              key={`arc-${index}`}
              style={[
                styles.arcWrapper,
                {
                  transform: [{ rotate: `${index * sectorAngle}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.arc,
                  {
                    borderTopColor: arc.is_active ? arc.color : "#E5E7EB",
                    transform: [{ rotate: `-${sectorAngle / 2 - 2}deg` }],
                    borderTopWidth: 12,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Camada 2: Linhas separadoras (agora são os gaps) */}
        <View style={styles.separatorsContainer}>
          {arcs.map((_, index) => (
            <View
              key={`sep-${index}`}
              style={[
                styles.separatorLine,
                {
                  transform: [{ rotate: `${index * sectorAngle}deg` }],
                  width: 4,
                  marginLeft: -2,
                },
              ]}
            />
          ))}
        </View>

        {/* Camada 3: A base cinza interna */}
        <View style={styles.innerBase} />

        {/* Camada 4: O braço giratório do pivô */}
        <View style={[styles.pivotArmContainer, pivotContainerStyle]}>
          <View style={styles.pivotArm}>
            <View style={styles.pivotTip} />
          </View>
        </View>

        {/* Camada 5: Ponto central */}
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
    zIndex: 1,
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
  },
  separatorsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 2,
  },
  separatorLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    marginLeft: -2,
    width: 4,
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
    zIndex: 3,
  },
  pivotArmContainer: {
    position: "absolute",
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4,
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
    zIndex: 5,
  },
  infoContainer: {
    position: "absolute",
    top: 140, // Ajustado para ficar acima do círculo
    right: -95, // Ajustado para ficar à direita
    zIndex: 6,
  },
  infoText: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginRight: 6,
  },
  infoLabelContainer: {
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
  },
  infoSubLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
});

export default PivotVisualization;
