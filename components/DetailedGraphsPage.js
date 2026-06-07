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
import { t } from "../i18n";

const { width } = Dimensions.get("window");

const PERIODS = [
  { labelKey: "1h", hours: 1 },
  { labelKey: "6h", hours: 6 },
  { labelKey: "24h", hours: 24 },
  { labelKey: "7d", hours: 168 },
];

const withOpacity = (hex, opacity = 1) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const DetailedGraphsPage = ({ initialType = "temperature", theme, lang }) => {
  const insets = useSafeAreaInsets();
  const [typeKey, setTypeKey] = useState(initialType);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(PERIODS[2]);
  const [stats, setStats] = useState({
    min: "—",
    max: "—",
    avg: "—",
    current: "—",
  });

  // Tipos definidos dentro do componente para usar theme e lang dinâmicos
  const TYPES = [
    {
      key: "temperature",
      label: t(lang, "temperature"),
      short: t(lang, "temperature"),
      unit: "°C",
      color: theme.accentOrange,
      icon: "thermometer",
    },
    {
      key: "soil_humidity",
      label: t(lang, "soil_humidity"),
      short: t(lang, "soil_humidity"),
      unit: "%",
      color: theme.accentBlue,
      icon: "water",
    },
    {
      key: "air_humidity",
      label: t(lang, "air_humidity"),
      short: t(lang, "air_humidity"),
      unit: "%",
      color: theme.accentPurple,
      icon: "cloud",
    },
  ];

  useEffect(() => setTypeKey(initialType), [initialType]);

  const current = TYPES.find((t) => t.key === typeKey) || TYPES[0];
  const { unit, color } = current;
  const field = current.key;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dynamoDBService.getSensorHistory("pivot_001", period.hours);
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
  const s = styles(theme);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{t(lang, "data")}</Text>
          <Text style={s.headerSub}>{t(lang, "sensor_history")}</Text>
        </View>
        <TouchableOpacity onPress={loadHistory} style={s.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Abas de tipo */}
        <View style={s.typeRow}>
          {TYPES.map((tp) => {
            const on = tp.key === typeKey;
            return (
              <TouchableOpacity
                key={tp.key}
                style={[
                  s.typeTab,
                  on && {
                    borderColor: tp.color,
                    backgroundColor: theme.bgCardAlt,
                  },
                ]}
                onPress={() => setTypeKey(tp.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tp.icon}
                  size={18}
                  color={on ? tp.color : theme.textMuted}
                />
                <Text
                  style={[s.typeTxt, on && { color: tp.color }]}
                  numberOfLines={1}
                >
                  {tp.short}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Valor atual */}
        <View style={[s.heroCard, { borderLeftColor: color }]}>
          <View>
            <Text style={s.heroLabel}>{t(lang, "current_value")}</Text>
            <Text style={[s.heroValue, { color }]}>
              {stats.current}{unit}
            </Text>
          </View>
          <View
            style={[s.heroIcon, { backgroundColor: withOpacity(color, 0.15) }]}
          >
            <Ionicons name={current.icon} size={32} color={color} />
          </View>
        </View>

        {/* Mini stats */}
        <View style={s.statsRow}>
          {[
            { label: t(lang, "minimum"), value: stats.min },
            { label: t(lang, "average"), value: stats.avg },
            { label: t(lang, "maximum"), value: stats.max },
          ].map(({ label, value }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statLabel}>{label}</Text>
              <Text style={[s.statValue, { color }]}>
                {value}{unit}
              </Text>
            </View>
          ))}
        </View>

        {/* Seletor de período */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.labelKey}
              style={[
                s.periodBtn,
                period.labelKey === p.labelKey && { backgroundColor: color },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  s.periodTxt,
                  period.labelKey === p.labelKey && s.periodTxtActive,
                ]}
              >
                {p.labelKey}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>
            {t(lang, "history_label")}{period.labelKey}
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
              style={s.chart}
            />
          ) : (
            <View style={s.noData}>
              <Ionicons
                name="bar-chart-outline"
                size={44}
                color={theme.textFaint}
              />
              <Text style={s.noDataText}>{t(lang, "no_data")}</Text>
              <Text style={s.noDataSub}>{t(lang, "no_data_sub")}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (theme) =>
  StyleSheet.create({
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
    periodTxtActive: { color: theme.bg },

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