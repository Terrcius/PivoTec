import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const SchedulePage = ({ onGoBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          {/* Ícone de voltar */}
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendamento de Irrigação</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Card: Agendar Novo Ciclo */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="timer-outline" size={24} color="#374151" />
            <Text style={styles.cardTitle}>Agendar Novo Ciclo</Text>
          </View>
          {/* TODO: Implementar lógica de agendamento real */}
          <Text style={styles.cardDescription}>
            Defina o horário de início, duração e os setores que devem ser
            irrigados automaticamente.
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Adicionar Agendamento</Text>
          </TouchableOpacity>
        </View>

        {/* Card: Agendamentos Ativos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#374151" />
            <Text style={styles.cardTitle}>Agendamentos Ativos</Text>
          </View>
          <Text style={styles.cardDescription}>Nenhum agendamento ativo.</Text>
          {/* Lista futura de agendamentos */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    // Adiciona padding extra no topo para Android se necessário, mas o SafeAreaView deve resolver
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 10, // Aumenta a área de toque
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 15,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#10B981", // Verde
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SchedulePage;
