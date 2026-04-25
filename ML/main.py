"""
NEERVA ML Microservice — FastAPI Entry Point

Auto-trains models if .pkl files are missing on startup.
Runs on port 8000 by default.
"""

import os
import sys

from dotenv import load_dotenv
load_dotenv(".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from routers.predict import router as predict_router
from routers.trends import router as trends_router
from routers.risk import router as risk_router
from routers.edna import router as edna_router

MODEL_DIR = os.getenv("MODEL_DIR", "./models")
DATASET_PATH = os.getenv("DATASET_PATH", "./data/sample_dataset.csv")

app = FastAPI(
    title="NEERVA ML Microservice",
    description="Fish density & risk prediction + temperature trend forecasting for Indian Ocean zones.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow Node.js backend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ─────────────────────────────────────────────────────────
app.include_router(predict_router)
app.include_router(trends_router)
app.include_router(risk_router)
app.include_router(edna_router)


@app.get("/health")
def health():
    fish_ready = os.path.exists(os.path.join(MODEL_DIR, "fish_density_model.pkl"))
    risk_ready = os.path.exists(os.path.join(MODEL_DIR, "risk_level_model.pkl"))
    temp_ready = os.path.exists(os.path.join(MODEL_DIR, "temperature_model.pkl"))
    return {
        "status": "ok",
        "models": {
            "fish_density": "ready" if fish_ready else "not trained",
            "risk_level": "ready" if risk_ready else "not trained",
            "temperature": "ready" if temp_ready else "not trained",
            "edna_identification": "ready" if os.path.exists(os.path.join(MODEL_DIR, "edna_classifier.pkl")) else "not trained",
        },
    }


@app.get("/")
def root():
    return {
        "service": "NEERVA ML Microservice",
        "version": "1.0.0",
        "endpoints": {
            "predict_zone": "POST /predict/zone",
            "predict_batch": "POST /predict/batch",
            "predict_risk": "POST /predict-risk",
            "predict_edna": "POST /predict-edna",
            "temperature_trend": "GET /predict/temperature-trend?zone_id=zone1&days=7",
            "all_trends": "GET /predict/temperature-trend/all",
            "health": "GET /health",
            "docs": "GET /docs",
        },
    }


# ── Auto-train on startup ────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    os.makedirs(MODEL_DIR, exist_ok=True)
    fish_model_path = os.path.join(MODEL_DIR, "fish_density_model.pkl")
    temp_model_path = os.path.join(MODEL_DIR, "temperature_model.pkl")

    if not os.path.exists(fish_model_path):
        print("🔧 Fish/Risk models not found — training now (this takes ~10 seconds)...")
        try:
            from training.train_fish import train_and_save as train_fish
            result = train_fish()
            print(f"✅ Fish model trained: accuracy={result['fish_accuracy']}, risk={result['risk_accuracy']}")
        except Exception as e:
            print(f"⚠️  Fish model training failed: {e}")

    if not os.path.exists(temp_model_path):
        print("🔧 Temperature model not found — training now...")
        try:
            from training.train_temp import train_and_save as train_temp
            result = train_temp()
            print(f"✅ Temperature model trained: MAE={result['mae']}°C")
        except Exception as e:
            print(f"⚠️  Temperature model training failed: {e}")

    risk_model_path = os.path.join(MODEL_DIR, "risk_model.pkl")
    if not os.path.exists(risk_model_path):
        print("🔧 Risk model not found — training now...")
        try:
            from training.train_risk import train_and_save as train_risk
            result = train_risk()
            print(f"✅ Risk model trained: best={result['best_model']}")
        except Exception as e:
            print(f"⚠️  Risk model training failed: {e}")

    edna_model_path = os.path.join(MODEL_DIR, "edna_classifier.pkl")
    if not os.path.exists(edna_model_path):
        print("🔧 eDNA model not found — training now...")
        try:
            from train_edna_model import train_model as train_edna
            train_edna()
            print("✅ eDNA model trained successfully")
        except Exception as e:
            print(f"⚠️  eDNA model training failed: {e}")

    print("\n🌊 NEERVA ML Service ready!")
    print(f"   Docs: http://localhost:{os.getenv('PORT', 8000)}/docs\n")


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
