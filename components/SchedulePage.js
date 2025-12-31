import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDatabase,
  ref,
  onValue,
  update,
  push,
  remove,
} from "firebase/database";

const SchedulePage = ({ onGoBack, onEditSchedule }) => {
  const [scheduleData, setScheduleData] = useState({
    enabled: false,
    programs: {},
  });
  const [programs, setPrograms] = useState({});

  // Carrega os dados do Firebase
  useEffect(() => {
    const scheduleRef = ref(getDatabase(), "pivots/pivot_001/schedule");

    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setScheduleData(data);
        setPrograms(data.programs || {});
      } else {
        // Inicializa se não existir
        setScheduleData({ enabled: false, programs: {} });
        setPrograms({});
      }
    });

    return () => unsubscribe();
  }, []);

  // Função para adicionar novo agendamento
  const handleAddSchedule = () => {
    const newProgram = {
      name: "Novo Agendamento",
      start_time: "08:00",
      end_time: "09:00",
      days: [1, 3, 5], // Segunda, Quarta, Sexta - SEMPRE um array
      sectors: ["sector_01"],
      water_flow: 50,
      uv_intensity: 50,
      active: true,
    };

    const newProgramRef = push(
      ref(getDatabase(), "pivots/pivot_001/schedule/programs")
    );
    update(newProgramRef, newProgram);
  };

  // Função para ativar/desativar agendamento
  const toggleProgram = (programId, currentStatus) => {
    update(
      ref(getDatabase(), `pivots/pivot_001/schedule/programs/${programId}`),
      {
        active: !currentStatus,
      }
    );
  };

  // Função para deletar agendamento
  const deleteProgram = (programId, programName) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja excluir o agendamento "${programName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            remove(
              ref(
                getDatabase(),
                `pivots/pivot_001/schedule/programs/${programId}`
              )
            );
          },
        },
      ]
    );
  };

  // Função para ativar/desativar todo o sistema de agendamento
  const toggleScheduleSystem = (currentStatus) => {
    update(ref(getDatabase(), "pivots/pivot_001/schedule"), {
      enabled: !currentStatus,
    });
  };

  // 🔥 CORREÇÃO: Função mais robusta para renderizar dias
  const renderDays = (daysArray) => {
    // Verifica se daysArray existe e é um array
    if (!daysArray || !Array.isArray(daysArray)) {
      return "Dias não definidos";
    }

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Filtra apenas dias válidos (0-6)
    const validDays = daysArray.filter((day) => day >= 0 && day <= 6);

    if (validDays.length === 0) {
      return "Nenhum dia selecionado";
    }

    return validDays.map((day) => dayNames[day]).join(", ");
  };

  // 🔥 CORREÇÃO: Função mais robusta para renderizar setores
  const renderSectors = (sectorsArray) => {
    if (!sectorsArray || !Array.isArray(sectorsArray)) {
      return "Setores não definidos";
    }

    return sectorsArray
      .map((sector) => {
        // Remove 'sector_' e formata bonito
        const sectorNumber = sector.replace("sector_", "");
        return `Setor ${sectorNumber}`;
      })
      .join(", ");
  };

  // 🔥 CORREÇÃO: Função para garantir que os dados do programa são válidos
  const getProgramData = (program) => {
    return {
      name: program.name || "Sem nome",
      start_time: program.start_time || "00:00",
      end_time: program.end_time || "00:00",
      days: Array.isArray(program.days) ? program.days : [1], // Fallback para Segunda
      sectors: Array.isArray(program.sectors) ? program.sectors : ["sector_01"],
      water_flow: program.water_flow || 50,
      uv_intensity: program.uv_intensity || 50,
      active: program.active !== undefined ? program.active : true,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendamento de Irrigação</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Card: Controle Geral do Sistema */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color="#374151" />
            <Text style={styles.cardTitle}>Sistema de Agendamento</Text>
            <Switch
              value={scheduleData.enabled || false}
              onValueChange={() =>
                toggleScheduleSystem(scheduleData.enabled || false)
              }
              trackColor={{ false: "#D1D5DB", true: "#10B981" }}
              thumbColor={scheduleData.enabled ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>
          <Text style={styles.cardDescription}>
            {scheduleData.enabled
              ? "✓ Sistema de agendamento ativo"
              : "⏰ Sistema de agendamento desativado"}
          </Text>
        </View>

        {/* Card: Agendamentos Ativos */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#374151" />
            <Text style={styles.cardTitle}>Agendamentos Configurados</Text>
            <Text style={styles.programCount}>
              {Object.keys(programs).length}
            </Text>
          </View>

          {Object.keys(programs).length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum agendamento configurado.
            </Text>
          ) : (
            Object.entries(programs).map(([programId, program]) => {
              // 🔥 CORREÇÃO: Usa a função segura para obter dados
              const programData = getProgramData(program);

              return (
                <View key={programId} style={styles.programItem}>
                  <View style={styles.programHeader}>
                    <Text style={styles.programName}>{programData.name}</Text>
                    <Switch
                      value={programData.active}
                      onValueChange={() =>
                        toggleProgram(programId, programData.active)
                      }
                      trackColor={{ false: "#D1D5DB", true: "#10B981" }}
                      thumbColor={programData.active ? "#FFFFFF" : "#FFFFFF"}
                    />
                  </View>

                  <View style={styles.programDetails}>
                    <Text style={styles.programTime}>
                      ⏰ {programData.start_time} - {programData.end_time}
                    </Text>
                    <Text style={styles.programDays}>
                      📅 {renderDays(programData.days)}
                    </Text>
                    <Text style={styles.programSectors}>
                      🌱 {renderSectors(programData.sectors)}
                    </Text>
                    <Text style={styles.programSettings}>
                      💧 Vazão: {programData.water_flow}% | 🔦 UV:{" "}
                      {programData.uv_intensity}%
                    </Text>
                  </View>

                  <View style={styles.programActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => onEditSchedule(programId)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#3B82F6"
                      />
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteProgram(programId, programData.name)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSchedule}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Adicionar Novo Agendamento</Text>
          </TouchableOpacity>
        </View>

        {/* Card: Instruções */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#374151"
            />
            <Text style={styles.cardTitle}>Como Funciona</Text>
          </View>
          <Text style={styles.cardDescription}>
            • Crie múltiplos agendamentos para diferentes horários{"\n"}• Defina
            dias específicos da semana{"\n"}• Selecione quais setores irrigar
            {"\n"}• Configure vazão e intensidade UV individualmente{"\n"}•
            Ative/desative agendamentos individualmente
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F2F5",
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
    padding: 10,
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
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    flex: 1,
    marginLeft: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  programCount: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontStyle: "italic",
    marginVertical: 20,
  },
  programItem: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  programHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  programName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    flex: 1,
  },
  programDetails: {
    marginBottom: 10,
  },
  programTime: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  programDays: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  programSectors: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  programSettings: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  programActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 6,
    gap: 4,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SchedulePage;
