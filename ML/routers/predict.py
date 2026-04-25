import os
import sys
import numpy as np
import pandas as pd
import joblib

# Add root to path so training modules are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from training.train_fish import train_and_save, prepare_features

router = APIRouter(prefix="/predict", tags=["predictions"])

MODEL_DIR = os.getenv("MODEL_DIR", "./models")

# ── Loaded models (lazy-loaded, cached in module scope) ─────────────────────
_fish_model = None
_risk_model = None
_fish_encoder = None
_risk_encoder = None
_feature_cols = None


def load_models():
    global _fish_model, _risk_model, _fish_encoder, _risk_encoder, _feature_cols
    if _fish_model is None:
        fish_path = os.path.join(MODEL_DIR, "fish_density_model.pkl")
        if not os.path.exists(fish_path):
            print("🔧 Models not found — training now...")
            train_and_save()
        _fish_model = joblib.load(os.path.join(MODEL_DIR, "fish_density_model.pkl"))
        _risk_model = joblib.load(os.path.join(MODEL_DIR, "risk_level_model.pkl"))
        _fish_encoder = joblib.load(os.path.join(MODEL_DIR, "fish_density_encoder.pkl"))
        _risk_encoder = joblib.load(os.path.join(MODEL_DIR, "risk_level_encoder.pkl"))
        _feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_cols.pkl"))
        print("✅ Models loaded successfully.")


# ── Request / Response Schemas ───────────────────────────────────────────────

class ZonePredictRequest(BaseModel):
    temperature: float = Field(..., ge=10.0, le=45.0, description="Sea surface temperature in °C")
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    month: int = Field(..., ge=1, le=12, description="Month (1–12)")


class ZonePredictResponse(BaseModel):
    fish_density: str
    risk_level: str
    confidence_fish: float
    confidence_risk: float
    source: str = "random-forest"


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/zone", response_model=ZonePredictResponse)
def predict_zone(request: ZonePredictRequest):
    """
    Predict fish density and risk level for a single ocean zone.
    Uses trained Random Forest classifiers.
    """
    try:
        load_models()

        # Build feature vector
        feat_dict = prepare_features(
            temperature=request.temperature,
            lat=request.lat,
            lng=request.lng,
            month=request.month,
        )

        # Align to trained feature columns
        X = pd.DataFrame([feat_dict])
        for col in _feature_cols:
            if col not in X.columns:
                X[col] = 0
        X = X[_feature_cols]

        # Fish density prediction
        fish_pred = _fish_model.predict(X)[0]
        fish_proba = _fish_model.predict_proba(X)[0]
        fish_label = _fish_encoder.inverse_transform([fish_pred])[0]
        fish_confidence = float(np.max(fish_proba))

        # Risk level prediction
        risk_pred = _risk_model.predict(X)[0]
        risk_proba = _risk_model.predict_proba(X)[0]
        risk_label = _risk_encoder.inverse_transform([risk_pred])[0]
        risk_confidence = float(np.max(risk_proba))

        return ZonePredictResponse(
            fish_density=fish_label,
            risk_level=risk_label,
            confidence_fish=round(fish_confidence, 3),
            confidence_risk=round(risk_confidence, 3),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch")
def predict_batch(zones: list[ZonePredictRequest]):
    """
    Batch prediction for multiple zones at once.
    """
    if len(zones) > 20:
        raise HTTPException(status_code=400, detail="Max 20 zones per batch request")

    results = []
    for zone in zones:
        result = predict_zone(zone)
        results.append(result)
    return {"predictions": results, "count": len(results)}
