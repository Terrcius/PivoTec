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
import { t } from "../i18n";

// ─── Botão animado ────────────────────────────────────────────────────────────
const AnimatedButton = ({ onPress, disabled, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
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

// ─── Botão de grade ───────────────────────────────────────────────────────────
const GridButton = ({
  icon,
  title,
  subtitle,
  active,
  disabled,
  variant,
  accent,
  theme,
}) => {
  const stop = variant === "stop";
  const start = variant === "start";
  const s = styles(theme);
  return (
    <View
      style={[
        s.gridBtn,
        stop && s.gridBtnStop,
        start && s.gridBtnStart,
        active && !stop && s.gridBtnActive,
        disabled && s.gridBtnDisabled,
      ]}
    >
      {icon}
      <Text
        style={[
          s.gridTitle,
          stop && { color: "#FFFFFF" },
          active && accent ? { color: accent } : null,
        ]}
      >
        {title}
      </Text>
      <Text style={[s.gridSub, stop && { color: "rgba(255,255,255,0.8)" }]}>
        {subtitle}
      </Text>
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
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
  theme,
  lang,
}) => {
  const isRotating = status === "Rodando";
  const isAntiClockwise = direction === "Anti-horário";
  const isUVOn = uvLightStatus === "Ligada";

  const [localPower, setLocalPower] = useState(power);
  const [localFlow, setLocalFlow] = useState(waterFlow);
  const [localUV, setLocalUV] = useState(uvIntensity);
  useEffect(() => setLocalPower(power), [power]);
  useEffect(() => setLocalFlow(waterFlow), [waterFlow]);
  useEffect(() => setLocalUV(uvIntensity), [uvIntensity]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isRotating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
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

  const iconColor = (activeColor, on) =>
    !isConnected ? theme.textFaint : on ? activeColor : theme.textMuted;

  const s = styles(theme);

  return (
    <View style={s.card}>
      <View style={s.cardHeaderRow}>
        <Text style={s.cardTitle}>{t(lang, "main_control")}</Text>
        <Text style={[s.statusText, isRotating && { color: theme.primary }]}>
          {isRotating ? t(lang, "running") : t(lang, "stopped")}
        </Text>
      </View>

      {/* ── LINHA 1: Rotação + Direção ── */}
      <View style={s.row}>
        <Animated.View style={[{ flex: 1, transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            onPress={onToggleRotation}
            disabled={!isConnected}
            activeOpacity={0.85}
          >
            <GridButton
              theme={theme}
              variant={isRotating ? "stop" : "start"}
              disabled={!isConnected}
              icon={
                <Ionicons
                  name={isRotating ? "pause" : "play"}
                  size={26}
                  color={
                    isRotating
                      ? "#FFFFFF"
                      : isConnected
                        ? theme.primary
                        : theme.textFaint
                  }
                />
              }
              title={isRotating ? t(lang, "stop") : t(lang, "start")}
              subtitle={t(lang, "rotation")}
            />
          </TouchableOpacity>
        </Animated.View>

        <AnimatedButton
          style={{ flex: 1, marginLeft: 10 }}
          onPress={onToggleDirection}
          disabled={!isConnected}
        >
          <GridButton
            theme={theme}
            variant="secondary"
            disabled={!isConnected}
            active={isAntiClockwise}
            accent={theme.accentBlue}
            icon={
              <Feather
                name="refresh-cw"
                size={22}
                color={iconColor(theme.accentBlue, isAntiClockwise)}
              />
            }
            title={
              isAntiClockwise ? t(lang, "anticlockwise") : t(lang, "clockwise")
            }
            subtitle={t(lang, "direction")}
          />
        </AnimatedButton>
      </View>

      {/* ── LINHA 2: Luz UV + Posição Inicial ── */}
      <View style={s.row}>
        <AnimatedButton
          style={{ flex: 1 }}
          onPress={onToggleUVLight}
          disabled={!isConnected}
        >
          <GridButton
            theme={theme}
            variant="secondary"
            disabled={!isConnected}
            active={isUVOn}
            accent={theme.accentAmber}
            icon={
              <MaterialCommunityIcons
                name={isUVOn ? "white-balance-sunny" : "weather-sunny-off"}
                size={24}
                color={iconColor(theme.accentAmber, isUVOn)}
              />
            }
            title={isUVOn ? t(lang, "uv_on") : t(lang, "uv_off")}
            subtitle={t(lang, "uv_light")}
          />
        </AnimatedButton>

        <AnimatedButton
          style={{ flex: 1, marginLeft: 10 }}
          onPress={onZeroPosition}
          disabled={!isConnected || isRotating}
        >
          <GridButton
            theme={theme}
            variant="secondary"
            disabled={!isConnected || isRotating}
            icon={
              <MaterialCommunityIcons
                name="target"
                size={24}
                color={
                  !isConnected || isRotating ? theme.textFaint : theme.primary
                }
              />
            }
            title={t(lang, "reposition")}
            subtitle={t(lang, "initial_position")}
          />
        </AnimatedButton>
      </View>

      <View style={s.divider} />

      {/* ── Sliders ── */}
      <SliderRow
        label={t(lang, "water_flow")}
        value={localFlow}
        tintColor={theme.accentBlue}
        disabled={!isConnected}
        onChange={setLocalFlow}
        onComplete={onChangeFlow}
        icon="💧"
        theme={theme}
      />
      <SliderRow
        label={t(lang, "uv_intensity")}
        value={localUV}
        tintColor={theme.accentAmber}
        disabled={!isConnected}
        onChange={setLocalUV}
        onComplete={onChangeUVIntensity}
        icon="☀️"
        theme={theme}
      />
      <SliderRow
        label={t(lang, "rotation_power")}
        value={localPower}
        tintColor={theme.primary}
        disabled={!isConnected}
        onChange={setLocalPower}
        onComplete={onChangePower}
        icon="⚡"
        theme={theme}
      />
    </View>
  );
};

// ─── Slider ───────────────────────────────────────────────────────────────────
const SliderRow = ({
  label,
  value,
  tintColor,
  disabled,
  onChange,
  onComplete,
  icon,
  theme,
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
  const s = styles(theme);
  return (
    <View style={s.sliderWrap}>
      <View style={s.sliderLabelRow}>
        <Text style={s.sliderIcon}>{icon}</Text>
        <Text style={s.sliderLabel}>{label}</Text>
        <Animated.Text
          style={[s.sliderValue, { color: tintColor, opacity: fadeAnim }]}
        >
          {Math.round(value)}%
        </Animated.Text>
      </View>
      <Slider
        style={disabled ? s.sliderOff : s.slider}
        minimumValue={0}
        maximumValue={100}
        minimumTrackTintColor={tintColor}
        maximumTrackTintColor={theme.track}
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
const styles = (theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.bgCard,
      padding: 16,
      borderRadius: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: theme.text },
    statusText: { fontSize: 13, fontWeight: "600", color: theme.textMuted },

    row: { flexDirection: "row", marginBottom: 10 },

    gridBtn: {
      minHeight: 96,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "flex-start",
      paddingVertical: 14,
      paddingHorizontal: 14,
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    gridBtnStart: {
      backgroundColor: theme.primarySoft,
      borderColor: theme.primary,
    },
    gridBtnStop: { backgroundColor: theme.danger, borderColor: theme.danger },
    gridBtnActive: { borderColor: theme.primary },
    gridBtnDisabled: { opacity: 0.45 },
    gridTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 10,
    },
    gridSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginTop: 6,
      marginBottom: 10,
    },

    sliderWrap: { marginTop: 14 },
    sliderLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
      gap: 6,
    },
    sliderIcon: { fontSize: 14 },
    sliderLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
    sliderValue: {
      fontSize: 13,
      fontWeight: "bold",
      minWidth: 36,
      textAlign: "right",
    },
    slider: { width: "100%", height: 36 },
    sliderOff: { width: "100%", height: 36, opacity: 0.4 },
  });

export default MainControls;