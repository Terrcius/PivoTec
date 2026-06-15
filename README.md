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
- **Pragas** — classificação de pragas/doenças da soja por foto (câmera ou
  galeria), usando um modelo **YOLOv8** que roda localmente (ver `backend/`).
- **Perfil** — dados da conta (dados fictícios; login em implementação).

## Arquitetura

```
App.js                     Estado global + navegação por abas (BottomNav)
components/                Telas e componentes de UI (tema escuro em theme.js)
services/
  awsConfig.js             Configuração do Amplify / Cognito
  iotService.js            MQTT pub/sub (AWS IoT Core via WebSocket)
  dynamoDBService.js       Acesso ao DynamoDB com assinatura SigV4 manual
backend/                   Servidor de IA (Python/FastAPI + YOLOv8-cls)
                           Classifica pragas/doenças — ver backend/README.md
```

A comunicação em tempo real usa MQTT (`pivot/<id>/telemetry|status|command`).
O histórico de sensores e os agendamentos são persistidos no DynamoDB.

## Configuração

> Pré-requisitos: **Node.js** + **Python 3** instalados.

1. Instale **todas** as dependências (app + backend de IA) de uma vez:
   ```bash
   npm run dependency
   ```
   Esse script roda `npm install` e `python -m pip install -r backend/requirements.txt`.
2. Crie um arquivo `.env` na raiz a partir do modelo:
   ```bash
   cp .env.example .env
   ```
   e preencha as variáveis (AWS e Firebase). O `.env` **não** é versionado.
3. Para builds Android, forneça o seu `google-services.json` na raiz
   (também não versionado).

## Backend de IA (classificação de pragas)

O modelo roda localmente em um servidor Python. Resumo (detalhes em
`backend/README.md`):

```bash
cd backend
python download_pragas.py     # baixa as imagens (insetos)
python download_doencas.py    # baixa as imagens (doenças)
python split_cls.py           # separa treino/validação
python train.py               # treina -> runs/classify/train/weights/best.pt
python -m uvicorn main:app --host 0.0.0.0 --port 8000   # sobe o servidor
```

Depois, ajuste `API_URL` em `components/PestDetector.js` com o IP do PC
(`ipconfig`). PC e celular precisam estar no **mesmo Wi-Fi**.

## Scripts

```bash
npm run dependency  # instala dependências do app + do backend de IA
npm start           # inicia o Expo
npm run android     # abre no Android
npm run ios         # abre no iOS
npm run web         # abre no navegador
npm test            # testes (Jest)
npm run lint:fix    # formata com Prettier
```
