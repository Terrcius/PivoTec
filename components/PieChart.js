// components/PieChart.js

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { G, Path, Line, Circle } from "react-native-svg";

const PieChart = ({ data, rotationAngle }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.noDataText}>Sem dados de setores.</Text>
      </View>
    );
  }

  let totalPercentage = 0;

  return (
    <View style={styles.chartContainer}>
      <Svg height="150" width="150" viewBox="0 0 100 100">
        {/* Usamos a propriedade 'rotationAngle' para a rotação dinâmica. */}
        {/* O '-90' inicial garante que o primeiro setor comece no topo. */}
        <G rotation={-90 + rotationAngle} origin="50, 50">
          {data.map((slice, index) => {
            const percentage = slice.percentage;
            const startAngle = (totalPercentage * 360) / 100;
            totalPercentage += percentage;
            const endAngle = (totalPercentage * 360) / 100;

            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            const startX = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
            const startY = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
            const endX = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
            const endY = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);

            const d = `M 50,50 L ${startX},${startY} A 50,50 0 ${largeArc},1 ${endX},${endY} Z`;
            const color = slice.color;

            return <Path key={index} d={d} fill={color} />;
          })}
        </G>

        <G>
          <Line
            x1="50"
            y1="50"
            x2="50"
            y2="0"
            stroke="#353A47"
            strokeWidth="2"
          />
        </G>

        <Circle cx="50" cy="50" r="14" fill="#E5E7EB" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: 150,
    height: 150,
    position: "relative",
    alignSelf: "center",
  },
  noDataText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 50,
  },
  centerCircle: {
    width: 56,
    height: 56,
    backgroundColor: "#E5E7EB",
    borderRadius: 28,
    position: "absolute",
    top: 47,
    left: 47,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default PieChart;
