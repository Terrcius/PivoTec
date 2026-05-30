import { Amplify } from "aws-amplify";

export const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION || "us-east-1";
export const IOT_ENDPOINT = process.env.EXPO_PUBLIC_AWS_IOT_ENDPOINT;
export const IDENTITY_POOL_ID = process.env.EXPO_PUBLIC_AWS_IDENTITY_POOL_ID;

export const TABLES = {
  PIVOT_DATA: "PivotData",
  SENSOR_HISTORY: "SensorHistory",
  SCHEDULES: "IrrigationSchedule",
};

export const configureAWS = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        region: AWS_REGION,
        identityPoolId: IDENTITY_POOL_ID,
        allowGuestAccess: true,
      },
    },
  });
};
