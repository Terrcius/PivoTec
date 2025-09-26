import React, { useState, useEffect, useRef } from "react";
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
  const [isConnected, setIsConnected] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [reconnectTimer, setReconnectTimer] = useState(0);
  const ws = useRef(null);

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
      !isConnected
    ) {
      console.warn(
        "Comando não enviado: Não conectado ao pivô ou dados não carregados."
      );
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

  const handleChangeWaterFlow = (value) => {
    if (!pivotData || !isConnected) {
      console.warn(
        "Comando não enviado: Pivô não conectado ou dados não carregados."
      );
      return;
    }
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
    // A função de limpeza do onValue é a própria função de unsubscribe que ele retorna
    return onDataChange;
  }, []);

  useEffect(() => {
    let countdownInterval;

    const connectWebSocket = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      setReconnectTimer(0);

      // COLOQUE O IP CORRETO DO SEU ESP32 AQUI
      ws.current = new WebSocket("ws://192.168.137.234:81");

      ws.current.onopen = () => {
        console.log("Conectado ao ESP32 via WebSocket!");
        setIsConnected(true);
        if (countdownInterval) {
          clearInterval(countdownInterval);
          setReconnectTimer(0);
        }
      };

      ws.current.onmessage = (e) => {
        if (
          typeof e.data === "string" &&
          e.data.startsWith("{") &&
          e.data.endsWith("}")
        ) {
          try {
            const message = JSON.parse(e.data);

            if (message.temp !== undefined && message.umid !== undefined) {
              const sensorRef = ref(database, "pivots/pivot_001/sensors");
              update(sensorRef, {
                temperature: message.temp,
                air_humidity: message.umid,
                angle: message.ang,
              });
            }

            if (message.ang !== undefined) {
              setCurrentRotation(parseFloat(message.ang));
            }
          } catch (error) {
            console.error(
              "Erro ao processar o JSON recebido do WebSocket:",
              error
            );
          }
        } else {
          console.log("Recebida mensagem de status do ESP32:", e.data);
        }
      };

      ws.current.onerror = (e) => {
        console.error("Erro no WebSocket:", e.message);
      };

      ws.current.onclose = () => {
        console.log(
          "Desconectado do ESP32. Tentando reconectar em 3 segundos..."
        );
        setIsConnected(false);

        let timer = 3;
        setReconnectTimer(timer);

        countdownInterval = setInterval(() => {
          timer -= 1;
          setReconnectTimer(timer);

          if (timer === 0) {
            clearInterval(countdownInterval);
            setTimeout(connectWebSocket, 100);
          }
        }, 1000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  if (!pivotData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando dados do pivô...</Text>
      </SafeAreaView>
    );
  }

  const connectionMessage = isConnected
    ? null
    : reconnectTimer > 0
    ? `Tentando reconexão em ${reconnectTimer} segundos...`
    : "Conectando ao pivô...";

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
              rotationAngle={currentRotation}
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
          isConnected={isConnected}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status dos Setores</Text>
          {!isConnected && (
            <Text style={[styles.disconnectedText, styles.connectingText]}>
              {connectionMessage}
            </Text>
          )}
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
