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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { dynamoDBService } from "../services/dynamoDBService";

const { width } = Dimensions.get("window");

const PERIODS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
];

const FIELD_MAP = {
  Temperatura: "temperature",
  "Umidade do Solo": "soil_humidity",
  "Umidade do Ar": "air_humidity",
};

// ─── Componente ──────────────────────────────────────────────────────────────
const DetailedGraphsPage = ({ type, unit, color, onGoBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(PERIODS[2]); // 24h padrão
  const [stats, setStats] = useState({
    min: "—",
    max: "—",
    avg: "—",
    current: "—",
  });

  const field = FIELD_MAP[type];

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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type}</Text>
        <TouchableOpacity onPress={loadHistory} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Valor atual em destaque */}
        <View style={[styles.heroCard, { borderLeftColor: color }]}>
          <View>
            <Text style={styles.heroLabel}>Valor Atual</Text>
            <Text style={[styles.heroValue, { color }]}>
              {stats.current}
              {unit}
            </Text>
          </View>
          <View style={[styles.heroIcon, { backgroundColor: color + "20" }]}>
            <Ionicons
              name={type === "Temperatura" ? "thermometer" : "water"}
              size={32}
              color={color}
            />
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
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#f9fafb",
                decimalPlaces: 1,
                color: (opacity = 1) =>
                  `${color}${Math.round(opacity * 255)
                    .toString(16)
                    .padStart(2, "0")}`,
                labelColor: () => "#9CA3AF",
                propsForDots: { r: "4", strokeWidth: "2", stroke: color },
                propsForBackgroundLines: {
                  stroke: "#F3F4F6",
                  strokeDasharray: "",
                },
              }}
              style={styles.chart}
            />
          ) : (
            <View style={styles.noData}>
              <Ionicons name="bar-chart-outline" size={44} color="#D1D5DB" />
              <Text style={styles.noDataText}>Sem dados para este período</Text>
              <Text style={styles.noDataSub}>
                Os dados aparecerão conforme os sensores enviam leituras
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F2F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6 },
  refreshBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  content: { padding: 16 },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  heroLabel: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
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
    backgroundColor: "#E5E7EB",
  },
  periodTxt: { fontSize: 13, fontWeight: "600", color: "#374151" },
  periodTxtActive: { color: "#FFFFFF" },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  chartTitle: { fontSize: 13, color: "#6B7280", marginBottom: 12 },
  chart: { borderRadius: 10, marginLeft: -12 },

  noData: { alignItems: "center", paddingVertical: 40 },
  noDataText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 12,
  },
  noDataSub: {
    fontSize: 12,
    color: "#D1D5DB",
    textAlign: "center",
    marginTop: 6,
  },
});

export default DetailedGraphsPage;
