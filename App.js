import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import PivotVisualization from "./components/PivotVisualization";
import StatusCard from "./components/StatusCard";
import MetricCard from "./components/MetricCard";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  update,
  remove,
  push,
} from "firebase/database";
import MainControls from "./components/MainControls";
import DetailedGraphsPage from "./components/DetailedGraphsPage";
import SchedulePage from "./components/SchedulePage";
import EditSchedulePage from "./components/EditSchedulePage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from "@env";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Referências do Firebase
const pivotRef = ref(database, "pivots/pivot_001");
const statusRef = ref(database, "pivots/pivot_001/status");
const sectorsRef = ref(database, "pivots/pivot_001/sectors");
const scheduleRef = ref(database, "pivots/pivot_001/schedule");
const sensorsRef = ref(database, "pivots/pivot_001/sensors"); // Nova referência para sensores

// VALIDAÇÃO DE HORÁRIO - FUNÇÕES QUE REALMENTE FUNCIONAM
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

const App = () => {
  const [pivotData, setPivotData] = useState(null);
  const [view, setView] = useState("home");
  const [isConnected, setIsConnected] = useState(true);

  // --- FUNÇÕES AUXILIARES ---

  const calculateSectorAngles = (sectors) => {
    const sectorCount = Object.keys(sectors || {}).length;
    if (sectorCount === 0) return {};

    const sectorAngle = 360 / sectorCount;
    const sectorKeys = Object.keys(sectors).sort();

    const updatedSectors = {};

    sectorKeys.forEach((key, index) => {
      const startAngle = index * sectorAngle;
      const endAngle = (index + 1) * sectorAngle;

      updatedSectors[key] = {
        ...sectors[key],
        start_angle: startAngle,
        end_angle: endAngle,
      };
    });

    return updatedSectors;
  };

  const shouldPumpBeOn = (currentAngle, sectors) => {
    if (!sectors) return false;

    const activeSector = Object.values(sectors).find((sector) => {
      if (!sector.is_active) return false;

      const start = sector.start_angle || 0;
      const end = sector.end_angle || 0;

      if (start < end) {
        return currentAngle >= start && currentAngle < end;
      } else {
        return currentAngle >= start || currentAngle < end;
      }
    });

    return !!activeSector;
  };

  const checkSchedule = (schedule, currentTime = new Date()) => {
    if (!schedule || schedule.enabled === false || !schedule.programs) {
      return null;
    }

    const currentDay = currentTime.getDay();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeString = `${currentHours
      .toString()
      .padStart(2, "0")}:${currentMinutes.toString().padStart(2, "0")}`;

    for (const programId in schedule.programs) {
      const program = schedule.programs[programId];

      if (program.active === true && program.days) {
        const daysArray = Object.values(program.days || {});

        if (daysArray.includes(currentDay)) {
          if (
            currentTimeString >= program.start_time &&
            currentTimeString <= program.end_time
          ) {
            console.log(
              `⏰ Agendamento ativo: ${program.name} ${program.start_time}-${program.end_time}`
            );
            return {
              shouldRun: true,
              programId: programId,
              program: program,
            };
          }
        }
      }
    }

    return null;
  };

  // --- FUNÇÕES DE CONTROLE ---

  const handleToggleRotation = async () => {
    if (!pivotData || !pivotData.status) return;

    const newStatus =
      pivotData.status.rotation_status === "Rodando" ? "Parado" : "Rodando";

    try {
      await update(statusRef, {
        rotation_status: newStatus,
      });
    } catch (error) {
      console.error("Erro ao atualizar status de rotação:", error);
    }
  };

  const handleToggleStatus = (sectorKey) => {
    if (
      !pivotData ||
      !pivotData.sectors ||
      !pivotData.sectors[sectorKey] ||
      (pivotData.status && pivotData.status.rotation_status === "Rodando")
    ) {
      return;
    }

    const currentStatus = pivotData.sectors[sectorKey].is_active;
    const newSectorStatus = !currentStatus;

    update(ref(database, `pivots/pivot_001/sectors/${sectorKey}`), {
      is_active: newSectorStatus,
    });
  };

  const handleToggleDirection = () => {
    if (!pivotData || !pivotData.status) return;

    const newDirection =
      pivotData.status.direction === "Horário" ? "Anti-horário" : "Horário";

    update(statusRef, {
      direction: newDirection,
    });
  };

  const handleChangePower = (value) => {
    const powerValue = parseInt(value, 10);
    update(statusRef, {
      power: powerValue,
    });
  };

  const handleToggleUVLight = async () => {
    if (!pivotData || !pivotData.status) return;

    const currentStatus = pivotData.status.uv_light_status === "Ligada";
    const newStatus = !currentStatus;
    const statusString = newStatus ? "Ligada" : "Desligada";

    try {
      await update(statusRef, {
        uv_light_status: statusString,
      });
    } catch (error) {
      console.error("Erro ao atualizar status UV:", error);
    }
  };

  const handleChangeFlow = (value) => {
    const flowValue = Math.round(value);
    update(statusRef, {
      water_flow: flowValue,
    });
  };

  const handleChangeUVIntensity = (value) => {
    const intensityValue = Math.round(value);
    update(statusRef, {
      uv_intensity: intensityValue,
    });
  };

  // --- FUNÇÃO MODIFICADA: DEFINIR POSIÇÃO INICIAL PARA ÂNGULO 1 ---
  const handleZeroPosition = async () => {
    if (!isConnected) {
      console.log("Não é possível zerar posição: dispositivo desconectado");
      Alert.alert(
        "Erro",
        "Dispositivo desconectado. Não é possível definir posição inicial."
      );
      return;
    }

    if (pivotData?.status?.rotation_status === "Rodando") {
      console.log("Não é possível zerar posição: pivô está rodando");
      Alert.alert("Erro", "Pare a rotação antes de definir a posição inicial.");
      return;
    }

    try {
      // Atualiza o ângulo para 1 no Firebase
      await update(sensorsRef, {
        angle: 1,
      });

      console.log("✅ Posição inicial definida para ângulo 1°");

      // Feedback para o usuário
      Alert.alert("Sucesso", "Posição inicial definida para ângulo 1°");
    } catch (error) {
      console.error("❌ Erro ao definir posição inicial:", error);
      Alert.alert("Erro", "Não foi possível definir a posição inicial");
    }
  };

  const handleGoToSchedule = () => {
    setView("schedule");
  };

  // --- FUNÇÕES DE GERENCIAMENTO DE SETORES ---
  const handleAddSector = async () => {
    const currentSectorCount = Object.keys(pivotData.sectors || {}).length;
    if (currentSectorCount >= 4) {
      return;
    }

    const newSectorData = {
      is_active: false,
      moisture: 0,
      crop: "Indefinido",
      color: "#CCCCCC",
      use_main_controls: true,
      custom_flow: 50,
      custom_uv_intensity: 50,
      custom_speed: 50,
      createdAt: new Date().getTime(),
    };

    try {
      await push(sectorsRef, newSectorData);
    } catch (error) {
      console.error("Erro ao adicionar novo setor:", error);
    }
  };

  const handleRemoveSector = async (sectorKey) => {
    if (Object.keys(pivotData.sectors || {}).length <= 1) {
      return;
    }

    try {
      const sectorRef = ref(database, `pivots/pivot_001/sectors/${sectorKey}`);
      await remove(sectorRef);
    } catch (error) {
      console.error("Erro ao remover setor:", error);
    }
  };

  const handleEditSchedule = (programId) => {
    setView(`edit-schedule-${programId}`);
  };

  // --- USE EFFECT PRINCIPAL ---
  useEffect(() => {
    let isMounted = true;

    const unsubscribePivot = onValue(
      pivotRef,
      (snapshot) => {
        if (!isMounted) return;

        if (snapshot.exists()) {
          const data = snapshot.val();
          setPivotData(data);

          // Atualiza status de conexão
          setIsConnected(true);
        } else {
          setPivotData({
            sectors: {},
            sensors: {},
            status: { water_pump_status: "Desligada" },
            schedule: {},
          });
        }
      },
      (error) => {
        console.error("Erro no listener do Firebase:", error);
        setIsConnected(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribePivot();
    };
  }, []);

  // --- USE EFFECT PARA LÓGICA DE ÂNGULOS ---
  useEffect(() => {
    if (!pivotData || !pivotData.sectors) return;

    const sectors = pivotData.sectors;
    const sectorKeys = Object.keys(sectors);

    const needsAngleUpdate = sectorKeys.some(
      (key) =>
        sectors[key].start_angle === undefined ||
        sectors[key].end_angle === undefined
    );

    if (needsAngleUpdate && sectorKeys.length > 0) {
      const updatedSectors = calculateSectorAngles(sectors);

      sectorKeys.forEach((key) => {
        update(ref(database, `pivots/pivot_001/sectors/${key}`), {
          start_angle: updatedSectors[key].start_angle,
          end_angle: updatedSectors[key].end_angle,
        });
      });
    }
  }, [pivotData?.sectors]);

  // --- USE EFFECT PARA LÓGICA DA BOMBA ---
  useEffect(() => {
    if (!pivotData || !pivotData.status || !pivotData.sensors) return;

    const sectors = pivotData.sectors || {};
    const currentAngle = pivotData.sensors.angle || 0;
    const shouldPumpBeOnNow = shouldPumpBeOn(currentAngle, sectors);

    if (
      pivotData.status.water_pump_status !==
      (shouldPumpBeOnNow ? "Ligada" : "Desligada")
    ) {
      update(statusRef, {
        water_pump_status: shouldPumpBeOnNow ? "Ligada" : "Desligada",
      });
    }
  }, [pivotData?.sensors?.angle, pivotData?.sectors]);

  // --- USE EFFECT PARA AGENDAMENTO ---
  useEffect(() => {
    const scheduleInterval = setInterval(() => {
      onValue(
        scheduleRef,
        (snapshot) => {
          const scheduleData = snapshot.val();
          const scheduleResult = checkSchedule(scheduleData);

          if (scheduleResult && scheduleResult.shouldRun) {
            onValue(
              statusRef,
              (statusSnapshot) => {
                const currentStatus = statusSnapshot.val();
                if (
                  currentStatus &&
                  currentStatus.rotation_status === "Parado"
                ) {
                  const updates = {
                    rotation_status: "Rodando",
                  };

                  if (scheduleResult.program.water_flow) {
                    updates.water_flow = scheduleResult.program.water_flow;
                  }

                  if (scheduleResult.program.uv_intensity) {
                    updates.uv_intensity = scheduleResult.program.uv_intensity;
                  }

                  update(statusRef, updates);
                }
              },
              { onlyOnce: true }
            );
          }
        },
        { onlyOnce: true }
      );
    }, 60000);

    return () => {
      clearInterval(scheduleInterval);
    };
  }, []);

  // --- LÓGICA DE RENDERIZAÇÃO ---
  if (!pivotData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando dados do pivô...</Text>
      </SafeAreaView>
    );
  }

  const orderedSectors = Object.keys(pivotData.sectors || {})
    .map((key) => ({
      key,
      ...pivotData.sectors[key],
    }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  // Tela de Agendamentos
  if (view === "schedule") {
    return (
      <SchedulePage
        onGoBack={() => setView("home")}
        onEditSchedule={handleEditSchedule}
        validateTimeFormat={validateTimeFormat}
        formatTimeInput={formatTimeInput}
      />
    );
  }

  // Tela de Edição de Agendamento
  if (view.startsWith("edit-schedule-")) {
    const programId = view.replace("edit-schedule-", "");
    return (
      <EditSchedulePage
        onGoBack={() => setView("schedule")}
        route={{ params: { programId } }}
        validateTimeFormat={validateTimeFormat}
        formatTimeInput={formatTimeInput}
      />
    );
  }

  // Telas de Gráficos
  if (view === "temp" || view === "soil-humidity" || view === "air-humidity") {
    const pageDetails = {
      temp: {
        type: "Temperatura",
        unit: "°C",
        color: "#FFA500",
        currentValue: pivotData.sensors?.temperature || 0,
      },
      "soil-humidity": {
        type: "Umidade do Solo",
        unit: "%",
        color: "#4F89BC",
        currentValue: pivotData.sensors?.soil_humidity || 0,
      },
      "air-humidity": {
        type: "Umidade do Ar",
        unit: "%",
        color: "#8884d8",
        currentValue: pivotData.sensors?.air_humidity || 0,
      },
    };
    const details = pageDetails[view];
    return <DetailedGraphsPage {...details} onGoBack={() => setView("home")} />;
  }

  // RENDERIZAÇÃO DA PÁGINA HOME
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Controle de Pivô</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleGoToSchedule}
            style={styles.headerButton}
          >
            <Feather name="calendar" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Visualização do Pivô */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Posição do Pivô</Text>
          <PivotVisualization
            angle={pivotData.sensors?.angle || 0}
            sectors={pivotData.sectors || {}}
          />
        </View>

        {/* Controles Principais */}
        {pivotData.status && (
          <MainControls
            status={pivotData.status.rotation_status}
            direction={pivotData.status.direction}
            power={pivotData.status.power}
            uvLightStatus={pivotData.status.uv_light_status}
            waterFlow={pivotData.status.water_flow || 50}
            uvIntensity={pivotData.status.uv_intensity || 50}
            onToggleRotation={handleToggleRotation}
            onToggleDirection={handleToggleDirection}
            onChangePower={handleChangePower}
            onToggleUVLight={handleToggleUVLight}
            onChangeFlow={handleChangeFlow}
            onChangeUVIntensity={handleChangeUVIntensity}
            isConnected={isConnected}
            onZeroPosition={handleZeroPosition} // ← Função modificada aqui
            isControllable={pivotData.status.is_controllable}
          />
        )}

        {/* Status dos Setores */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status dos Setores</Text>
          {orderedSectors.map((sector, index) => {
            const key = sector.key;
            const sectorNumber = index + 1;

            const isSectorAdjustable =
              pivotData.status &&
              pivotData.status.rotation_status === "Parado" &&
              pivotData.status.is_controllable;

            return (
              <StatusCard
                key={key}
                label={`Setor ${sectorNumber} - ${
                  sector.crop || "Sem Cultura"
                }`}
                value={`${sector.moisture || 0}%`}
                status={sector.is_active}
                color={sector.color || "#6B7280"}
                onToggle={() => handleToggleStatus(key)}
                isAdjustable={isSectorAdjustable}
                sectorKey={key}
                crop={sector.crop}
                useMainControls={sector.use_main_controls}
                customFlow={sector.custom_flow}
                customUVIntensity={sector.custom_uv_intensity}
                customSpeed={sector.custom_speed}
                onRemove={handleRemoveSector}
                onUpdateSector={(updatedData) => {
                  update(
                    ref(database, `pivots/pivot_001/sectors/${key}`),
                    updatedData
                  );
                }}
              />
            );
          })}

          {/* Botão para Adicionar Novo Setor */}
          {Object.keys(pivotData.sectors || {}).length < 4 && (
            <TouchableOpacity
              onPress={handleAddSector}
              style={styles.addSectorButton}
            >
              <Feather name="plus-circle" size={30} color="#3B82F6" />
              <Text style={styles.addSectorButtonText}>Adicionar Setor</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Métricas dos Sensores */}
        <View style={styles.metricsContainer}>
          <MetricCard
            value={`${pivotData.sensors?.temperature || 0}°C`}
            label="Temperatura"
            onClick={() => setView("temp")}
          />
          <MetricCard
            value={`${pivotData.sensors?.soil_humidity || 0}%`}
            label="Umidade do Solo"
            onClick={() => setView("soil-humidity")}
          />
          <MetricCard
            value={`${pivotData.sensors?.air_humidity || 0}%`}
            label="Umidade do Ar"
            onClick={() => setView("air-humidity")}
          />
        </View>

        {/* Status de Agendamento (Preview) */}
        {pivotData.schedule && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Agendamento</Text>
            <View style={styles.schedulePreview}>
              <Text style={styles.scheduleText}>
                {pivotData.schedule.enabled
                  ? "✓ Agendamento Ativo"
                  : "⏰ Agendamento Inativo"}
              </Text>
              <TouchableOpacity
                style={styles.scheduleButton}
                onPress={handleGoToSchedule}
              >
                <Text style={styles.scheduleButtonText}>Configurar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  loadingText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#374151",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  contentContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  schedulePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  scheduleText: {
    fontSize: 14,
    color: "#374151",
  },
  scheduleButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  scheduleButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  addSectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  addSectorButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B82F6",
  },
});

const AppWrapper = () => {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};

export { validateTimeFormat, formatTimeInput };
export default AppWrapper;
