import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

// ─── Botão animado (escala no press) ────────────────────────────────────────
const AnimatedButton = ({ onPress, disabled, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const onOut = () =>
    Animated.spring(scale, {
      toValue: 1.0,
      useNativeDriver: true,
      tension: 300,
      friction: 7,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        disabled={disabled}
        style={{ flex: 1 }}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────
const MainControls = ({
  status,
  direction,
  power,
  uvLightStatus,
  waterFlow,
  uvIntensity,
  onToggleRotation,
  onToggleDirection,
  onChangePower,
  onToggleUVLight,
  onChangeFlow,
  onChangeUVIntensity,
  isConnected,
  onZeroPosition,
}) => {
  const isRotating = status === "Rodando";
  const isAntiClockwise = direction === "Anti-horário";
  const isUVOn = uvLightStatus === "Ligada";

  // Estados locais dos sliders (evita "saltos" durante arrasto)
  const [localPower, setLocalPower] = useState(power);
  const [localFlow, setLocalFlow] = useState(waterFlow);
  const [localUV, setLocalUV] = useState(uvIntensity);
  useEffect(() => setLocalPower(power), [power]);
  useEffect(() => setLocalFlow(waterFlow), [waterFlow]);
  useEffect(() => setLocalUV(uvIntensity), [uvIntensity]);

  // Animação de pulso no botão "Rodando"
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isRotating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [isRotating]);

  // Animação do ponto de conexão (pisca quando desconectado)
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      blinkAnim.stopAnimation();
      blinkAnim.setValue(1);
    }
  }, [isConnected]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Controle Principal</Text>
        <View style={styles.connRow}>
          <Animated.View
            style={[
              styles.connDot,
              isConnected ? styles.connDotOn : styles.connDotOff,
              { opacity: isConnected ? 1 : blinkAnim },
            ]}
          />
          <Text
            style={[
              styles.connText,
              isConnected ? styles.connTextOn : styles.connTextOff,
            ]}
          >
            {isConnected ? "Conectado" : "Offline"}
          </Text>
        </View>
      </View>

      {/* ── LINHA 1: Rotação + Direção ── */}
      <View style={styles.row}>
        {/* Botão de rotação com pulso */}
        <Animated.View style={[{ flex: 1, transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[
              styles.btn,
              isRotating ? styles.btnStop : styles.btnStart,
              !isConnected && styles.btnDisabled,
            ]}
            onPress={onToggleRotation}
            disabled={!isConnected}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isRotating ? "pause-circle" : "play-circle"}
              size={26}
              color={
                isRotating ? "#FFFFFF" : isConnected ? "#10B981" : "#A1A1AA"
              }
            />
            <Text
              style={[
                styles.btnTxt,
                isRotating ? styles.btnTxtStop : styles.btnTxtStart,
              ]}
            >
              {isRotating ? "Parar" : "Iniciar"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Direção */}
        <AnimatedButton
          style={{ flex: 1, marginLeft: 8 }}
          onPress={onToggleDirection}
          disabled={!isConnected}
        >
          <View
            style={[
              styles.btn,
              styles.btnSecondary,
              !isConnected && styles.btnDisabled,
              isAntiClockwise && isConnected && styles.btnActive,
            ]}
          >
            <Feather
              name="refresh-cw"
              size={22}
              color={
                isAntiClockwise && isConnected
                  ? "#3B82F6"
                  : isConnected
                    ? "#374151"
                    : "#A1A1AA"
              }
            />
            <Text
              style={[
                styles.btnTxtSec,
                isAntiClockwise && isConnected && styles.btnTxtActive,
              ]}
            >
              {isAntiClockwise ? "Anti-horário" : "Horário"}
            </Text>
          </View>
        </AnimatedButton>
      </View>

      {/* ── LINHA 2: Luz UV + Posição Inicial ── */}
      <View style={styles.row}>
        {/* Luz UV */}
        <AnimatedButton
          style={{ flex: 1 }}
          onPress={onToggleUVLight}
          disabled={!isConnected}
        >
          <View
            style={[
              styles.btn,
              styles.btnSecondary,
              !isConnected && styles.btnDisabled,
              isUVOn && isConnected && styles.btnUVOn,
            ]}
          >
            <MaterialCommunityIcons
              name={isUVOn ? "sun-wireless" : "weather-sunny-off"}
              size={24}
              color={
                isUVOn && isConnected
                  ? "#D97706"
                  : isConnected
                    ? "#374151"
                    : "#A1A1AA"
              }
            />
            <Text
              style={[
                styles.btnTxtSec,
                isUVOn && isConnected && styles.btnTxtUV,
              ]}
            >
              UV {isUVOn ? "LIGADA" : "DESLIGADA"}
            </Text>
          </View>
        </AnimatedButton>

        {/* Posição inicial */}
        <AnimatedButton
          style={{ flex: 1, marginLeft: 8 }}
          onPress={onZeroPosition}
          disabled={!isConnected || isRotating}
        >
          <View
            style={[
              styles.btn,
              styles.btnSecondary,
              (!isConnected || isRotating) && styles.btnDisabled,
            ]}
          >
            <MaterialCommunityIcons
              name="target"
              size={24}
              color={!isConnected || isRotating ? "#A1A1AA" : "#374151"}
            />
            <Text style={styles.btnTxtSec}>Pos. Inicial</Text>
          </View>
        </AnimatedButton>
      </View>

      {/* ── Sliders ── */}
      <SliderRow
        label="Vazão da Água"
        value={localFlow}
        tintColor="#3B82F6"
        disabled={!isConnected}
        onChange={setLocalFlow}
        onComplete={onChangeFlow}
        icon="💧"
      />
      <SliderRow
        label="Intensidade UV"
        value={localUV}
        tintColor="#F59E0B"
        disabled={!isConnected}
        onChange={setLocalUV}
        onComplete={onChangeUVIntensity}
        icon="☀️"
      />
      <SliderRow
        label="Potência da Rotação"
        value={localPower}
        tintColor="#EF4444"
        disabled={!isConnected}
        onChange={setLocalPower}
        onComplete={onChangePower}
        icon="⚡"
      />
    </View>
  );
};

// ─── Slider com animação de label ────────────────────────────────────────────
const SliderRow = ({
  label,
  value,
  tintColor,
  disabled,
  onChange,
  onComplete,
  icon,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const flash = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.4,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderIcon}>{icon}</Text>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Animated.Text
          style={[styles.sliderValue, { color: tintColor, opacity: fadeAnim }]}
        >
          {Math.round(value)}%
        </Animated.Text>
      </View>
      <Slider
        style={disabled ? styles.sliderOff : styles.slider}
        minimumValue={0}
        maximumValue={100}
        minimumTrackTintColor={tintColor}
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor={tintColor}
        value={value}
        onValueChange={(v) => {
          onChange(v);
          flash();
        }}
        onSlidingComplete={onComplete}
        disabled={disabled}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  connRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connDotOn: { backgroundColor: "#10B981" },
  connDotOff: { backgroundColor: "#EF4444" },
  connText: { fontSize: 12, fontWeight: "600" },
  connTextOn: { color: "#10B981" },
  connTextOff: { color: "#EF4444" },

  row: { flexDirection: "row", marginBottom: 10 },

  btn: {
    height: 64,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  btnStart: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  btnStop: { backgroundColor: "#EF4444" },
  btnSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  btnDisabled: { backgroundColor: "#F9FAFB", opacity: 0.5 },
  btnActive: { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
  btnUVOn: { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" },

  btnTxt: { fontSize: 11, fontWeight: "bold", marginTop: 4 },
  btnTxtStop: { color: "#FFFFFF" },
  btnTxtStart: { color: "#10B981" },
  btnTxtSec: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    color: "#374151",
  },
  btnTxtActive: { color: "#3B82F6" },
  btnTxtUV: { color: "#D97706" },

  sliderWrap: { marginTop: 14 },
  sliderLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 4,
  },
  sliderIcon: { fontSize: 14 },
  sliderLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: "#4B5563" },
  sliderValue: {
    fontSize: 13,
    fontWeight: "bold",
    minWidth: 36,
    textAlign: "right",
  },
  slider: { width: "100%", height: 36 },
  sliderOff: { width: "100%", height: 36, opacity: 0.35 },
});

export default MainControls;
