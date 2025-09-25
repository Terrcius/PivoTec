import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import PieChart from "./components/PieChart";
import StatusCard from "./components/StatusCard";
import MetricCard from "./components/MetricCard";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import MainControls from "./components/MainControls";
import DetailedGraphsPage from "./components/DetailedGraphsPage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from "@env";

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
const pivotRef = ref(database, "pivots/pivot_001");

const App = () => {
  const [pivotData, setPivotData] = useState(null);
  const [view, setView] = useState("home");

  const handleToggleRotation = async () => {
    if (!pivotData) return;

    const newStatus =
      pivotData.status.rotation_status === "Rodando" ? "Parado" : "Rodando";

    // Lógica para enviar o comando HTTP para o ESP32
    if (newStatus === "Rodando") {
      // ---- QUANDO COMEÇA A RODAR ----
      try {
        console.log("Enviando comando /led1/on para o ESP32...");
        await fetch("http://192.168.15.117/led1/on");
        console.log("Comando ON enviado com sucesso.");
      } catch (error) {
        console.error("Falha ao enviar comando ON para o ESP32:", error);
      }
    } else {
      // ---- QUANDO PARA DE RODAR ----
      try {
        console.log("Enviando comando /led1/off para o ESP32...");
        await fetch("http://192.168.15.117/led1/off");
        console.log("Comando OFF enviado com sucesso.");
      } catch (error) {
        console.error("Falha ao enviar comando OFF para o ESP32:", error);
      }
    }

    // A atualização do status no Firebase ocorre independentemente do comando HTTP
    try {
      await update(ref(database, "pivots/pivot_001/status"), {
        rotation_status: newStatus,
      });
      console.log("Status de rotação no Firebase atualizado para:", newStatus);
    } catch (error) {
      console.error("Erro ao atualizar o status no Firebase:", error);
    }
  };

  const handleToggleStatus = (key) => {
    if (!pivotData || !pivotData.sectors || !pivotData.sectors[key]) {
      return;
    }

    const currentStatus = pivotData.sectors[key].is_active;
    const newStatus = !currentStatus;

    update(ref(database, `pivots/pivot_001/sectors/${key}`), {
      is_active: newStatus,
    })
      .then(() => {
        console.log(`Status do setor ${key} atualizado para: ${newStatus}`);
      })
      .catch((error) => {
        console.error("Erro ao atualizar o status do setor:", error);
      });
  };

  const handleToggleDirection = () => {
    if (!pivotData) return;
    const newDirection =
      pivotData.status.direction === "Horário" ? "Anti-horário" : "Horário";
    update(ref(database, "pivots/pivot_001/status"), {
      direction: newDirection,
    });
  };

  const handleChangePower = (value) => {
    update(ref(database, "pivots/pivot_001/status"), {
      power: parseInt(value, 10),
    });
  };

  const handleChangeWaterFlow = (value) => {
    update(ref(database, "pivots/pivot_001/status"), {
      water_flow: parseInt(value, 10),
    });
  };

  useEffect(() => {
    const onDataChange = onValue(pivotRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPivotData(data);
      } else {
        setPivotData(null);
      }
    });
    return () => onValue(pivotRef, onDataChange);
  }, []);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        console.log("Buscando dados dos sensores do ESP32...");
        const response = await fetch("http://192.168.15.117/sensor");
        const sensorJson = await response.json();

        console.log("Dados recebidos:", sensorJson);

        // Verificamos se os dados esperados (temp e umid) existem
        if (sensorJson.temp !== undefined && sensorJson.umid !== undefined) {
          // Atualiza os dados diretamente no Firebase
          const sensorRef = ref(database, "pivots/pivot_001/sensors");
          await update(sensorRef, {
            temperature: sensorJson.temp,
            air_humidity: sensorJson.umid, // Mapeando 'umid' para 'umidade do solo'
          });
          console.log("Dados dos sensores atualizados no Firebase.");
        }
      } catch (error) {
        console.error(
          "Falha ao buscar ou atualizar dados dos sensores:",
          error
        );
      }
    };

    // Roda a função uma vez imediatamente ao carregar o app
    fetchSensorData();

    // Configura o intervalo para rodar a cada 5 minutos
    // 5 minutos = 5 * 60 segundos * 1000 milissegundos
    const intervalId = setInterval(fetchSensorData, 20 * 1000);

    // Função de limpeza: para o intervalo quando o componente é desmontado
    return () => {
      console.log("Parando a busca periódica de sensores.");
      clearInterval(intervalId);
    };
  }, []); // O array vazio garante que este efeito rode apenas uma vez

  // ... resto do seu componente App ...

  if (!pivotData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando dados do pivô...</Text>
      </SafeAreaView>
    );
  }

  if (view === "temp") {
    return (
      <DetailedGraphsPage
        type="Temperatura"
        unit="°C"
        color="#FFA500"
        onGoBack={() => setView("home")}
      />
    );
  } else if (view === "soil-humidity") {
    return (
      <DetailedGraphsPage
        type="Umidade do Solo"
        unit="%"
        color="#4F89BC"
        onGoBack={() => setView("home")}
      />
    );
  } else if (view === "air-humidity") {
    return (
      <DetailedGraphsPage
        type="Umidade do Ar"
        unit="%"
        color="#8884d8"
        onGoBack={() => setView("home")}
      />
    );
  }

  const pieData = Object.keys(pivotData.sectors)
    .sort()
    .map((key) => pivotData.sectors[key])
    .map((sector) => ({
      percentage: 100 / Object.keys(pivotData.sectors).length,
      color: sector.is_active ? sector.color : "#d1d5db",
    }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F2F5" }}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Visualização do Pivô</Text>
          <View style={styles.chartWrapper}>
            <PieChart
              data={pieData}
              isAnimating={pivotData.status.rotation_status === "Rodando"}
              direction={pivotData.status.direction}
              power={pivotData.status.power}
            />
          </View>
        </View>

        <MainControls
          status={pivotData.status.rotation_status}
          direction={pivotData.status.direction}
          power={pivotData.status.power}
          waterFlow={pivotData.status.water_flow}
          onToggleRotation={handleToggleRotation}
          onToggleDirection={handleToggleDirection}
          onChangePower={handleChangePower}
          onChangeWaterFlow={handleChangeWaterFlow}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status dos Setores</Text>
          {Object.keys(pivotData.sectors)
            .sort()
            .map((key) => {
              const sector = pivotData.sectors[key];
              return (
                <StatusCard
                  key={key}
                  label={`${sector.crop}`}
                  value={`${sector.moisture}%`}
                  status={sector.is_active}
                  color={sector.color}
                  onToggle={() => handleToggleStatus(key)}
                />
              );
            })}
        </View>

        <View style={styles.metricsContainer}>
          <MetricCard
            value={`${pivotData.sensors.temperature}°C`}
            label="Temperatura"
            onClick={() => setView("temp")}
          />
          <MetricCard
            value={`${pivotData.sensors.soil_humidity}%`}
            label="Umidade do Solo"
            onClick={() => setView("soil-humidity")}
          />
          <MetricCard
            value={`${pivotData.sensors.air_humidity}%`}
            label="Umidade do Ar"
            onClick={() => setView("air-humidity")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
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
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    width: 150,
    alignSelf: "center",
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  contentContainer: {
    padding: 10,
  },
});

const AppWrapper = () => {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
};

export default AppWrapper;
