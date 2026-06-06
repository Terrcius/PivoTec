import { Amplify } from "aws-amplify";

export const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION || "us-east-2";
export const IOT_ENDPOINT = process.env.EXPO_PUBLIC_AWS_IOT_ENDPOINT;
export const IDENTITY_POOL_ID = process.env.EXPO_PUBLIC_AWS_IDENTITY_POOL_ID;

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
  console.log("[AWS] ✅ Amplify configurado");
  console.log("[AWS] Região:", AWS_REGION);
  console.log("[AWS] Endpoint:", IOT_ENDPOINT);
  console.log("[AWS] Pool ID:", IDENTITY_POOL_ID);
};
