import React, { useState, useEffect, useCallback, useMemo } from "react";
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

// ─── Períodos ─────────────────────────────────────────────────────────────────
const PERIODS = [
  { labelKey: "1h", hours: 1 },
  { labelKey: "6h", hours: 6 },
  { labelKey: "24h", hours: 24 },
  { labelKey: "7d", hours: 168 },
  { labelKey: "30d", hours: 720 },
  { labelKey: "6m", hours: 4320 },
];

// ─── Lógica de unidade de vazão conforme período ──────────────────────────────
// ≤ 1h   → L/min  (valor bruto, já vem em L/min)
// ≤ 24h  → L/h    (multiplica por 60)
// ≤ 7d   → L/dia  (multiplica por 1440)
// > 7d   → m³/dia (multiplica por 1440 e divide por 1000)
const getFlowMeta = (hours, lang) => {
  if (hours <= 1) return { label: "L/min", factor: 1, decimals: 1 };
  if (hours <= 24) return { label: "L/h", factor: 60, decimals: 0 };
  if (hours <= 168) return { label: "L/dia", factor: 1440, decimals: 0 };
  return { label: "m³/dia", factor: 1440 / 1000, decimals: 2 };
};

const withOpacity = (hex, opacity = 1) => {
  const h = (hex || "#22C55E").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ─── Componente ──────────────────────────────────────────────────────────────
const DetailedGraphsPage = ({ initialType = "temperature", theme, lang }) => {
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

  // ── Tipos de sensor — grid 3×3 ──
  const TYPES = [
    // linha 1
    {
      key: "temperature",
      short: t(lang, "temperature"),
      unit: "°C",
      color: theme.accentOrange,
      icon: "thermometer",
      note: null,
    },
    {
      key: "soil_humidity",
      short: t(lang, "soil_humidity"),
      unit: "%",
      color: theme.accentBlue,
      icon: "water",
      note: null,
    },
    {
      key: "air_humidity",
      short: t(lang, "air_humidity"),
      unit: "%",
      color: theme.accentPurple,
      icon: "cloud",
      note: null,
    },
    // linha 2
    {
      key: "water_flow_sensor",
      short: t(lang, "water_flow_sensor"),
      unit: t(lang, "water_flow_unit"),
      color: theme.accentBlue,
      icon: "water-outline",
      note: null,
    },
    {
      key: "rain",
      short: t(lang, "rain"),
      unit: "%",
      color: theme.info,
      icon: "rainy-outline",
      note: t(lang, "rain_note"),
    },
    {
      key: "light",
      short: t(lang, "light"),
      unit: "%",
      color: theme.accentAmber,
      icon: "sunny-outline",
      note: t(lang, "light_note"),
    },
  ];

  useEffect(() => setTypeKey(initialType), [initialType]);

  const isFlowSensor = typeKey === "water_flow_sensor";
  // useMemo evita recriar o objeto a cada render — sem isso, convertFlow/fmt/
  // loadHistory mudam de referência todo render e o gráfico entra em loop de
  // refresh (acontecia só na vazão, único sensor com flowMeta).
  const flowMeta = useMemo(
    () => (isFlowSensor ? getFlowMeta(period.hours, lang) : null),
    [isFlowSensor, period.hours, lang],
  );

  const current = TYPES.find((tp) => tp.key === typeKey) || TYPES[0];
  const displayUnit = isFlowSensor ? flowMeta.label : current.unit;
  const { color, note } = current;
  const field = current.key;

  // Converte um valor bruto (L/min) para a unidade do período atual
  const convertFlow = useCallback(
    (raw) => {
      if (!isFlowSensor || raw == null) return raw;
      return raw * flowMeta.factor;
    },
    [isFlowSensor, flowMeta],
  );

  const fmt = useCallback(
    (val) => {
      if (val == null || isNaN(val)) return "—";
      const dec = isFlowSensor ? flowMeta.decimals : 1;
      return val.toFixed(dec);
    },
    [isFlowSensor, flowMeta],
  );

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dynamoDBService.getSensorHistory(
        "pivot_001",
        period.hours,
      );
      setHistory(data);

      const vals = data
        .map((d) => convertFlow(d[field]))
        .filter((v) => v != null && !isNaN(v));

      if (vals.length > 0) {
        setStats({
          current: fmt(vals.at(-1)),
          min: fmt(Math.min(...vals)),
          max: fmt(Math.max(...vals)),
          avg: fmt(vals.reduce((a, b) => a + b, 0) / vals.length),
        });
      } else {
        setStats({ min: "—", max: "—", avg: "—", current: "—" });
      }
    } catch (e) {
      console.error("[Chart] Erro ao carregar histórico:", e);
    } finally {
      setLoading(false);
    }
  }, [period, field, convertFlow, fmt]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const buildChartData = () => {
    if (history.length === 0) return null;
    const step = Math.max(1, Math.floor(history.length / 20));
    const sampled = history.filter((_, i) => i % step === 0).slice(-20);

    // Para períodos longos usa label de data; curtos usa hora:min
    const formatLabel = (ts) => {
      const d = new Date(ts);
      if (period.hours > 168) {
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }
      if (period.hours > 24) {
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }
      return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    // Mostra no máximo ~6 rótulos no eixo X (os demais ficam em branco) para
    // não se sobreporem em períodos longos (30d, 6m), onde 20 datas não cabem.
    const maxLabels = 6;
    const labelStep = Math.ceil(sampled.length / maxLabels);

    return {
      labels: sampled.map(({ timestamp }, i) =>
        i % labelStep === 0 ? formatLabel(timestamp) : "",
      ),
      datasets: [
        {
          data: sampled.map((d) => convertFlow(d[field] ?? 0) ?? 0),
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = buildChartData();
  const s = styles(theme);

  // Divide os tipos em 2 linhas de 3
  const rows = [TYPES.slice(0, 3), TYPES.slice(3, 6)];

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
        {/* ── Abas 3×3 ── */}
        <View style={s.typeGrid}>
          {rows.map((row, ri) => (
            <View key={ri} style={s.typeRow}>
              {row.map((tp) => {
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
          ))}
        </View>

        {/* Valor atual */}
        <View style={[s.heroCard, { borderLeftColor: color }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.heroLabel}>{t(lang, "current_value")}</Text>
            <View style={s.heroValueRow}>
              <Text
                style={[s.heroValue, { color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {stats.current}
              </Text>
              <Text style={[s.heroUnit, { color }]}> {displayUnit}</Text>
            </View>
            {note ? <Text style={[s.noteText, { color }]}>{note}</Text> : null}
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
              <Text
                style={[s.statValue, { color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {value === "—" ? "—" : `${value}`}
              </Text>
              {value !== "—" && (
                <Text style={[s.statUnit, { color }]}>{displayUnit}</Text>
              )}
            </View>
          ))}
        </View>

        {/* ── Seletor de período — 2 linhas de 3 ── */}
        <View style={s.periodGrid}>
          <View style={s.periodRow}>
            {PERIODS.slice(0, 3).map((p) => (
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
          <View style={s.periodRow}>
            {PERIODS.slice(3, 6).map((p) => (
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
        </View>

        {/* Indicador de unidade de vazão (só aparece na aba vazão) */}
        {isFlowSensor && (
          <View style={s.flowUnitBadge}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={theme.textMuted}
            />
            <Text style={s.flowUnitText}>
              {period.labelKey} → {flowMeta.label}
            </Text>
          </View>
        )}

        {/* Gráfico */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>
            {t(lang, "history_label")}
            {period.labelKey}
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
                decimalPlaces: isFlowSensor ? flowMeta.decimals : 1,
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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

    // ── Grid 3×3 de abas ──
    typeGrid: { gap: 8, marginBottom: 14 },
    typeRow: { flexDirection: "row", gap: 8 },
    typeTab: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.bgCard,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    typeTxt: { fontSize: 11, fontWeight: "600", color: theme.textMuted },

    // ── Hero ──
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
    heroValueRow: { flexDirection: "row", alignItems: "flex-end" },
    heroValue: { fontSize: 40, fontWeight: "bold", flexShrink: 1 },
    heroUnit: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
    noteText: { fontSize: 11, fontWeight: "600", marginTop: 4, opacity: 0.8 },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
    },

    // ── Stats ──
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.bgCard,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 2 },
    statValue: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
    statUnit: { fontSize: 10, fontWeight: "600", opacity: 0.7, marginTop: 1 },

    // ── Período — 2 linhas de 3 ──
    periodGrid: { gap: 8, marginBottom: 8 },
    periodRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    periodBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.bgCardAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    periodTxt: { fontSize: 13, fontWeight: "600", color: theme.textMuted },
    periodTxtActive: { color: theme.bg },

    // ── Badge de unidade de vazão ──
    flowUnitBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.bgCardAlt,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: theme.border,
    },
    flowUnitText: { fontSize: 12, color: theme.textMuted, fontWeight: "600" },

    // ── Gráfico ──
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
