import { fetchAuthSession } from "aws-amplify/auth";
import sha256 from "js-sha256";

const REGION = process.env.EXPO_PUBLIC_AWS_REGION || "us-east-2";
const ENDPOINT = `https://dynamodb.${REGION}.amazonaws.com`;

const TABLES = {
  PIVOT_DATA: "PivotData",
  SENSOR_HISTORY: "SensorHistory",
  SCHEDULES: "IrrigationSchedule",
};

const DEFAULTS = {
  status: {
    rotation_status: "Parado",
    direction: "Horário",
    power: 17,
    uv_light_status: "Desligada",
    water_pump_status: "Desligada",
    water_flow: 0,
    uv_intensity: 0,
  },
  sectors: {
    sector_1: {
      crop: "Milho",
      moisture: 70,
      is_active: false,
      color: "#FBBF24",
    },
    sector_2: { crop: "Soja", moisture: 65, is_active: true, color: "#34D399" },
  },
  sensors: { temperature: 30, soil_humidity: 68, air_humidity: 55 },
};

// ─── Crypto ───────────────────────────────────────────────────────────────────
const toHex = (arr) =>
  Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hashSHA256 = (data) => sha256(data);

const hmacSHA256 = (key, data) => new Uint8Array(sha256.hmac.array(key, data));

// ─── AWS Signature V4 ─────────────────────────────────────────────────────────
const signRequest = ({
  credentials,
  region,
  service,
  method,
  url,
  body,
  amzDate,
  dateStamp,
}) => {
  const host = new URL(url).host;
  const payloadHash = hashSHA256(body);
  const canonicalHeaders = `content-type:application/x-amz-json-1.0\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-security-token:${credentials.sessionToken}\n`;
  const signedHeaders = "content-type;host;x-amz-date;x-amz-security-token";
  const canonicalRequest = `${method}\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${hashSHA256(canonicalRequest)}`;

  const signingKey = hmacSHA256(
    hmacSHA256(
      hmacSHA256(
        hmacSHA256(`AWS4${credentials.secretAccessKey}`, dateStamp),
        region,
      ),
      service,
    ),
    "aws4_request",
  );

  const signature = toHex(hmacSHA256(signingKey, stringToSign));

  return `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};

// ─── DynamoDB Request ─────────────────────────────────────────────────────────
const dynamoRequest = async (action, payload, retries = 2) => {
  let session;
  for (let i = 0; i <= retries; i++) {
    try {
      session = await fetchAuthSession({ forceRefresh: i > 0 });
      if (session?.credentials?.sessionToken) break;
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      if (i === retries) throw e;
    }
  }

  const credentials = session?.credentials;
  if (!credentials?.sessionToken)
    throw new Error("Credenciais Cognito não disponíveis");

  const body = JSON.stringify(payload);
  const url = ENDPOINT;
  const date = new Date();
  const amzDate =
    date
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, "")
      .slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.0",
      "X-Amz-Target": `DynamoDB_20120810.${action}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Security-Token": credentials.sessionToken,
      Authorization: signRequest({
        credentials,
        region: REGION,
        service: "dynamodb",
        method: "POST",
        url,
        body,
        amzDate,
        dateStamp,
      }),
    },
    body,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DynamoDB error: ${err}`);
  }
  return response.json();
};

// ─── Marshal / Unmarshal ──────────────────────────────────────────────────────
const marshal = (obj) => {
  if (obj === null || obj === undefined) return { NULL: true };
  if (typeof obj === "boolean") return { BOOL: obj };
  if (typeof obj === "number") return { N: obj.toString() };
  if (typeof obj === "string") return { S: obj };
  if (Array.isArray(obj)) return { L: obj.map(marshal) };
  return {
    M: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, marshal(v)])),
  };
};

const unmarshal = (obj) => {
  if (!obj) return null;
  if ("NULL" in obj) return null;
  if ("BOOL" in obj) return obj.BOOL;
  if ("N" in obj) return parseFloat(obj.N);
  if ("S" in obj) return obj.S;
  if ("L" in obj) return obj.L.map(unmarshal);
  if ("M" in obj)
    return Object.fromEntries(
      Object.entries(obj.M).map(([k, v]) => [k, unmarshal(v)]),
    );
  return obj;
};

// ─── Serviço ──────────────────────────────────────────────────────────────────
export const dynamoDBService = {
  getPivotData: async (pivotId = "pivot_001") => {
    try {
      const [s, sec, sen] = await Promise.all([
        dynamoRequest("GetItem", {
          TableName: TABLES.PIVOT_DATA,
          Key: { pivotId: { S: pivotId }, dataType: { S: "status" } },
        }),
        dynamoRequest("GetItem", {
          TableName: TABLES.PIVOT_DATA,
          Key: { pivotId: { S: pivotId }, dataType: { S: "sectors" } },
        }),
        dynamoRequest("GetItem", {
          TableName: TABLES.PIVOT_DATA,
          Key: { pivotId: { S: pivotId }, dataType: { S: "sensors" } },
        }),
      ]);
      return {
        status: s.Item ? unmarshal(s.Item.data) : DEFAULTS.status,
        sectors: sec.Item ? unmarshal(sec.Item.data) : DEFAULTS.sectors,
        sensors: sen.Item ? unmarshal(sen.Item.data) : DEFAULTS.sensors,
      };
    } catch (e) {
      console.error("[DynamoDB] getPivotData:", e);
      return DEFAULTS;
    }
  },

  updateStatus: async (pivotId = "pivot_001", statusData) => {
    try {
      await dynamoRequest("PutItem", {
        TableName: TABLES.PIVOT_DATA,
        Item: {
          pivotId: { S: pivotId },
          dataType: { S: "status" },
          data: marshal(statusData),
          updatedAt: { N: Date.now().toString() },
        },
      });
    } catch (e) {
      console.error("[DynamoDB] updateStatus:", e);
    }
  },

  saveSensorReading: async (pivotId = "pivot_001", sensors) => {
    try {
      const now = Date.now();
      await dynamoRequest("PutItem", {
        TableName: TABLES.SENSOR_HISTORY,
        Item: {
          pivotId: { S: pivotId },
          timestamp: { N: now.toString() },
          ...Object.fromEntries(
            Object.entries(sensors).map(([k, v]) => [k, { N: v.toString() }]),
          ),
          ttl: { N: (Math.floor(now / 1000) + 30 * 24 * 60 * 60).toString() },
        },
      });
    } catch (e) {
      console.error("[DynamoDB] saveSensorReading:", e);
    }
  },

  getSensorHistory: async (pivotId = "pivot_001", hoursBack = 24) => {
    try {
      const startTime = Date.now() - hoursBack * 3_600_000;
      const result = await dynamoRequest("Query", {
        TableName: TABLES.SENSOR_HISTORY,
        KeyConditionExpression: "pivotId = :id AND #ts > :start",
        ExpressionAttributeNames: { "#ts": "timestamp" },
        ExpressionAttributeValues: {
          ":id": { S: pivotId },
          ":start": { N: startTime.toString() },
        },
        ScanIndexForward: true,
      });
      return (result.Items || []).map((item) => ({
        timestamp: parseFloat(item.timestamp?.N || 0),
        temperature: parseFloat(item.temperature?.N || 0),
        soil_humidity: parseFloat(item.soil_humidity?.N || 0),
        air_humidity: parseFloat(item.air_humidity?.N || 0),
      }));
    } catch (e) {
      console.error("[DynamoDB] getSensorHistory:", e);
      return [];
    }
  },

  getSchedules: async (pivotId = "pivot_001") => {
    try {
      const result = await dynamoRequest("Query", {
        TableName: TABLES.SCHEDULES,
        KeyConditionExpression: "pivotId = :id",
        ExpressionAttributeValues: { ":id": { S: pivotId } },
      });
      
      // Ajuste: Passando o item envelopado em { M: item } para o unmarshal decodificar perfeitamente
      return (result.Items || []).map((item) => unmarshal({ M: item }));
    } catch (e) {
      console.error("[DynamoDB] getSchedules:", e);
      return [];
    }
  },

  saveSchedule: async (pivotId = "pivot_001", schedule) => {
    try {
      await dynamoRequest("PutItem", {
        TableName: TABLES.SCHEDULES,
        Item: {
          pivotId: { S: pivotId },
          scheduleId: { S: schedule.scheduleId || `sched_${Date.now()}` },
          ...marshal(schedule).M,
          updatedAt: { N: Date.now().toString() },
        },
      });
    } catch (e) {
      console.error("[DynamoDB] saveSchedule:", e);
    }
  },

  deleteSchedule: async (pivotId = "pivot_001", scheduleId) => {
    try {
      await dynamoRequest("DeleteItem", {
        TableName: TABLES.SCHEDULES,
        Key: { pivotId: { S: pivotId }, scheduleId: { S: scheduleId } },
      });
    } catch (e) {
      console.error("[DynamoDB] deleteSchedule:", e);
    }
  },
};