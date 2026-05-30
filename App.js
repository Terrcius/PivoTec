import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import PivotVisualization from "./components/PivotVisualization";
import StatusCard from "./components/StatusCard";
import MetricCard from "./components/MetricCard";
import MainControls from "./components/MainControls";
import DetailedGraphsPage from "./components/DetailedGraphsPage";
import SchedulePage from "./components/SchedulePage";

import { configureAWS } from "./services/awsConfig";
import { iotService } from "./services/iotService";
import { dynamoDBService } from "./services/dynamoDBService";

configureAWS();

const PIVOT_ID = "pivot_001";
const WS_URL =
  process.env.EXPO_PUBLIC_WEBSOCKET_URL || "ws://192.168.137.72:80/ws";

// ─── Tela de Configuração ─────────────────────────────────────────────────────
const ConfigPage = ({
  pivotData,
  isConnected,
  onGoBack,
  onChangePower,
  onChangeFlow,
  onChangeUVIntensity,
  onToggleUVLight,
  onToggleDirection,
  onZeroPosition,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ flex: 1, backgroundColor: "#F0F2F5", paddingTop: insets.top }}
    >
      <View style={configStyles.header}>
        <TouchableOpacity onPress={onGoBack} style={configStyles.backBtn}>
          <Text style={configStyles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={configStyles.headerTitle}>⚙️ Configurações do Pivô</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <MainControls
          status={pivotData?.status?.rotation_status}
          direction={pivotData?.status?.direction}
          power={pivotData?.status?.power ?? 0}
          uvLightStatus={pivotData?.status?.uv_light_status}
          waterFlow={pivotData?.status?.water_flow ?? 0}
          uvIntensity={pivotData?.status?.uv_intensity ?? 0}
          onToggleRotation={() => {}}
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

const configStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6, marginRight: 10 },
  backArrow: { fontSize: 22, color: "#374151" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
});

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  const insets = useSafeAreaInsets();
  const [pivotData, setPivotData] = useState(null);
  const [view, setView] = useState("home");
  const [isConnected, setIsConnected] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [reconnectTimer, setReconnectTimer] = useState(0);

  const ws = useRef(null);
  const iotSub = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    dynamoDBService
      .getPivotData(PIVOT_ID)
      .then(setPivotData)
      .catch(() => setPivotData(buildDefaultData()));
  }, []);

  useEffect(() => {
    iotSub.current = iotService.subscribe(handleIoTMessage, () => {});
    return () => iotSub.current?.unsubscribe();
  }, []);

  const handleIoTMessage = useCallback((msg) => {
    if (msg.ang !== undefined) setCurrentAngle(parseFloat(msg.ang));
    const patch = {};
    if (msg.temp !== undefined) patch.temperature = parseFloat(msg.temp);
    if (msg.umid !== undefined) patch.air_humidity = parseFloat(msg.umid);
    if (msg.solo !== undefined) patch.soil_humidity = parseFloat(msg.solo);
    if (Object.keys(patch).length > 0) {
      setPivotData((p) =>
        p ? { ...p, sensors: { ...p.sensors, ...patch } } : p,
      );
      dynamoDBService.saveSensorReading(PIVOT_ID, patch).catch(console.error);
    }
    if (msg.status)
      setPivotData((p) =>
        p ? { ...p, status: { ...p.status, ...msg.status } } : p,
      );
  }, []);

  useEffect(() => {
    const connect = () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setReconnectTimer(0);

      console.log("[WS] Tentando conexão com", WS_URL);

      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log("[WS] ✅ Conectado ao ESP32!");
      };

      ws.current.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data);
          console.log("[WS] 📨 Mensagem recebida:", msg);
          handleIoTMessage(msg);
        } catch {}
      };

      ws.current.onerror = (e) => {
        console.log("[WS] ❌ Erro de conexão:", e.message);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log("[WS] 🔌 Desconectado do ESP32.");

        let t = 3;
        setReconnectTimer(t);
        console.log(`[WS] 🔄 Reconectando em ${t}s...`);

        countdownRef.current = setInterval(() => {
          t--;
          setReconnectTimer(t);
          if (t > 0) {
            console.log(`[WS] 🔄 Reconectando em ${t}s...`);
          } else {
            clearInterval(countdownRef.current);
            console.log("[WS] 🔃 Tentando reconexão agora...");
            connect();
          }
        }, 1000);
      };
    };

    connect();
    return () => {
      ws.current?.close();
      clearInterval(countdownRef.current);
    };
  }, []);

  const sendWS = useCallback((cmd) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(cmd);
  }, []);

  const patchStatus = useCallback((patch) => {
    setPivotData((p) => {
      if (!p) return p;
      const merged = { ...p.status, ...patch };
      dynamoDBService.updateStatus(PIVOT_ID, merged).catch(console.error);
      return { ...p, status: merged };
    });
  }, []);

  const handleToggleRotation = useCallback(() => {
    if (!pivotData || !isConnected) return;
    const next =
      pivotData.status.rotation_status === "Rodando" ? "Parado" : "Rodando";
    sendWS(next === "Rodando" ? "ON" : "OFF");
    patchStatus({ rotation_status: next });
  }, [pivotData, isConnected]);

  const handleToggleDirection = useCallback(() => {
    if (!pivotData || !isConnected) return;
    const next =
      pivotData.status.direction === "Horário" ? "Anti-horário" : "Horário";
    sendWS(next === "Anti-horário" ? "ANT" : "HOR");
    patchStatus({ direction: next });
  }, [pivotData, isConnected]);

  const handleChangePower = useCallback(
    (v) => {
      sendWS(parseInt(v).toString());
      patchStatus({ power: parseInt(v) });
    },
    [isConnected],
  );
  const handleChangeFlow = useCallback(
    (v) => {
      const f = Math.round(v);
      sendWS(`B=${f}`);
      patchStatus({
        water_flow: f,
        water_pump_status: f > 0 ? "Ligada" : "Desligada",
      });
    },
    [isConnected],
  );
  const handleChangeUVIntensity = useCallback(
    (v) => {
      const i = Math.round(v);
      sendWS(`L=${i}`);
      patchStatus({
        uv_intensity: i,
        uv_light_status: i > 0 ? "Ligada" : "Desligada",
      });
    },
    [isConnected],
  );
  const handleToggleUVLight = useCallback(() => {
    const on = pivotData?.status?.uv_light_status !== "Ligada";
    sendWS(on ? "L=100" : "L=0");
    patchStatus({
      uv_light_status: on ? "Ligada" : "Desligada",
      uv_intensity: on ? 100 : 0,
    });
  }, [pivotData, isConnected]);
  const handleZeroPosition = useCallback(() => {
    if (isConnected) sendWS("ZERAR");
  }, [isConnected]);

  const handleToggleSector = useCallback(
    (key) => {
      if (
        !pivotData?.sectors?.[key] ||
        !isConnected ||
        pivotData.status.rotation_status === "Rodando"
      )
        return;
      const newActive = !pivotData.sectors[key].is_active;
      sendWS(`S${key.replace("sector_", "")}=${newActive ? 1 : 0}`);
      setPivotData((p) => {
        if (!p) return p;
        const sectors = {
          ...p.sectors,
          [key]: { ...p.sectors[key], is_active: newActive },
        };
        dynamoDBService
          .updateStatus(PIVOT_ID, { ...p.status, sectors })
          .catch(console.error);
        return { ...p, sectors };
      });
    },
    [pivotData, isConnected],
  );

  if (!pivotData) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando dados do pivô...</Text>
      </View>
    );
  }

  // ── Sub-telas ──
  if (view === "schedule")
    return <SchedulePage onGoBack={() => setView("home")} />;
  if (view === "config")
    return (
      <ConfigPage
        pivotData={pivotData}
        isConnected={isConnected}
        onGoBack={() => setView("home")}
        onChangePower={handleChangePower}
        onChangeFlow={handleChangeFlow}
        onChangeUVIntensity={handleChangeUVIntensity}
        onToggleUVLight={handleToggleUVLight}
        onToggleDirection={handleToggleDirection}
        onZeroPosition={handleZeroPosition}
      />
    );

  const GRAPH_VIEWS = {
    temp: { type: "Temperatura", unit: "°C", color: "#FFA500" },
    "soil-humidity": { type: "Umidade do Solo", unit: "%", color: "#4F89BC" },
    "air-humidity": { type: "Umidade do Ar", unit: "%", color: "#8884d8" },
  };
  if (GRAPH_VIEWS[view])
    return (
      <DetailedGraphsPage
        {...GRAPH_VIEWS[view]}
        onGoBack={() => setView("home")}
      />
    );

  const isRotating = pivotData.status.rotation_status === "Rodando";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F2F5" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🌾 Pivô Tec</Text>
            <Text style={styles.headerSub}>Painel de Controle</Text>
          </View>
          <View
            style={[
              styles.badge,
              isConnected ? styles.badgeOn : styles.badgeOff,
            ]}
          >
            <View
              style={[styles.dot, isConnected ? styles.dotOn : styles.dotOff]}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isConnected ? "#065F46" : "#991B1B" },
              ]}
            >
              {isConnected ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* ── Visualização + botão ligar/desligar ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Posição do Pivô</Text>
            <Text style={styles.angleChip}>{Math.round(currentAngle)}°</Text>
          </View>
          <PivotVisualization
            angle={currentAngle}
            sectors={pivotData.sectors}
          />

          {/* Botão principal de rotação */}
          <TouchableOpacity
            style={[
              styles.rotateBtn,
              isRotating ? styles.rotateBtnStop : styles.rotateBtnStart,
              !isConnected && styles.rotateBtnDisabled,
            ]}
            onPress={handleToggleRotation}
            disabled={!isConnected}
          >
            <Text
              style={[
                styles.rotateBtnText,
                isRotating
                  ? styles.rotateBtnTextStop
                  : styles.rotateBtnTextStart,
              ]}
            >
              {isRotating ? "⏸  Parar Rotação" : "▶  Iniciar Rotação"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Métricas ── */}
        <View style={styles.metricsRow}>
          <MetricCard
            value={`${pivotData.sensors.temperature}°C`}
            label="Temperatura"
            onClick={() => setView("temp")}
          />
          <MetricCard
            value={`${pivotData.sensors.soil_humidity}%`}
            label="Umid. Solo"
            onClick={() => setView("soil-humidity")}
          />
          <MetricCard
            value={`${pivotData.sensors.air_humidity}%`}
            label="Umid. Ar"
            onClick={() => setView("air-humidity")}
          />
        </View>

        {/* ── Ações rápidas ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnBlue]}
            onPress={() => setView("config")}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionBtnText}>Configurar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnGreen]}
            onPress={() => setView("schedule")}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionBtnText}>Agendar</Text>
          </TouchableOpacity>
        </View>

        {/* ── Setores ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status dos Setores</Text>
          {!isConnected && (
            <Text style={styles.reconnectText}>
              {reconnectTimer > 0
                ? `Reconectando em ${reconnectTimer}s…`
                : "Conectando…"}
            </Text>
          )}
          {Object.keys(pivotData.sectors)
            .sort()
            .map((key) => {
              const s = pivotData.sectors[key];
              return (
                <StatusCard
                  key={key}
                  label={s.crop || key}
                  value={`${s.moisture ?? 0}%`}
                  status={s.is_active}
                  color={s.color}
                  onToggle={() => handleToggleSector(key)}
                  isAdjustable={isConnected && !isRotating}
                />
              );
            })}
        </View>
      </ScrollView>
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
      crop: "Milho",
      moisture: 70,
      is_active: false,
      color: "#FBBF24",
    },
    sector_2: { crop: "Soja", moisture: 65, is_active: true, color: "#34D399" },
  },
  sensors: { temperature: 30, soil_humidity: 68, air_humidity: 55 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F0F2F5" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  content: { padding: 14, paddingBottom: 30 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  headerSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeOn: { backgroundColor: "#D1FAE5" },
  badgeOff: { backgroundColor: "#FEE2E2" },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  dotOn: { backgroundColor: "#10B981" },
  dotOff: { backgroundColor: "#EF4444" },
  badgeText: { fontSize: 12, fontWeight: "600" },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  angleChip: {
    backgroundColor: "#EEF2FF",
    color: "#4338CA",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: "600",
  },

  rotateBtn: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  rotateBtnStart: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  rotateBtnStop: { backgroundColor: "#EF4444" },
  rotateBtnDisabled: { opacity: 0.45 },
  rotateBtnText: { fontSize: 16, fontWeight: "bold" },
  rotateBtnTextStart: { color: "#065F46" },
  rotateBtnTextStop: { color: "#FFF" },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
  },
  actionBtnBlue: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  actionBtnGreen: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  actionIcon: { fontSize: 24 },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: "#374151" },

  reconnectText: {
    textAlign: "center",
    color: "#F59E0B",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
});

const AppWrapper = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

export default AppWrapper;
