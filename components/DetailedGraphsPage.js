import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const DetailedGraphsPage = ({ type, unit, color, currentValue, onGoBack }) => {
  const [historicalData, setHistoricalData] = useState([]);

  // Simula dados históricos
  useEffect(() => {
    const generateMockData = () => {
      const data = [];
      for (let i = 0; i < 24; i++) {
        data.push({
          hour: `${i.toString().padStart(2, "0")}:00`,
          value: currentValue + (Math.random() * 10 - 5), // Variação aleatória
        });
      }
      return data;
    };

    setHistoricalData(generateMockData());
  }, [currentValue]);

  // Função simples para renderizar barras do gráfico
  const renderSimpleBarChart = () => {
    const maxValue = Math.max(...historicalData.map((item) => item.value));
    const minValue = Math.min(...historicalData.map((item) => item.value));

    return (
      <View style={styles.chartContainer}>
        <View style={styles.barChart}>
          {historicalData.map((item, index) => {
            const height =
              ((item.value - minValue) / (maxValue - minValue)) * 100;
            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(height, 5), backgroundColor: color },
                  ]}
                />
                {index % 4 === 0 && (
                  <Text style={styles.barLabel}>{item.hour}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes de {type}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Card: Valor Atual */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valor Atual</Text>
          <View style={styles.currentValueContainer}>
            <Text style={[styles.currentValue, { color }]}>
              {currentValue} {unit}
            </Text>
            <View
              style={[styles.statusIndicator, { backgroundColor: color }]}
            />
          </View>
        </View>

        {/* Card: Gráfico Simples */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Histórico (Últimas 24h)</Text>
          {renderSimpleBarChart()}
        </View>

        {/* Card: Dados Históricos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados Detalhados</Text>
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Máximo</Text>
              <Text style={styles.dataValue}>
                {Math.max(...historicalData.map((item) => item.value)).toFixed(
                  1
                )}{" "}
                {unit}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Mínimo</Text>
              <Text style={styles.dataValue}>
                {Math.min(...historicalData.map((item) => item.value)).toFixed(
                  1
                )}{" "}
                {unit}
              </Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>Média</Text>
              <Text style={styles.dataValue}>
                {(
                  historicalData.reduce((sum, item) => sum + item.value, 0) /
                  historicalData.length
                ).toFixed(1)}{" "}
                {unit}
              </Text>
            </View>
          </View>
        </View>

        {/* Card: Tabela de Dados */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Últimas Leituras</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Horário</Text>
              <Text style={styles.tableHeaderText}>Valor</Text>
            </View>
            {historicalData.slice(-6).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.hour}</Text>
                <Text style={styles.tableCell}>
                  {item.value.toFixed(1)} {unit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card: Estatísticas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estatísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.statValue}>+2.5%</Text>
              <Text style={styles.statLabel}>Variação</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>24h</Text>
              <Text style={styles.statLabel}>Período</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="pulse" size={24} color="#EF4444" />
              <Text style={styles.statValue}>
                {(
                  (Math.max(...historicalData.map((item) => item.value)) -
                    Math.min(...historicalData.map((item) => item.value))) /
                  2
                ).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Amplitude</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  contentContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
  },
  currentValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  chartContainer: {
    marginTop: 10,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 150,
    paddingHorizontal: 5,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 8,
    color: "#6B7280",
    transform: [{ rotate: "-45deg" }],
  },
  dataGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dataItem: {
    alignItems: "center",
    flex: 1,
  },
  dataLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableCell: {
    flex: 1,
    color: "#374151",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});

export default DetailedGraphsPage;
