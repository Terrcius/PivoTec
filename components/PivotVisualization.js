import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, G, Line } from "react-native-svg";

const CX = 50;
const CY = 50;
const R = 40; // raio do anel (linha central do traço)
const STROKE = 11; // espessura do anel

// Converte #RRGGBB + alpha em rgba()
const hexToRgba = (hex, a) => {
  const h = (hex || "#22C55E").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Ponto na circunferência (0° = topo, sentido horário)
const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

// Caminho de um arco entre dois ângulos
const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

const PivotVisualization = ({ angle, sectors = {}, theme }) => {
  const keys = Object.keys(sectors).sort();
  const n = Math.max(keys.length, 1);
  const gap = n > 1 ? 6 : 0; // separação visual entre setores (graus)
  const seg = 360 / n;
  const armLen = R - STROKE / 2;

  const colorFor = (s) => {
    const c = s?.color || theme.primary;
    return s?.is_active ? c : hexToRgba(c, 0.22);
  };

  return (
    <View style={styles.container}>
      <Svg width={180} height={180} viewBox="0 0 100 100">
        {/* Anel base (fundo) */}
        <Circle
          cx={CX}
          cy={CY}
          r={R}
          stroke={theme.bgCardAlt}
          strokeWidth={STROKE}
          fill="none"
        />

        {/* Setores */}
        {n === 1 ? (
          <Circle
            cx={CX}
            cy={CY}
            r={R}
            stroke={colorFor(sectors[keys[0]])}
            strokeWidth={STROKE}
            fill="none"
          />
        ) : (
          keys.map((k, i) => (
            <Path
              key={k}
              d={arcPath(CX, CY, R, i * seg + gap / 2, (i + 1) * seg - gap / 2)}
              stroke={colorFor(sectors[k])}
              strokeWidth={STROKE}
              strokeLinecap="butt"
              fill="none"
            />
          ))
        )}

        {/* Base interna */}
        <Circle
          cx={CX}
          cy={CY}
          r={R - STROKE}
          fill={theme.bgCardAlt}
          stroke={theme.border}
          strokeWidth={0.5}
        />

        {/* Braço rotativo do pivô */}
        <G rotation={angle} origin={`${CX}, ${CY}`}>
          <Line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - armLen}
            stroke={theme.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Circle cx={CX} cy={CY - armLen} r={3.5} fill={theme.primaryDark} />
        </G>

        {/* Centro */}
        <Circle cx={CX} cy={CY} r={3.5} fill={theme.text} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
  },
});

export default PivotVisualization;
