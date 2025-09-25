import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LineChart, Grid } from "react-native-svg-charts";
import * as shape from "d3-shape";
import { SafeAreaView } from "react-native-safe-area-context";

// Dados simulados para o gráfico.
const tempHistoryDay = [24, 25, 26, 25, 24, 23, 22];
const tempHistoryWeek = [25, 24, 27, 26, 28, 25, 27];
const tempHistoryMonth = [20, 22, 24, 26, 23, 25, 27, 24, 26, 25, 23, 22, 21];

const soilHumidityHistoryDay = [50, 52, 55, 54, 53, 51, 50];
const soilHumidityHistoryWeek = [55, 58, 52, 50, 57, 53, 55];
const soilHumidityHistoryMonth = [
  60, 62, 58, 55, 59, 56, 54, 58, 60, 57, 55, 53, 52,
];

const airHumidityHistoryDay = [65, 67, 68, 70, 69, 66, 65];
const airHumidityHistoryWeek = [72, 70, 68, 65, 69, 71, 70];
const airHumidityHistoryMonth = [
  75, 73, 68, 66, 70, 72, 74, 71, 69, 68, 67, 66, 65,
];

// O componente do gráfico de linha
const LineGraph = ({ data, color, unit }) => {
  return (
    <LineChart
      style={{ height: 200 }}
      data={data}
      svg={{ stroke: color, strokeWidth: 2 }}
      contentInset={{ top: 20, bottom: 20 }}
      curve={shape.curveNatural}
    >
      <Grid svg={{ stroke: "#E5E7EB" }} />
    </LineChart>
  );
};

// O componente da página detalhada
const DetailedGraphsPage = ({ type, unit, color, onGoBack }) => {
  const [timeRange, setTimeRange] = useState("day");

  const getHistoryData = () => {
    switch (type) {
      case "Temperatura":
        switch (timeRange) {
          case "day":
            return tempHistoryDay;
          case "week":
            return tempHistoryWeek;
          case "month":
            return tempHistoryMonth;
          default:
            return [];
        }
      case "Umidade do Solo":
        switch (timeRange) {
          case "day":
            return soilHumidityHistoryDay;
          case "week":
            return soilHumidityHistoryWeek;
          case "month":
            return soilHumidityHistoryMonth;
          default:
            return [];
        }
      case "Umidade do Ar":
        switch (timeRange) {
          case "day":
            return airHumidityHistoryDay;
          case "week":
            return airHumidityHistoryWeek;
          case "month":
            return airHumidityHistoryMonth;
          default:
            return [];
        }
      default:
        return [];
    }
  };

  const historyData = getHistoryData();
  const yMin = Math.min(...historyData);
  const yMax = Math.max(...historyData);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F2F5" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{type} Detalhada</Text>

        <View style={styles.rangeButtons}>
          <TouchableOpacity
            onPress={() => setTimeRange("day")}
            style={[
              styles.rangeButton,
              timeRange === "day" && styles.activeRangeButton,
            ]}
          >
            <Text
              style={[
                styles.rangeButtonText,
                timeRange === "day" && styles.activeRangeButtonText,
              ]}
            >
              Dia
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeRange("week")}
            style={[
              styles.rangeButton,
              timeRange === "week" && styles.activeRangeButton,
            ]}
          >
            <Text
              style={[
                styles.rangeButtonText,
                timeRange === "week" && styles.activeRangeButtonText,
              ]}
            >
              Semana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeRange("month")}
            style={[
              styles.rangeButton,
              timeRange === "month" && styles.activeRangeButton,
            ]}
          >
            <Text
              style={[
                styles.rangeButtonText,
                timeRange === "month" && styles.activeRangeButtonText,
              ]}
            >
              Mês
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricSummary}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Atual</Text>
            <Text style={[styles.metricValue, { color: color }]}>{`${
              historyData[historyData.length - 1]
            }${unit}`}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Mínimo</Text>
            <Text
              style={[styles.metricValue, { color: "#EF4444" }]}
            >{`${yMin}${unit}`}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Máximo</Text>
            <Text
              style={[styles.metricValue, { color: "#3B82F6" }]}
            >{`${yMax}${unit}`}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Gráfico de Histórico</Text>
          <LineGraph data={historyData} color={color} unit={unit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
  },
  rangeButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  rangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 5,
  },
  rangeButtonText: {
    color: "#4B5563",
  },
  activeRangeButton: {
    backgroundColor: "#22C55E",
  },
  activeRangeButtonText: {
    color: "#FFFFFF",
  },
  metricSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  metricBox: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
});

export default DetailedGraphsPage;
