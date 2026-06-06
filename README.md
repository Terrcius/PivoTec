# PivôTec

Aplicativo **Expo / React Native** para monitoramento e controle de pivôs de
irrigação via IoT, com backend na **AWS** (IoT Core + DynamoDB + Cognito).

## Funcionalidades

- **Início** — visualização da posição do pivô em tempo real, sensores
  (temperatura, umidade do solo e do ar) e status dos setores.
- **Configurar** — controle manual: rotação, direção, luz UV, vazão da água,
  intensidade UV, potência e reposicionamento.
- **Agendar** — agendamentos de irrigação por dia/horário/setor.
- **Dados** — histórico dos sensores em gráficos (1h / 6h / 24h / 7d).
- **Perfil** — dados da conta (dados fictícios; login em implementação).

## Arquitetura

```
App.js                     Estado global + navegação por abas (BottomNav)
components/                Telas e componentes de UI (tema escuro em theme.js)
services/
  awsConfig.js             Configuração do Amplify / Cognito
  iotService.js            MQTT pub/sub (AWS IoT Core via WebSocket)
  dynamoDBService.js       Acesso ao DynamoDB com assinatura SigV4 manual
```

A comunicação em tempo real usa MQTT (`pivot/<id>/telemetry|status|command`).
O histórico de sensores e os agendamentos são persistidos no DynamoDB.

## Configuração

1. Instale as dependências:
   ```bash
   npm install      # ou: yarn
   ```
2. Crie um arquivo `.env` na raiz a partir do modelo:
   ```bash
   cp .env.example .env
   ```
   e preencha as variáveis (AWS e Firebase). O `.env` **não** é versionado.
3. Para builds Android, forneça o seu `google-services.json` na raiz
   (também não versionado).

## Scripts

```bash
npm start        # inicia o Expo
npm run android  # abre no Android
npm run ios      # abre no iOS
npm run web      # abre no navegador
npm test         # testes (Jest)
npm run lint:fix # formata com Prettier
```
