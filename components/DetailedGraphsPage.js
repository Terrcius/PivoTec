import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { dynamoDBService } from "../services/dynamoDBService";
import { theme } from "../theme";

const { width } = Dimensions.get("window");

const PERIODS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
];

// Tipos de sensor disponíveis (abas no topo da página)
const TYPES = [
  {
    key: "temperature",
    label: "Temperatura",
    short: "Temperatura",
    unit: "°C",
    color: theme.accentOrange,
    icon: "thermometer",
  },
  {
    key: "soil_humidity",
    label: "Umidade do Solo",
    short: "Umid. Solo",
    unit: "%",
    color: theme.accentBlue,
    icon: "water",
  },
  {
    key: "air_humidity",
    label: "Umidade do Ar",
    short: "Umid. Ar",
    unit: "%",
    color: theme.accentPurple,
    icon: "cloud",
  },
];

// Converte um hex (#RRGGBB) + opacidade em rgba string p/ o chart-kit
const withOpacity = (hex, opacity = 1) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ─── Componente ──────────────────────────────────────────────────────────────
const DetailedGraphsPage = ({ initialType = "temperature" }) => {
  const insets = useSafeAreaInsets();
  const [typeKey, setTypeKey] = useState(initialType);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(PERIODS[2]); // 24h padrão
  const [stats, setStats] = useState({
    min: "—",
    max: "—",
    avg: "—",
    current: "—",
  });

  useEffect(() => setTypeKey(initialType), [initialType]);

  const current = TYPES.find((t) => t.key === typeKey) || TYPES[0];
  const { unit, color } = current;
  const field = current.key;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dynamoDBService.getSensorHistory(
        "pivot_001",
        period.hours,
      );
      setHistory(data);
      const vals = data.map((d) => d[field]).filter((v) => v != null);
      if (vals.length > 0) {
        setStats({
          current: vals.at(-1).toFixed(1),
          min: Math.min(...vals).toFixed(1),
          max: Math.max(...vals).toFixed(1),
          avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
        });
      } else {
        setStats({ min: "—", max: "—", avg: "—", current: "—" });
      }
    } catch (e) {
      console.error("[Chart] Erro ao carregar histórico:", e);
    } finally {
      setLoading(false);
    }
  }, [period, field]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Amostra até 20 pontos para o gráfico
  const buildChartData = () => {
    if (history.length === 0) return null;
    const step = Math.max(1, Math.floor(history.length / 20));
    const sampled = history.filter((_, i) => i % step === 0).slice(-20);
    return {
      labels: sampled.map(({ timestamp }) => {
        const d = new Date(timestamp);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
      }),
      datasets: [{ data: sampled.map((d) => d[field] ?? 0), strokeWidth: 2 }],
    };
  };

  const chartData = buildChartData();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dados</Text>
          <Text style={styles.headerSub}>Histórico dos sensores</Text>
        </View>
        <TouchableOpacity onPress={loadHistory} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Abas de tipo */}
        <View style={styles.typeRow}>
          {TYPES.map((t) => {
            const on = t.key === typeKey;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeTab,
                  on && {
                    borderColor: t.color,
                    backgroundColor: theme.bgCardAlt,
                  },
                ]}
                onPress={() => setTypeKey(t.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={t.icon}
                  size={18}
                  color={on ? t.color : theme.textMuted}
                />
                <Text
                  style={[styles.typeTxt, on && { color: t.color }]}
                  numberOfLines={1}
                >
                  {t.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Valor atual em destaque */}
        <View style={[styles.heroCard, { borderLeftColor: color }]}>
          <View>
            <Text style={styles.heroLabel}>Valor Atual</Text>
            <Text style={[styles.heroValue, { color }]}>
              {stats.current}
              {unit}
            </Text>
          </View>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: withOpacity(color, 0.15) },
            ]}
          >
            <Ionicons name={current.icon} size={32} color={color} />
          </View>
        </View>

        {/* Mini stats: min / média / max */}
        <View style={styles.statsRow}>
          {[
            { label: "Mínimo", value: stats.min },
            { label: "Média", value: stats.avg },
            { label: "Máximo", value: stats.max },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={[styles.statValue, { color }]}>
                {value}
                {unit}
              </Text>
            </View>
          ))}
        </View>

        {/* Seletor de período */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={[
                styles.periodBtn,
                period.label === p.label && { backgroundColor: color },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodTxt,
                  period.label === p.label && styles.periodTxtActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            Histórico — últimas {period.label}
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={color}
              style={{ marginVertical: 50 }}
            />
          ) : chartData ? (
            <LineChart
              data={chartData}
              width={width - 48}
              height={230}
              withDots={history.length < 25}
              bezier
              chartConfig={{
                backgroundColor: theme.bgCard,
                backgroundGradientFrom: theme.bgCard,
                backgroundGradientTo: theme.bgCard,
                decimalPlaces: 1,
                color: (opacity = 1) => withOpacity(color, opacity),
                labelColor: () => theme.textMuted,
                propsForDots: { r: "4", strokeWidth: "2", stroke: color },
                propsForBackgroundLines: {
                  stroke: theme.border,
                  strokeDasharray: "",
                },
              }}
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Ionicons
                name="bar-chart-outline"
                size={44}
                color={theme.textFaint}
              />
              <Text style={styles.noDataText}>Sem dados para este período</Text>
              <Text style={styles.noDataSub}>
                Os dados aparecerão conforme os sensores enviam leituras
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  refreshBtn: { padding: 6 },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: theme.text },
  headerSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 24 },

  typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  typeTab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.bgCard,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  typeTxt: { fontSize: 12, fontWeight: "600", color: theme.textMuted },

  heroCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroLabel: { fontSize: 13, color: theme.textMuted, marginBottom: 4 },
  heroValue: { fontSize: 42, fontWeight: "bold" },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.bgCard,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "bold" },

  periodRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.bgCardAlt,
    borderWidth: 1,
    borderColor: theme.border,
  },
  periodTxt: { fontSize: 13, fontWeight: "600", color: theme.textMuted },
  periodTxtActive: { color: "#06281A" },

  chartCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chartTitle: { fontSize: 13, color: theme.textMuted, marginBottom: 12 },
  chart: { borderRadius: 10, marginLeft: -12 },

  noData: { alignItems: "center", paddingVertical: 40 },
  noDataText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.textMuted,
    marginTop: 12,
  },
  noDataSub: {
    fontSize: 12,
    color: theme.textFaint,
    textAlign: "center",
    marginTop: 6,
  },
});

export default DetailedGraphsPage;
