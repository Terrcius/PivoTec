"""
Servidor de classificacao de pragas/doencas (FastAPI + YOLOv8-cls).

O app Expo envia uma foto -> este servidor roda o classificador no PC ->
devolve a classe mais provavel (praga/doenca/folha saudavel) + top 3.

Como rodar (PC e celular no MESMO Wi-Fi):
  python -m uvicorn main:app --host 0.0.0.0 --port 8000

Teste no PC:
  http://localhost:8000/health  -> {"status": "ok"}
  http://localhost:8000/docs    -> testar o /detectar
"""

import io

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

# ── Modelo ──────────────────────────────────────────────────────
# Aponte para o best.pt gerado pelo train.py (classificacao).
# Enquanto nao treinar, use "yolov8n-cls.pt" para testar o fluxo
# (ele classifica nas 1000 classes do ImageNet, nao nas pragas).
MODELO_PATH = "runs/classify/train-6/weights/best.pt"
# MODELO_PATH = "yolov8n-cls.pt"  # modelo generico (so para testar o fluxo)

modelo = YOLO(MODELO_PATH)

# ── App ─────────────────────────────────────────────────────────
app = FastAPI(title="Classificador de Pragas/Doencas - Pivo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "modelo": MODELO_PATH}


@app.post("/detectar")
async def detectar(foto: UploadFile = File(...)):
    """
    Recebe uma imagem (campo 'foto') e devolve a classe mais provavel.

    Resposta:
    {
      "classe": "ferrugem_asiatica",
      "confianca": 0.92,
      "top": [
        {"classe": "ferrugem_asiatica", "confianca": 0.92},
        {"classe": "mancha_alvo",       "confianca": 0.05},
        {"classe": "oidio",             "confianca": 0.02}
      ]
    }
    """
    conteudo = await foto.read()
    imagem = Image.open(io.BytesIO(conteudo)).convert("RGB")

    r = modelo.predict(imagem, verbose=False)[0]
    probs = r.probs

    # top 3 classes mais provaveis
    top = [
        {"classe": modelo.names[i], "confianca": round(float(probs.data[i]), 3)}
        for i in probs.top5[:3]
    ]

    return {
        "classe": modelo.names[probs.top1],
        "confianca": round(float(probs.top1conf), 3),
        "top": top,
    }
