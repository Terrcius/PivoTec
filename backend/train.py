"""
Treino do YOLOv8 em modo CLASSIFICACAO (uma pasta por classe).

Nao precisa anotar nada: o YOLO aprende a classe pelo NOME DA PASTA.

Estrutura esperada:
  dataset_cls/
    train/<classe>/*.jpg
    val/<classe>/*.jpg

Pre-requisitos:
  1. pip install -r requirements.txt
  2. python download_pragas.py / download_doencas.py  (baixa as imagens)
  3. python split_cls.py                               (separa train/val)

Como rodar:
  python train.py

Saida:
  runs/classify/train/weights/best.pt   <- modelo treinado (use no main.py)
"""

from ultralytics import YOLO

# Modelo base de CLASSIFICACAO (note o sufixo "-cls").
modelo = YOLO("yolov8n-cls.pt")

if __name__ == "__main__":
    modelo.train(
        data="dataset_cls",   # pasta com train/ e val/ (classificacao)
        epochs=60,            # classificacao converge mais rapido que deteccao
        imgsz=224,            # resolucao padrao de classificacao
        batch=16,             # reduza se faltar memoria
        patience=30,          # tolerancia maior p/ nao parar cedo (evita run ruim)
        seed=0,               # reprodutivel
        plots=True,           # gera graficos/matriz de confusao (uteis na demo)
    )

    print("\n[ok] Treino concluido!")
    print("   Modelo: runs/classify/train/weights/best.pt")
    print("   Aponte esse best.pt no main.py para servir as classificacoes.")
