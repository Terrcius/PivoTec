import { PubSub } from "@aws-amplify/pubsub";
import { AWS_REGION, IOT_ENDPOINT } from "./awsConfig";

const PIVOT_ID = "pivot_001";

export const TOPICS = {
  TELEMETRY: `pivot/${PIVOT_ID}/telemetry`, // ESP32 → Cloud (sensores, ângulo)
  STATUS: `pivot/${PIVOT_ID}/status`, // ESP32 → Cloud (status)
  CONTROL: `pivot/${PIVOT_ID}/control`, // Cloud → ESP32 (comandos)
};

// Instância do PubSub configurada para AWS IoT Core
const pubsub = new PubSub({
  region: AWS_REGION,
  endpoint: `wss://${IOT_ENDPOINT}/mqtt`,
});

export const iotService = {
  /**
   * Inscreve nos tópicos de telemetria e status do pivô.
   * Retorna a subscription (chame .unsubscribe() para limpar).
   */
  subscribe: (onMessage, onError) => {
    return pubsub
      .subscribe({ topics: [TOPICS.TELEMETRY, TOPICS.STATUS] })
      .subscribe({
        next: ({ value }) => onMessage(value),
        error: (err) => {
          console.error("[IoT] Erro na subscription:", err);
          onError?.(err);
        },
      });
  },

  /**
   * Envia um comando ao ESP32 via IoT Core.
   */
  sendCommand: async (command) => {
    try {
      await pubsub.publish({
        topics: [TOPICS.CONTROL],
        message: { cmd: command, ts: Date.now() },
      });
      console.log(`[IoT] Comando enviado: ${command}`);
    } catch (err) {
      console.error("[IoT] Erro ao enviar comando:", err);
      throw err;
    }
  },
};
