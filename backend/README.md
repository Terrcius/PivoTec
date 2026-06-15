# Backend — Classificador de Pragas/Doenças (YOLOv8-cls)

Servidor Python que classifica uma foto de praga/doença da soja. O app
Expo envia a imagem e recebe a classe mais provável + confiança.
100% local e gratuito.

> **Abordagem: classificação por pasta** (não detecção com caixas).
> A classe é o **nome da pasta** — não precisa anotar nada no LabelImg.

## Classes detectadas no momento

O modelo atual reconhece **12 classes** (acurácia ~91%):

### 🐛 Insetos-praga (7)

| Classe | Praga | Nome científico |
|---|---|---|
| `lagarta_soja` | Lagarta-da-soja | _Anticarsia gemmatalis_ |
| `falsa_medideira` | Falsa-medideira | _Chrysodeixis includens_ |
| `percevejo_verde` | Percevejo-verde | _Nezara viridula_ |
| `percevejo_pequeno` | Percevejo-pequeno | _Piezodorus guildinii_ |
| `percevejo_marrom` | Percevejo-marrom | _Euschistus heros_ |
| `diabrotica` | Vaquinha | _Diabrotica speciosa_ |
| `sternechus` | Tamanduá-da-soja | _Sternechus subsignatus_ |

### 🍂 Doenças/fungos (4)

| Classe | Doença | Patógeno |
|---|---|---|
| `ferrugem_asiatica` | Ferrugem asiática | _Phakopsora pachyrhizi_ |
| `mancha_alvo` | Mancha-alvo | _Corynespora cassiicola_ |
| `olho_de_ra` | Mancha olho-de-rã | _Cercospora sojina_ |
| `oidio` | Oídio | _Erysiphe diffusa_ |

> **Atenção ao volume de imagens por classe de doença.** Essas manchas
> foliares são visualmente parecidas; a separação só funciona bem se cada
> uma tiver imagens de treino suficientes. A `ferrugem_asiatica` precisa de
> ~100+ imagens (use `python download_gbif.py`) — com poucas (ex.: 8) ela
> se confunde com `olho_de_ra`/`mancha_alvo`. A `olho_de_ra` foi curada
> manualmente; mantenha-a com fotos nítidas de frogeye.

### 🌱 Referência (1)

| Classe | Descrição |
|---|---|
| `folha_saudavel` | Soja sadia (baseline para diferenciar do que tem praga/doença) |

> Para **adicionar uma classe nova**: crie a pasta `dataset_cls/train/<classe>/`,
> coloque as imagens, rode `python split_cls.py` e retreine (`python train.py`).

## Estrutura

```
backend/
├── main.py                # servidor FastAPI (rota /detectar)
├── train.py               # treino do classificador (yolov8n-cls)
├── split_cls.py           # separa train/val (seguro p/ rodar de novo)
├── download_pragas.py     # baixa INSETOS do iNaturalist
├── download_doencas.py    # baixa DOENÇAS do iNaturalist
├── download_gbif.py       # baixa doenças raras do GBIF (mais fotos)
├── requirements.txt
└── dataset_cls/
    ├── train/<classe>/*.jpg
    └── val/<classe>/*.jpg
```

## Sequência completa

### 1. Instalar dependências (uma vez)

```powershell
cd backend
pip install -r requirements.txt
```

### 2. Baixar as imagens (uma pasta por classe)

```powershell
python download_pragas.py     # insetos (iNaturalist)
python download_doencas.py    # doenças (iNaturalist)
python download_gbif.py        # doenças com poucas fotos (GBIF)
```

Cada script joga as imagens em `dataset_cls/train/<classe>/`. Para
adicionar uma classe nova, crie a pasta e coloque as fotos lá.

### 3. Separar treino/validação

```powershell
python split_cls.py
```

Move ~20% de cada classe para `val/`. Pode rodar de novo após adicionar
classes novas: ele **pula** as que já têm validação.

### 4. Treinar

```powershell
python train.py
```

Saída: `runs/classify/train/weights/best.pt`

> Sem GPU treina na CPU (rápido para esse tamanho: ~7s/época).
> Para GPU grátis, suba o `dataset_cls/` + `train.py` no Google Colab.

### 5. Ativar o modelo no servidor

Em `main.py`, confirme que `MODELO_PATH` aponta para o `best.pt`:

```python
MODELO_PATH = "runs/classify/train/weights/best.pt"
```

### 6. Subir o servidor

```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> Use **`python -m uvicorn`** (o comando `uvicorn` sozinho pode não estar
> no PATH no Windows). `--host 0.0.0.0` deixa o celular acessar pelo IP do PC.

Testes:
- PC: http://localhost:8000/health e http://localhost:8000/docs
- Celular (mesmo Wi-Fi): http://SEU_IP:8000/health

### 7. Conectar o app

1. Descubra o IP do PC: `ipconfig` (campo **Endereço IPv4**).
2. Em `components/PestDetector.js`, ajuste `API_URL` com esse IP.
3. PC e celular no **mesmo Wi-Fi**. Se o celular não alcançar, libere a
   porta 8000 no firewall (Redes privadas).

## Curar ou atualizar imagens de uma classe

Quando você remover imagens ruins ou adicionar novas a uma classe que **já
foi treinada** (ex.: limpar o `olho_de_ra`), siga este fluxo para que o
modelo reflita a mudança:

1. **Edite só a pasta de treino** da classe: adicione/remova arquivos em
   `dataset_cls/train/<classe>/`. Pode misturar `.jpg`, `.jpeg`, `.png`.
2. **Junte o val de volta no train** e **apague** a pasta de validação
   antiga, para que o split refaça a divisão com as imagens novas:
   ```powershell
   # exemplo para a classe olho_de_ra (PowerShell)
   Move-Item dataset_cls/val/olho_de_ra/* dataset_cls/train/olho_de_ra/
   Remove-Item dataset_cls/val/olho_de_ra
   ```
3. **Re-divida** (só essa classe; as outras com `val/` são puladas):
   ```powershell
   python split_cls.py
   ```
4. **Retreine** e **aponte o `main.py`** para o novo `best.pt`:
   ```powershell
   python train.py
   ```
   > O Ultralytics não sobrescreve treinos: cada execução cria uma pasta
   > nova (`runs/classify/train`, depois `train-2`, `train-3`...). Atualize
   > `MODELO_PATH` no `main.py` para a pasta do treino mais recente.
5. **Reinicie o servidor** para carregar o modelo novo.

> Dica: imagem corrompida quebra o treino. Vale validar antes com
> `Image.open(caminho).verify()` (Pillow) e remover as que falharem.

## Testar antes de treinar (opcional)

Para validar o fluxo app↔servidor sem ter o `best.pt`, descomente em
`main.py`:

```python
MODELO_PATH = "yolov8n-cls.pt"
```

Ele classifica nas 1000 classes do ImageNet (não nas pragas), só para
confirmar que a foto chega e a resposta volta.

## Fontes de imagem e licença

- **iNaturalist**: ótimo para insetos. Filtramos por licenças livres.
- **GBIF**: melhor para doenças de lavoura (mais fotos de patógenos).

Para projeto acadêmico está tranquilo. Para uso comercial, revise as
licenças individuais das imagens.
