import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet, View, Text, ScrollView,
  ActivityIndicator, TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import PivotVisualization from "./components/PivotVisualization";
import StatusCard         from "./components/StatusCard";
import MetricCard         from "./components/MetricCard";
import MainControls       from "./components/MainControls";
import DetailedGraphsPage from "./components/DetailedGraphsPage";
import SchedulePage       from "./components/SchedulePage";

import { configureAWS }    from "./services/awsConfig";
import { iotService }      from "./services/iotService";
import { dynamoDBService } from "./services/dynamoDBService";
import { theme }           from "./theme";

configureAWS();

// ─── Tela de Configuração ─────────────────────────────────────────────────────
const ConfigPage = ({
  pivotData, isConnected, onGoBack, onToggleRotation,
  onChangePower, onChangeFlow, onChangeUVIntensity,
  onToggleUVLight, onToggleDirection, onZeroPosition,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      <View style={cs.header}>
        <TouchableOpacity onPress={onGoBack} style={cs.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={cs.headerTitle}>Configurações do Pivô</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
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
        />
      </ScrollView>
    </View>
  );
};

const cs = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: theme.bgCard, paddingHorizontal: 12, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backBtn:     { padding: 6, marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: theme.text },
});

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const insets = useSafeAreaInsets();
  const [pivotData,    setPivotData]    = useState(null);
  const [pivotId,      setPivotId]      = useState(null);
  const [view,         setView]         = useState("home");
  const [isConnected,  setIsConnected]  = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);

  const iotSub        = useRef(null);
  const discoverySub  = useRef(null);
  const lastMessageRef = useRef(Date.now());

  useEffect(() => {
    dynamoDBService.getPivotData(pivotId || "pivot_001")
      .then(setPivotData)
      .catch(() => setPivotData(buildDefaultData()));
  }, [pivotId]);

  const handleIoTMessage = useCallback((msg) => {
    lastMessageRef.current = Date.now();
    if (msg.id && !pivotId) {
      setPivotId(msg.id);
      setIsConnected(true);
      return;
    }
    setIsConnected(true);
    if (msg.ang !== undefined) setCurrentAngle(parseFloat(msg.ang));
    const patch = {};
    if (msg.temp !== undefined) patch.temperature   = parseFloat(msg.temp);
    if (msg.umid !== undefined) patch.air_humidity  = parseFloat(msg.umid);
    if (msg.solo !== undefined) patch.soil_humidity = parseFloat(msg.solo);
    if (Object.keys(patch).length > 0) {
      setPivotData(p => p ? { ...p, sensors: { ...p.sensors, ...patch } } : p);
      dynamoDBService.saveSensorReading(pivotId || "pivot_001", patch).catch(console.error);
    }
    if (msg.status) setPivotData(p => p ? { ...p, status: { ...p.status, ...msg.status } } : p);
  }, [pivotId]);

  useEffect(() => {
    try {
      discoverySub.current = iotService.discover(
        (msg) => {
          if (!pivotId) { setPivotId(msg.id); setIsConnected(true); handleIoTMessage(msg); }
        },
        (err) => console.warn("[App] Discovery encerrado:", err?.message || err),
      );
    } catch (err) { console.error("[App] Falha discovery:", err); }
    return () => { if (discoverySub.current?.unsubscribe) discoverySub.current.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!pivotId) return;
    if (discoverySub.current?.unsubscribe) discoverySub.current.unsubscribe();
    try {
      iotSub.current = iotService.subscribe(pivotId, handleIoTMessage,
        (err) => { setIsConnected(false); console.warn("[App] MQTT interrompida:", err?.message || err); });
    } catch (err) { console.error("[App] Erro subscribe:", err); }
    return () => { if (iotSub.current?.unsubscribe) iotSub.current.unsubscribe(); };
  }, [pivotId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastMessageRef.current > 90_000 && isConnected) setIsConnected(false);
    }, 15_000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const sendCommandViaMQTT = useCallback((cmd, val = null) => {
    const message = val !== null ? { cmd, val } : { cmd };
    iotService.sendCommand(pivotId || "pivot_001", message);
  }, [pivotId]);

  const patchStatus = useCallback((patch) => {
    setPivotData(p => {
      if (!p) return p;
      const merged = { ...p.status, ...patch };
      dynamoDBService.updateStatus(pivotId || "pivot_001", merged).catch(console.error);
      return { ...p, status: merged };
    });
  }, [pivotId]);

  const handleToggleRotation = useCallback(() => {
    if (!pivotData || !isConnected) return;
    const next = pivotData.status.rotation_status === "Rodando" ? "Parado" : "Rodando";
    sendCommandViaMQTT(next === "Rodando" ? "ON" : "OFF");
    patchStatus({ rotation_status: next });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleToggleDirection = useCallback(() => {
    if (!pivotData || !isConnected) return;
    const cp = Math.abs(pivotData.status.power || 50);
    const anti = pivotData.status.direction === "Horário";
    sendCommandViaMQTT("VEL", anti ? -cp : cp);
    patchStatus({ direction: anti ? "Anti-horário" : "Horário", power: cp });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleChangePower = useCallback((v) => {
    const power = parseInt(v);
    const anti = pivotData?.status?.direction === "Anti-horário";
    sendCommandViaMQTT("VEL", anti ? -Math.abs(power) : Math.abs(power));
    patchStatus({ power: Math.abs(power) });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleChangeFlow = useCallback((v) => {
    const f = Math.round(v);
    sendCommandViaMQTT("BOMBA", f);
    patchStatus({ water_flow: f, water_pump_status: f > 0 ? "Ligada" : "Desligada" });
  }, [isConnected, sendCommandViaMQTT, patchStatus]);

  const handleChangeUVIntensity = useCallback((v) => {
    const i = Math.round(v);
    sendCommandViaMQTT("LED", i);
    patchStatus({ uv_intensity: i, uv_light_status: i > 0 ? "Ligada" : "Desligada" });
  }, [isConnected, sendCommandViaMQTT, patchStatus]);

  const handleToggleUVLight = useCallback(() => {
    const on = pivotData?.status?.uv_light_status !== "Ligada";
    sendCommandViaMQTT("LED", on ? 100 : 0);
    patchStatus({ uv_light_status: on ? "Ligada" : "Desligada", uv_intensity: on ? 100 : 0 });
  }, [pivotData, isConnected, sendCommandViaMQTT, patchStatus]);

  const handleZeroPosition = useCallback(() => { if (isConnected) sendCommandViaMQTT("ZERAR"); }, [isConnected, sendCommandViaMQTT]);

  const handleToggleSector = useCallback((key) => {
    if (!pivotData?.sectors?.[key] || !isConnected || pivotData.status.rotation_status === "Rodando") return;
    const newActive = !pivotData.sectors[key].is_active;
    setPivotData(p => {
      if (!p) return p;
      const sectors = { ...p.sectors, [key]: { ...p.sectors[key], is_active: newActive } };
      dynamoDBService.updateStatus(pivotId || "pivot_001", { ...p.status, sectors }).catch(console.error);
      return { ...p, sectors };
    });
  }, [pivotData, isConnected, pivotId]);

  if (!pivotData) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Carregando dados do pivô...</Text>
      </View>
    );
  }

  if (view === "schedule") return <SchedulePage onGoBack={() => setView("home")} />;
  if (view === "config") return (
    <ConfigPage
      pivotData={pivotData} isConnected={isConnected}
      onGoBack={() => setView("home")}
      onToggleRotation={handleToggleRotation}
      onChangePower={handleChangePower}
      onChangeFlow={handleChangeFlow}
      onChangeUVIntensity={handleChangeUVIntensity}
      onToggleUVLight={handleToggleUVLight}
      onToggleDirection={handleToggleDirection}
      onZeroPosition={handleZeroPosition}
    />
  );

  const GRAPH_VIEWS = {
    temp:            { type: "Temperatura",     unit: "°C", color: "#FB923C" },
    "soil-humidity": { type: "Umidade do Solo", unit: "%",  color: "#38BDF8" },
    "air-humidity":  { type: "Umidade do Ar",   unit: "%",  color: "#A78BFA" },
  };
  if (GRAPH_VIEWS[view]) return <DetailedGraphsPage {...GRAPH_VIEWS[view]} onGoBack={() => setView("home")} />;

  const isRotating = pivotData.status.rotation_status === "Rodando";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Pivô Tec</Text>
              <Text style={styles.headerSub}>
                {pivotId ? pivotId : "Aguardando pivô..."}
              </Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: isConnected ? "#16352E" : "#3A1E1E" }]}>
            <View style={[styles.dot, { backgroundColor: isConnected ? theme.primary : theme.danger }]} />
            <Text style={[styles.badgeText, { color: isConnected ? theme.primary : theme.danger }]}>
              {isConnected ? "Em operação" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Aguardando pivô */}
        {!pivotId && (
          <View style={styles.waitingCard}>
            <Ionicons name="wifi-outline" size={36} color={theme.textMuted} />
            <Text style={styles.waitingTitle}>Aguardando conexão</Text>
            <Text style={styles.waitingSub}>Ligue o pivô e aguarde a conexão via MQTT</Text>
          </View>
        )}

        {/* Visualização */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Posição do Pivô</Text>
            <View style={styles.angleChip}>
              <Text style={styles.angleChipText}>{Math.round(currentAngle)}°</Text>
            </View>
          </View>
          <PivotVisualization angle={currentAngle} sectors={pivotData.sectors} />
          <TouchableOpacity
            style={[styles.rotateBtn, isRotating ? styles.rotateBtnStop : styles.rotateBtnStart, !isConnected && styles.rotateBtnDisabled]}
            onPress={handleToggleRotation}
            disabled={!isConnected}
          >
            <Ionicons name={isRotating ? "pause" : "play"} size={18} color={isRotating ? "#FFF" : theme.primary} />
            <Text style={[styles.rotateBtnText, { color: isRotating ? "#FFF" : theme.primary }]}>
              {isRotating ? "Parar Rotação" : "Iniciar Rotação"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="thermometer" accent="#FB923C"
            value={pivotData.sensors?.temperature !== undefined ? `${pivotData.sensors.temperature}°C` : "--°C"}
            label="Temperatura" onClick={() => setView("temp")}
          />
          <MetricCard
            icon="water" accent="#38BDF8"
            value={pivotData.sensors?.soil_humidity !== undefined ? `${pivotData.sensors.soil_humidity}%` : "--%"}
            label="Umid. Solo" onClick={() => setView("soil-humidity")}
          />
          <MetricCard
            icon="cloud" accent="#A78BFA"
            value={pivotData.sensors?.air_humidity !== undefined ? `${pivotData.sensors.air_humidity}%` : "--%"}
            label="Umid. Ar" onClick={() => setView("air-humidity")}
          />
        </View>

        {/* Ações */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setView("config")}>
            <Ionicons name="settings-outline" size={22} color={theme.primary} />
            <Text style={styles.actionBtnText}>Configurar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setView("schedule")}>
            <Ionicons name="calendar-outline" size={22} color={theme.primary} />
            <Text style={styles.actionBtnText}>Agendar</Text>
          </TouchableOpacity>
        </View>

        {/* Setores */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status dos Setores</Text>
          {!isConnected && <Text style={styles.reconnectText}>Conectando ao barramento MQTT…</Text>}
          <View style={{ marginTop: 10 }}>
            {Object.keys(pivotData.sectors).sort().map((key) => {
              const s = pivotData.sectors[key];
              return (
                <StatusCard
                  key={key}
                  label={s.crop || key} value={`${s.moisture ?? 0}%`}
                  status={s.is_active} color={s.color}
                  onToggle={() => handleToggleSector(key)}
                  isAdjustable={isConnected && !isRotating}
                />
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const buildDefaultData = () => ({
  status: { rotation_status: "Parado", direction: "Horário", power: 17,
    uv_light_status: "Desligada", water_pump_status: "Desligada", water_flow: 0, uv_intensity: 0 },
  sectors: {
    sector_1: { crop: "Milho", moisture: 70, is_active: false, color: "#FBBF24" },
    sector_2: { crop: "Soja",  moisture: 65, is_active: true,  color: "#34D399" },
  },
  sensors: { temperature: 30, soil_humidity: 68, air_humidity: 55 },
});

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: theme.bg },
  loading:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg },
  loadingText: { marginTop: 10, fontSize: 16, color: theme.textMuted },
  content:     { padding: 14, paddingBottom: 30 },

  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.bgCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border },
  headerTitle:{ fontSize: 22, fontWeight: "bold", color: theme.text },
  headerSub:  { fontSize: 11, color: theme.textMuted, marginTop: 1 },
  badge:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot:        { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  badgeText:  { fontSize: 12, fontWeight: "600" },

  waitingCard:  { backgroundColor: theme.bgCard, borderRadius: 16, padding: 28, alignItems: "center", marginBottom: 14, borderWidth: 1, borderColor: theme.border },
  waitingTitle: { fontSize: 16, fontWeight: "bold", color: theme.text, marginTop: 10, marginBottom: 4 },
  waitingSub:   { fontSize: 13, color: theme.textMuted, textAlign: "center" },

  card:          { backgroundColor: theme.bgCard, padding: 16, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  cardTitle:     { fontSize: 16, fontWeight: "bold", color: theme.text },
  angleChip:     { backgroundColor: theme.bgCardAlt, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  angleChipText: { color: theme.primary, fontSize: 13, fontWeight: "600" },

  rotateBtn:         { marginTop: 14, borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  rotateBtnStart:    { backgroundColor: theme.bgCardAlt, borderWidth: 1.5, borderColor: theme.primary },
  rotateBtnStop:     { backgroundColor: theme.danger },
  rotateBtnDisabled: { opacity: 0.4 },
  rotateBtnText:     { fontSize: 16, fontWeight: "bold" },

  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, gap: 10 },

  actionsRow:    { flexDirection: "row", gap: 12, marginBottom: 14 },
  actionBtn:     { flex: 1, backgroundColor: theme.bgCard, borderRadius: 16, paddingVertical: 18, alignItems: "center", gap: 6, borderWidth: 1, borderColor: theme.border },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: theme.text },

  reconnectText: { color: theme.warning, fontSize: 12, fontWeight: "bold", marginTop: 6 },
});

const AppWrapper = () => (
  <SafeAreaProvider><App /></SafeAreaProvider>
);

export default AppWrapper;