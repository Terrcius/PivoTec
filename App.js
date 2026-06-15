import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import PivotVisualization from "./components/PivotVisualization";
import StatusCard from "./components/StatusCard";
import MetricCard from "./components/MetricCard";
import MainControls from "./components/MainControls";
import DetailedGraphsPage from "./components/DetailedGraphsPage";
import SchedulePage from "./components/SchedulePage";
import ProfilePage from "./components/ProfilePage";
import BottomNav from "./components/BottomNav";
import SectorManager from "./components/SectorManager";
import PestDetector from "./components/PestDetector";

import { configureAWS } from "./services/awsConfig";
import { iotService } from "./services/iotService";
import { dynamoDBService } from "./services/dynamoDBService";
import { darkTheme, lightTheme } from "./theme";
import { t } from "./i18n";
import { cropById, cropName, MIN_SECTORS, MAX_SECTORS } from "./crops";

configureAWS();

// ─── Tela de Controle (Configurar) ────────────────────────────────────────────
const ConfigPage = ({
  pivotData,
  isConnected,
  onToggleRotation,
  onChangePower,
  onChangeFlow,
  onChangeUVIntensity,
  onToggleUVLight,
  onToggleDirection,
  onZeroPosition,
  theme,
  lang,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
    >
      <View style={cs(theme).header}>
        <Text style={cs(theme).headerTitle}>{t(lang, "control")}</Text>
        <Text style={cs(theme).headerSub}>{t(lang, "manual_operation")}</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 4,
          paddingBottom: 24,
        }}
      >
        <MainControls
          status={pivotData?.status?.rotation_status}
          direction={pivotData?.status?.direction}
          power={pivotData?.status?.power ?? 0}
          uvLightStatus={pivotData?.status?.uv_light_status}
          waterFlow={pivotData?.status?.water_flow ?? 0}
          uvIntensity={pivotData?.status?.uv_intensity ?? 0}
          onToggleRotation={onToggleRotation}
          onToggleDirection={onToggleDirection}
          onChangePower={onChangePower}
          onToggleUVLight={onToggleUVLight}
          onChangeFlow={onChangeFlow}
          onChangeUVIntensity={onChangeUVIntensity}
          isConnected={isConnected}
          onZeroPosition={onZeroPosition}
          theme={theme}
          lang={lang}
        />
      </ScrollView>
    </View>
  );
};

const cs = (theme) =>
  StyleSheet.create({
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { fontSize: 26, fontWeight: "bold", color: theme.text },
    headerSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  });

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const insets = useSafeAreaInsets();
  const [pivotData, setPivotData] = useState(null);
  const [pivotId, setPivotId] = useState(null);
  const [view, setView] = useState("home");
  const [graphType, setGraphType] = useState("temperature");
  const [isConnected, setIsConnected] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState({ ip: null, ver: null });
  const [sectorModal, setSectorModal] = useState(false);

  // ── Tema e Idioma ──
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState("pt");
  const theme = isDark ? darkTheme : lightTheme;

  const iotSub = useRef(null);
  const discoverySub = useRef(null);
  const lastMessageRef = useRef(Date.now());

  useEffect(() => {
    dynamoDBService
      .getPivotData(pivotId || "pivot_001")
      .then(setPivotData)
      .catch(() => setPivotData(buildDefaultData()));
  }, [pivotId]);

  const handleIoTMessage = useCallback(
    (msg) => {
      lastMessageRef.current = Date.now();
      if (msg.id && !pivotId) setPivotId(msg.id);
      if (msg.online !== undefined) {
        setIsConnected(!!msg.online);
        setDeviceInfo((d) => ({
          ip: msg.ip ?? d.ip,
          ver: msg.ver ?? d.ver,
        }));
        return;
      }
      setIsConnected(true);
      if (msg.ang !== undefined) setCurrentAngle(parseFloat(msg.ang));
      const patch = {};
      if (msg.temp !== undefined) patch.temperature = parseFloat(msg.temp);
      if (msg.umid !== undefined) patch.air_humidity = parseFloat(msg.umid);
      if (msg.solo !== undefined) patch.soil_humidity = parseFloat(msg.solo);
      if (Object.keys(patch).length > 0) {
        setPivotData((p) =>
          p ? { ...p, sensors: { ...p.sensors, ...patch } } : p,
        );
        dynamoDBService
          .saveSensorReading(pivotId || "pivot_001", patch)
          .catch(console.error);
      }
      if (msg.status)
        setPivotData((p) =>
          p ? { ...p, status: { ...p.status, ...msg.status } } : p,
        );
    },
    [pivotId],
  );

  useEffect(() => {
    try {
      discoverySub.current = iotService.discover(
        (msg) => {
          if (!pivotId) {
            setPivotId(msg.id);
            handleIoTMessage(msg);
          }
        },
        (err) =>
          console.warn("[App] ⚠️ Discovery encerrado:", err?.message || err),
      );
    } catch (err) {
      console.error("[App] Falha discovery:", err);
    }
    return () => {
      if (discoverySub.current?.unsubscribe) discoverySub.current.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!pivotId) return;
    if (discoverySub.current?.unsubscribe) discoverySub.current.unsubscribe();
    try {
      iotSub.current = iotService.subscribe(
        pivotId,
        handleIoTMessage,
        (err) => {
          setIsConnected(false);
          console.warn(
            "[App] ⚠️ Conexão MQTT interrompida:",
            err?.message || err,
          );
        },
      );
    } catch (err) {
      console.error("[App] ❌ Erro ao inscrever nos tópicos:", err);
    }
    return () => {
      if (iotSub.current?.unsubscribe) iotSub.current.unsubscribe();
    };
  }, [pivotId]);

  useEffect(() => {
    const TIMEOUT = 90_000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastMessageRef.current;
      if (elapsed > TIMEOUT && isConnected) {
        console.warn(
          `[App] ⏱️ Sem mensagens há ${Math.round(elapsed / 1000)}s → Offline`,
        );
        setIsConnected(false);
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const sendCommandViaMQTT = useCallback(
    (cmd, val = null) => {
      const message = val !== null ? { cmd, val } : { cmd };
      iotService.sendCommand(pivotId || "pivot_001", message);
    },
    [pivotId],
  );

  const patchStatus = useCallback(
    (patch) => {
      setPivotData((p) => {
        if (!p) return p;
        const merged = { ...p.status, ...patch };
        dynamoDBService
          .updateStatus(pivotId || "pivot_001", merged)
          .catch(console.error);
        return { ...p, status: merged };
      });
    },
    [pivotId],
  );

  const handleToggleRotation = useCallback(() => {
    if (!pivotData || !isConnected) return;
    const next =
      pivotData.status.rotation_status === "Rodando" ? "Parado" : "Rodando";
    sendCommandViaMQTT(next === "Rodando" ? "ON" : "OFF");
    patchStatus({ rotation_status: next });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleToggleDirection = useCallback(() => {
    if (!pivotData || !isConnected) return;
    const currentPower = Math.abs(pivotData.status.power) || 17;
    const isCurrentlyClockwise = pivotData.status.direction === "Horário";
    const newVal = isCurrentlyClockwise ? -currentPower : currentPower;
    const nextDirectionText = isCurrentlyClockwise ? "Anti-horário" : "Horário";
    sendCommandViaMQTT("VEL", newVal);
    patchStatus({ direction: nextDirectionText, power: currentPower });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleChangePower = useCallback(
    (v) => {
      if (!isConnected || !pivotData) return;
      const power = Math.abs(parseInt(v)) || 17;
      const isAntiClockwise = pivotData.status.direction === "Anti-horário";
      const val = isAntiClockwise ? -power : power;
      sendCommandViaMQTT("VEL", val);
      patchStatus({ power });
    },
    [pivotData, isConnected, sendCommandViaMQTT, patchStatus],
  );

  const handleChangeFlow = useCallback(
    (v) => {
      if (!isConnected) return;
      const f = Math.round(v);
      sendCommandViaMQTT("BOMBA", f);
      patchStatus({
        water_flow: f,
        water_pump_status: f > 0 ? "Ligada" : "Desligada",
      });
    },
    [isConnected, sendCommandViaMQTT, patchStatus],
  );

  const handleChangeUVIntensity = useCallback(
    (v) => {
      if (!isConnected) return;
      const i = Math.round(v);
      sendCommandViaMQTT("LED", i);
      patchStatus({
        uv_intensity: i,
        uv_light_status: i > 0 ? "Ligada" : "Desligada",
      });
    },
    [isConnected, sendCommandViaMQTT, patchStatus],
  );

  const handleToggleUVLight = useCallback(() => {
    if (!isConnected) return;
    const on = pivotData?.status?.uv_light_status !== "Ligada";
    sendCommandViaMQTT("LED", on ? 100 : 0);
    patchStatus({
      uv_light_status: on ? "Ligada" : "Desligada",
      uv_intensity: on ? 100 : 0,
    });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleZeroPosition = useCallback(() => {
    if (isConnected) sendCommandViaMQTT("ZERAR");
  }, [isConnected, sendCommandViaMQTT]);

  const handleToggleSector = useCallback(
    (key) => {
      if (
        !pivotData?.sectors?.[key] ||
        !isConnected ||
        pivotData.status.rotation_status === "Rodando"
      )
        return;
      const newActive = !pivotData.sectors[key].is_active;
      setPivotData((p) => {
        if (!p) return p;
        const sectors = {
          ...p.sectors,
          [key]: { ...p.sectors[key], is_active: newActive },
        };
        dynamoDBService
          .updateSectors(pivotId || "pivot_001", sectors)
          .catch(console.error);
        return { ...p, sectors };
      });
    },
    [pivotData, isConnected, pivotId],
  );

  const handleAddSector = useCallback(() => {
    setPivotData((p) => {
      if (!p) return p;
      const keys = Object.keys(p.sectors);
      if (keys.length >= MAX_SECTORS) return p;
      // Próximo índice livre (1..4)
      let idx = 1;
      while (p.sectors[`sector_${idx}`]) idx += 1;
      const crop = cropById("milho");
      const sectors = {
        ...p.sectors,
        [`sector_${idx}`]: {
          cropId: crop.id,
          crop: cropName("pt", crop.id),
          color: crop.color,
          moisture: 0,
          is_active: false,
        },
      };
      dynamoDBService
        .updateSectors(pivotId || "pivot_001", sectors)
        .catch(console.error);
      return { ...p, sectors };
    });
  }, [pivotId]);

  const handleChangeCrop = useCallback(
    (key, cropId) => {
      setPivotData((p) => {
        if (!p?.sectors?.[key]) return p;
        const crop = cropById(cropId);
        const sectors = {
          ...p.sectors,
          [key]: {
            ...p.sectors[key],
            cropId: crop.id,
            crop: cropName("pt", crop.id),
            color: crop.color,
          },
        };
        dynamoDBService
          .updateSectors(pivotId || "pivot_001", sectors)
          .catch(console.error);
        return { ...p, sectors };
      });
    },
    [pivotId],
  );

  const handleDeleteSector = useCallback(
    (key) => {
      setPivotData((p) => {
        if (!p?.sectors?.[key]) return p;
        if (Object.keys(p.sectors).length <= MIN_SECTORS) return p;
        const sectors = { ...p.sectors };
        delete sectors[key];
        dynamoDBService
          .updateSectors(pivotId || "pivot_001", sectors)
          .catch(console.error);
        return { ...p, sectors };
      });
    },
    [pivotId],
  );

  const openGraph = useCallback((type) => {
    setGraphType(type);
    setView("dados");
  }, []);

  if (!pivotData) {
    return (
      <View style={[styles(theme).loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles(theme).loadingText}>{t(lang, "loading")}</Text>
      </View>
    );
  }

  const isRotating = pivotData.status.rotation_status === "Rodando";
  const st = styles(theme);

  // ─── Tela ativa ────────────────────────────────────────────────────────────
  let screen;
  if (view === "config") {
    screen = (
      <ConfigPage
        pivotData={pivotData}
        isConnected={isConnected}
        onToggleRotation={handleToggleRotation}
        onChangePower={handleChangePower}
        onChangeFlow={handleChangeFlow}
        onChangeUVIntensity={handleChangeUVIntensity}
        onToggleUVLight={handleToggleUVLight}
        onToggleDirection={handleToggleDirection}
        onZeroPosition={handleZeroPosition}
        theme={theme}
        lang={lang}
      />
    );
  } else if (view === "schedule") {
    screen = <SchedulePage theme={theme} lang={lang} />;
  } else if (view === "pragas") {
    screen = (
      <View
        style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
      >
        <PestDetector theme={theme} lang={lang} />
      </View>
    );
  } else if (view === "dados") {
    screen = (
      <DetailedGraphsPage initialType={graphType} theme={theme} lang={lang} />
    );
  } else if (view === "perfil") {
    screen = (
      <ProfilePage
        pivotId={pivotId}
        deviceInfo={deviceInfo}
        isConnected={isConnected}
        theme={theme}
        isDark={isDark}
        onToggleTheme={() => setIsDark((v) => !v)}
        lang={lang}
        onToggleLang={setLang}
      />
    );
  } else {
    screen = (
      <View style={[st.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={st.content}>
          {/* Header */}
          <View style={st.header}>
            <View style={st.headerLeft}>
              <View style={st.logoCircle}>
                <Ionicons name="leaf" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={st.headerTitle}>Pivô Tec</Text>
                <Text style={st.headerSub}>
                  {pivotId ? pivotId : t(lang, "waiting_pivot")}
                  {deviceInfo.ver ? `  ·  v${deviceInfo.ver}` : ""}
                </Text>
              </View>
            </View>
            <View
              style={[
                st.badge,
                {
                  backgroundColor: isConnected
                    ? theme.primarySoft
                    : theme.dangerSoft,
                },
              ]}
            >
              <View
                style={[
                  st.dot,
                  {
                    backgroundColor: isConnected ? theme.primary : theme.danger,
                  },
                ]}
              />
              <Text
                style={[
                  st.badgeText,
                  { color: isConnected ? theme.primary : theme.danger },
                ]}
              >
                {isConnected ? t(lang, "online") : t(lang, "offline")}
              </Text>
            </View>
          </View>

          {/* Info do dispositivo */}
          {pivotId && (deviceInfo.ip || deviceInfo.ver) && (
            <View style={st.deviceRow}>
              <Ionicons
                name="hardware-chip-outline"
                size={15}
                color={theme.textMuted}
              />
              {deviceInfo.ip && (
                <Text style={st.deviceText}>IP {deviceInfo.ip}</Text>
              )}
              {deviceInfo.ip && deviceInfo.ver && (
                <Text style={st.deviceDivider}>·</Text>
              )}
              {deviceInfo.ver && (
                <Text style={st.deviceText}>
                  {t(lang, "firmware")} v{deviceInfo.ver}
                </Text>
              )}
            </View>
          )}

          {/* Aguardando pivô */}
          {!pivotId && (
            <View style={st.waitingCard}>
              <Ionicons name="wifi-outline" size={36} color={theme.textMuted} />
              <Text style={st.waitingTitle}>
                {t(lang, "waiting_connection")}
              </Text>
              <Text style={st.waitingSub}>{t(lang, "waiting_sub")}</Text>
            </View>
          )}

          {/* Visualização */}
          <View style={st.card}>
            <View style={st.cardHeaderRow}>
              <Text style={st.cardTitle}>{t(lang, "pivot_position")}</Text>
              <View style={st.angleChip}>
                <Text style={st.angleChipText}>
                  {Math.round(currentAngle)}°
                </Text>
              </View>
            </View>
            <PivotVisualization
              angle={currentAngle}
              sectors={pivotData.sectors}
              theme={theme}
            />
            <TouchableOpacity
              style={[
                st.rotateBtn,
                isRotating ? st.rotateBtnStop : st.rotateBtnStart,
                !isConnected && st.rotateBtnDisabled,
              ]}
              onPress={handleToggleRotation}
              disabled={!isConnected}
            >
              <Ionicons
                name={isRotating ? "pause" : "play"}
                size={18}
                color={isRotating ? "#FFF" : theme.primary}
              />
              <Text
                style={[
                  st.rotateBtnText,
                  { color: isRotating ? "#FFF" : theme.primary },
                ]}
              >
                {isRotating
                  ? t(lang, "stop_rotation")
                  : t(lang, "start_rotation")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Métricas */}
          <View style={st.metricsRow}>
            <MetricCard
              icon="thermometer"
              accent={theme.accentOrange}
              value={
                pivotData.sensors?.temperature !== undefined
                  ? `${pivotData.sensors.temperature}°C`
                  : "--°C"
              }
              label={t(lang, "temperature")}
              onClick={() => openGraph("temperature")}
              theme={theme}
            />
            <MetricCard
              icon="water"
              accent={theme.accentBlue}
              value={
                pivotData.sensors?.soil_humidity !== undefined
                  ? `${pivotData.sensors.soil_humidity}%`
                  : "--%"
              }
              label={t(lang, "soil_humidity")}
              onClick={() => openGraph("soil_humidity")}
              theme={theme}
            />
            <MetricCard
              icon="cloud"
              accent={theme.accentPurple}
              value={
                pivotData.sensors?.air_humidity !== undefined
                  ? `${pivotData.sensors.air_humidity}%`
                  : "--%"
              }
              label={t(lang, "air_humidity")}
              onClick={() => openGraph("air_humidity")}
              theme={theme}
            />
          </View>

          {/* Setores */}
          <View style={st.card}>
            <View style={st.cardHeaderRow}>
              <Text style={st.cardTitle}>{t(lang, "sector_status")}</Text>
              <TouchableOpacity
                style={st.manageBtn}
                onPress={() => setSectorModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text style={st.manageBtnText}>{t(lang, "manage")}</Text>
              </TouchableOpacity>
            </View>
            {!isConnected && (
              <Text style={st.reconnectText}>{t(lang, "connecting_mqtt")}</Text>
            )}
            <View style={{ marginTop: 10 }}>
              {Object.keys(pivotData.sectors)
                .sort()
                .map((key) => {
                  const s = pivotData.sectors[key];
                  return (
                    <StatusCard
                      key={key}
                      label={
                        s.cropId ? cropName(lang, s.cropId) : s.crop || key
                      }
                      value={`${s.moisture ?? 0}%`}
                      status={s.is_active}
                      color={s.color}
                      onToggle={() => handleToggleSector(key)}
                      isAdjustable={isConnected && !isRotating}
                      theme={theme}
                    />
                  );
                })}
            </View>
          </View>
        </ScrollView>

        <SectorManager
          visible={sectorModal}
          onClose={() => setSectorModal(false)}
          sectors={pivotData.sectors}
          onAddSector={handleAddSector}
          onChangeCrop={handleChangeCrop}
          onDeleteSector={handleDeleteSector}
          theme={theme}
          lang={lang}
        />
      </View>
    );
  }

  return (
    <View style={st.shell}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />
      <View style={{ flex: 1 }}>{screen}</View>
      <BottomNav active={view} onChange={setView} theme={theme} lang={lang} />
    </View>
  );
};

const buildDefaultData = () => ({
  status: {
    rotation_status: "Parado",
    direction: "Horário",
    power: 17,
    uv_light_status: "Desligada",
    water_pump_status: "Desligada",
    water_flow: 0,
    uv_intensity: 0,
  },
  sectors: {
    sector_1: {
      cropId: "milho",
      crop: "Milho",
      moisture: 70,
      is_active: false,
      color: "#FBBF24",
    },
    sector_2: {
      cropId: "soja",
      crop: "Soja",
      moisture: 65,
      is_active: true,
      color: "#34D399",
    },
  },
  sensors: { temperature: 30, soil_humidity: 68, air_humidity: 55 },
});

const styles = (theme) =>
  StyleSheet.create({
    shell: { flex: 1, backgroundColor: theme.bg },
    root: { flex: 1, backgroundColor: theme.bg },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },
    loadingText: { marginTop: 10, fontSize: 16, color: theme.textMuted },
    content: { padding: 14, paddingBottom: 30 },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.bgCard,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerTitle: { fontSize: 22, fontWeight: "bold", color: theme.text },
    headerSub: { fontSize: 11, color: theme.textMuted, marginTop: 1 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
    badgeText: { fontSize: 12, fontWeight: "600" },

    waitingCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 28,
      alignItems: "center",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    waitingTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 10,
      marginBottom: 4,
    },
    waitingSub: { fontSize: 13, color: theme.textMuted, textAlign: "center" },

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
      marginBottom: 4,
    },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: theme.text },
    angleChip: {
      backgroundColor: theme.bgCardAlt,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    angleChipText: { color: theme.primary, fontSize: 13, fontWeight: "600" },

    rotateBtn: {
      marginTop: 14,
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    rotateBtnStart: {
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    rotateBtnStop: { backgroundColor: theme.danger },
    rotateBtnDisabled: { opacity: 0.4 },
    rotateBtnText: { fontSize: 16, fontWeight: "bold" },

    metricsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 14,
      gap: 10,
    },

    reconnectText: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: "bold",
      marginTop: 6,
    },

    manageBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.bgCardAlt,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    manageBtnText: { fontSize: 12, fontWeight: "600", color: theme.primary },

    deviceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: -6,
      marginBottom: 14,
      paddingHorizontal: 2,
    },
    deviceText: { fontSize: 12, color: theme.textMuted },
    deviceDivider: { fontSize: 12, color: theme.textFaint },
  });

const AppWrapper = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

export default AppWrapper;
