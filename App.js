import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import PivotVisualization from "./components/PivotVisualization";
import StatusCard from "./components/StatusCard";
import MetricCard from "./components/MetricCard";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, update } from "firebase/database";
import MainControls from "./components/MainControls";
import DetailedGraphsPage from "./components/DetailedGraphsPage";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
  const [isConnected, setIsConnected] = useState(false);
  // 1. ADICIONE UM ESTADO SEPARADO PARA O ÂNGULO
  const [currentAngle, setCurrentAngle] = useState(0);
  const [reconnectTimer, setReconnectTimer] = useState(0);
  const ws = useRef(null);

  const handleZeroPosition = () => {
    if (!isConnected) {
      console.warn("Comando 'ZERAR' não enviado: Pivô não conectado.");
      return;
    }
    console.log("Enviando comando para zerar a posição...");
    ws.current.send("ZERAR");
  };

  const handleToggleRotation = async () => {
    if (!pivotData || !isConnected) {
      console.warn(
        "Comando não enviado: Pivô não conectado ou dados não carregados."
      );
      return;
    }

    const newStatus =
      pivotData.status.rotation_status === "Rodando" ? "Parado" : "Rodando";

    ws.current.send(newStatus === "Rodando" ? "ON" : "OFF");

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
    if (
      !pivotData ||
      !pivotData.sectors ||
      !pivotData.sectors[key] ||
      !isConnected ||
      pivotData.status.rotation_status === "Rodando"
    ) {
      console.warn(
        "Comando não enviado: Pivô desconectado, rodando ou dados indisponíveis."
      );
      return;
    }

    const currentStatus = pivotData.sectors[key].is_active;
    const newStatus = !currentStatus;

    const sectorNumber = key.replace("sector_", "");
    const statusValue = newStatus ? 1 : 0;
    const command = `S${sectorNumber}=${statusValue}`;

    console.log(`Enviando comando do setor via WebSocket: ${command}`);
    ws.current.send(command);

    update(ref(database, `pivots/pivot_001/sectors/${key}`), {
      is_active: newStatus,
    });
  };

  const handleToggleDirection = () => {
    if (!pivotData || !isConnected) {
      console.warn(
        "Comando não enviado: Pivô não conectado ou dados não carregados."
      );
      return;
    }
    const newDirection =
      pivotData.status.direction === "Horário" ? "Anti-horário" : "Horário";
    ws.current.send(newDirection === "Anti-horário" ? "ANT" : "HOR");
    update(ref(database, "pivots/pivot_001/status"), {
      direction: newDirection,
    });
  };

  const handleChangePower = (value) => {
    if (!pivotData || !isConnected) {
      console.warn(
        "Comando não enviado: Pivô não conectado ou dados não carregados."
      );
      return;
    }
    let powerAsInt = parseInt(value, 10);
    let powerAsString = powerAsInt.toString();
    ws.current.send(powerAsString);
    update(ref(database, "pivots/pivot_001/status"), {
      power: parseInt(value, 10),
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
    return onDataChange;
  }, []);

  useEffect(() => {
    let countdownInterval;

    const connectWebSocket = () => {
      if (countdownInterval) clearInterval(countdownInterval);
      setReconnectTimer(0);

      // COLOQUE O IP CORRETO DO SEU ESP32 AQUI
      ws.current = new WebSocket("ws://192.168.137.14:81");

      ws.current.onopen = () => {
        console.log("Conectado ao ESP32 via WebSocket!");
        setIsConnected(true);
      };
      ws.current.onmessage = (e) => {
        console.log("Recebida mensagem do ESP32:", e.data);
        // 2. ADICIONE A LÓGICA DE PARSE DO JSON DE VOLTA
        try {
          const message = JSON.parse(e.data);
          if (message.ang !== undefined) {
            setCurrentAngle(parseFloat(message.ang));
          }
        } catch (error) {
          // Ignora erros se a mensagem não for JSON (ex: "Conectado!")
        }
      };

      ws.current.onclose = () => {
        console.log("Desconectado do ESP32. Tentando reconectar...");
        setIsConnected(false);

        let timer = 3;
        setReconnectTimer(timer);

        countdownInterval = setInterval(() => {
          timer -= 1;
          setReconnectTimer(timer);
          if (timer === 0) {
            clearInterval(countdownInterval);
            connectWebSocket();
          }
        }, 1000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, []);

  if (!pivotData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando dados do pivô...</Text>
      </SafeAreaView>
    );
  }

  const connectionMessage = isConnected
    ? null
    : reconnectTimer > 0
    ? `Tentando reconexão em ${reconnectTimer}s...`
    : "Conectando ao pivô...";

  if (view === "temp" || view === "soil-humidity" || view === "air-humidity") {
    const pageDetails = {
      temp: { type: "Temperatura", unit: "°C", color: "#FFA500" },
      "soil-humidity": { type: "Umidade do Solo", unit: "%", color: "#4F89BC" },
      "air-humidity": { type: "Umidade do Ar", unit: "%", color: "#8884d8" },
    };
    const details = pageDetails[view];
    return <DetailedGraphsPage {...details} onGoBack={() => setView("home")} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F2F5" }}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Posição do Pivô</Text>
          {/* Passando o ângulo e os setores para o componente de visualização */}
          <PivotVisualization
            angle={currentAngle}
            sectors={pivotData.sectors}
          />
        </View>

        <MainControls
          status={pivotData.status.rotation_status}
          direction={pivotData.status.direction}
          power={pivotData.status.power}
          onToggleRotation={handleToggleRotation}
          onToggleDirection={handleToggleDirection}
          onChangePower={handleChangePower}
          isConnected={isConnected}
          onZeroPosition={handleZeroPosition}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status dos Setores</Text>
          {connectionMessage && (
            <Text style={[styles.disconnectedText, styles.connectingText]}>
              {connectionMessage}
            </Text>
          )}
          {Object.keys(pivotData.sectors)
            .sort()
            .map((key) => {
              const sector = pivotData.sectors[key];
              const isSectorAdjustable =
                isConnected && pivotData.status.rotation_status === "Parado";

              return (
                <StatusCard
                  key={key}
                  label={`${sector.crop}`}
                  value={`${sector.moisture}%`}
                  status={sector.is_active}
                  color={sector.color}
                  onToggle={() => handleToggleStatus(key)}
                  isAdjustable={isSectorAdjustable}
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
  disconnectedText: {
    textAlign: "center",
    color: "#ef4444",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "bold",
  },
  connectingText: {
    color: "#F59E0B",
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
