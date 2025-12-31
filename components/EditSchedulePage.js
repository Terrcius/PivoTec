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
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDatabase, ref, onValue, update } from "firebase/database";
import Slider from "@react-native-community/slider";

// Funções de validação de horário
const validateTimeFormat = (time) => {
  if (!time || typeof time !== "string") return false;

  // Verifica o formato HH:MM
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) return false;

  return true;
};

const formatTimeInput = (input) => {
  if (!input) return "";

  // Remove tudo que não é número
  let numbers = input.replace(/\D/g, "");

  // Limita a 4 dígitos
  numbers = numbers.substring(0, 4);

  if (numbers.length <= 2) {
    return numbers;
  }

  // Formata como HH:MM
  return numbers.substring(0, 2) + ":" + numbers.substring(2, 4);
};

const EditSchedulePage = ({ route, onGoBack }) => {
  const { programId } = route.params;
  const [program, setProgram] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [startTimeValid, setStartTimeValid] = useState(true);
  const [endTimeValid, setEndTimeValid] = useState(true);

  useEffect(() => {
    const programRef = ref(
      getDatabase(),
      `pivots/pivot_001/schedule/programs/${programId}`
    );
    const pivotRef = ref(getDatabase(), "pivots/pivot_001");

    const unsubscribeProgram = onValue(programRef, (snapshot) => {
      if (snapshot.exists()) {
        const programData = snapshot.val();
        setProgram(programData);
        // Valida os horários iniciais
        setStartTimeValid(validateTimeFormat(programData.start_time));
        setEndTimeValid(validateTimeFormat(programData.end_time));
      }
    });

    const unsubscribePivot = onValue(pivotRef, (snapshot) => {
      if (snapshot.exists()) {
        setPivotData(snapshot.val());
      }
    });

    return () => {
      unsubscribeProgram();
      unsubscribePivot();
    };
  }, [programId]);

  const updateProgramField = (field, value) => {
    const updatedProgram = { ...program, [field]: value };
    setProgram(updatedProgram);

    update(
      ref(getDatabase(), `pivots/pivot_001/schedule/programs/${programId}`),
      {
        [field]: value,
      }
    );
  };

  const handleTimeChange = (field, text) => {
    const formatted = formatTimeInput(text);

    // Atualiza o campo
    const updatedProgram = { ...program, [field]: formatted };
    setProgram(updatedProgram);

    // Valida o formato
    const isValid = validateTimeFormat(formatted);
    if (field === "start_time") {
      setStartTimeValid(isValid);
    } else {
      setEndTimeValid(isValid);
    }

    // Só atualiza no Firebase se for válido
    if (isValid) {
      update(
        ref(getDatabase(), `pivots/pivot_001/schedule/programs/${programId}`),
        {
          [field]: formatted,
        }
      );
    }
  };

  const toggleSectorInProgram = (sectorKey) => {
    const currentSectors = program.sectors || [];
    const newSectors = currentSectors.includes(sectorKey)
      ? currentSectors.filter((s) => s !== sectorKey)
      : [...currentSectors, sectorKey];

    updateProgramField("sectors", newSectors);
  };

  const toggleDayInProgram = (dayIndex) => {
    const currentDays = program.days || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter((d) => d !== dayIndex)
      : [...currentDays, dayIndex].sort();

    updateProgramField("days", newDays);
  };

  const handleSave = () => {
    // Verifica se os horários são válidos
    if (
      !validateTimeFormat(program.start_time) ||
      !validateTimeFormat(program.end_time)
    ) {
      Alert.alert(
        "Erro",
        "Por favor, insira horários válidos no formato HH:MM (ex: 08:00, 14:30)"
      );
      return;
    }

    // Verifica se o horário de término é depois do início
    const [startHours, startMinutes] = program.start_time
      .split(":")
      .map(Number);
    const [endHours, endMinutes] = program.end_time.split(":").map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (endTotal <= startTotal) {
      Alert.alert(
        "Erro",
        "O horário de término deve ser depois do horário de início"
      );
      return;
    }

    Alert.alert("Sucesso", "Agendamento atualizado com sucesso!");
    onGoBack();
  };

  if (!program || !pivotData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Agendamento</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nome do Agendamento</Text>
          <TextInput
            style={styles.nameInput}
            value={program.name}
            onChangeText={(text) => updateProgramField("name", text)}
            placeholder="Digite um nome para o agendamento"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Horário</Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>Início</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  !startTimeValid && program.start_time && styles.invalidInput,
                  startTimeValid && program.start_time && styles.validInput,
                ]}
                value={program.start_time}
                onChangeText={(text) => handleTimeChange("start_time", text)}
                placeholder="08:00"
                keyboardType="numeric"
                maxLength={5}
              />
              {!startTimeValid && program.start_time && (
                <Text style={styles.errorText}>Formato inválido</Text>
              )}
            </View>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeLabel}>Término</Text>
              <TextInput
                style={[
                  styles.timeInput,
                  !endTimeValid && program.end_time && styles.invalidInput,
                  endTimeValid && program.end_time && styles.validInput,
                ]}
                value={program.end_time}
                onChangeText={(text) => handleTimeChange("end_time", text)}
                placeholder="10:00"
                keyboardType="numeric"
                maxLength={5}
              />
              {!endTimeValid && program.end_time && (
                <Text style={styles.errorText}>Formato inválido</Text>
              )}
            </View>
          </View>
          <Text style={styles.timeHelpText}>
            Use o formato HH:MM (ex: 08:00, 14:30, 23:45)
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dias da Semana</Text>
          <View style={styles.daysContainer}>
            {dayNames.map((dayName, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  program.days?.includes(index) && styles.dayButtonActive,
                ]}
                onPress={() => toggleDayInProgram(index)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    program.days?.includes(index) && styles.dayButtonTextActive,
                  ]}
                >
                  {dayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Setores</Text>
          {pivotData.sectors &&
            Object.keys(pivotData.sectors)
              .sort()
              .map((sectorKey) => {
                const sector = pivotData.sectors[sectorKey];
                const isSelected = program.sectors?.includes(sectorKey);

                return (
                  <TouchableOpacity
                    key={sectorKey}
                    style={[
                      styles.sectorItem,
                      isSelected && styles.sectorItemSelected,
                    ]}
                    onPress={() => toggleSectorInProgram(sectorKey)}
                  >
                    <View style={styles.sectorInfo}>
                      <View
                        style={[
                          styles.sectorColor,
                          { backgroundColor: sector.color || "#6B7280" },
                        ]}
                      />
                      <Text style={styles.sectorName}>
                        {sectorKey.replace("sector_", "Setor ")} -{" "}
                        {sector.crop || "Sem cultura"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.selectionIndicator,
                        isSelected && styles.selectionIndicatorActive,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configurações</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Vazão de Água</Text>
            <Text style={styles.sliderValue}>{program.water_flow || 50}%</Text>
          </View>
          <Slider
            value={program.water_flow || 50}
            onValueChange={(value) =>
              updateProgramField("water_flow", Math.round(value))
            }
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#D1D5DB"
          />

          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Intensidade UV</Text>
            <Text style={styles.sliderValue}>
              {program.uv_intensity || 50}%
            </Text>
          </View>
          <Slider
            value={program.uv_intensity || 50}
            onValueChange={(value) =>
              updateProgramField("uv_intensity", Math.round(value))
            }
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="#F59E0B"
            maximumTrackTintColor="#D1D5DB"
          />

          <View style={[styles.settingItem, { marginTop: 15 }]}>
            <Text style={styles.settingText}>Agendamento Ativo</Text>
            <Switch
              value={program.active !== false}
              onValueChange={(value) => updateProgramField("active", value)}
              trackColor={{ false: "#D1D5DB", true: "#10B981" }}
            />
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  saveButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  contentContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    textAlign: "center",
    fontSize: 16,
  },
  invalidInput: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  validInput: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  timeHelpText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    minWidth: 40,
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: "#3B82F6",
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  dayButtonTextActive: {
    color: "#FFFFFF",
  },
  sectorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  sectorItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  sectorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectorColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  sectorName: {
    fontSize: 14,
    fontWeight: "500",
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionIndicatorActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  settingText: {
    fontSize: 14,
    color: "#374151",
  },
  sliderValue: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default EditSchedulePage;
