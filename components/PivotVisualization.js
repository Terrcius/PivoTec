import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme";

const PivotVisualization = ({ angle, sectors = {} }) => {
  const pivotContainerStyle = { transform: [{ rotate: `${angle}deg` }] };
  const sectorKeys = Object.keys(sectors).sort();

  const getSector = (index) => {
    if (sectorKeys[index]) {
      const sector = sectors[sectorKeys[index]];
      return {
        is_active: sector.is_active,
        color: sector.color || theme.primary,
      };
    }
    return { is_active: false, color: "#2A4A3A" };
  };

  const arcs = [getSector(0), getSector(1), getSector(2), getSector(3)];
  const separators = [0, 1];

  return (
    <View style={styles.container}>
      <View style={styles.visualizationWrapper}>
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
                  { borderTopColor: arc.is_active ? arc.color : "#2A4A3A" },
                ]}
              />
            </View>
          ))}
        </View>
        <View style={styles.separatorsContainer}>
          {separators.map((_, index) => (
            <View
              key={`sep-${index}`}
              style={[
                styles.separatorLine,
                { transform: [{ rotate: `${index * 90}deg` }] },
              ]}
            />
          ))}
        </View>
        <View style={styles.innerBase} />
        <View style={[styles.pivotArmContainer, pivotContainerStyle]}>
          <View style={styles.pivotArm}>
            <View style={styles.pivotTip} />
          </View>
        </View>
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
    transform: [{ rotate: "-45deg" }],
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
    marginLeft: -1.5,
    width: 3,
    height: "100%",
    backgroundColor: theme.bgCard,
  },
  innerBase: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: theme.bgCardAlt,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.primary,
    borderRadius: 3,
    position: "absolute",
    left: "50%",
  },
  pivotTip: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.primaryDark,
    position: "absolute",
    right: -7,
    top: -4,
  },
  centerCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: theme.text,
    position: "absolute",
    zIndex: 5,
  },
});

export default PivotVisualization;
