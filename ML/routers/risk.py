import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/predict-risk", tags=["risk"])

MODEL_DIR   = os.getenv("MODEL_DIR", "./models")
_risk_model = None
_risk_cols  = None


def load_risk_model():
    global _risk_model, _risk_cols
    if _risk_model is None:
        model_path = os.path.join(MODEL_DIR, "risk_model.pkl")
        cols_path  = os.path.join(MODEL_DIR, "risk_feature_cols.pkl")

        if not os.path.exists(model_path):
            print("🔧 Risk model not found — training now...")
            from training.train_risk import train_and_save
            train_and_save()

        _risk_model = joblib.load(model_path)
        _risk_cols  = joblib.load(cols_path)
        print("✅ Risk model loaded.")


# ── Schemas ───────────────────────────────────────────────────────────────────

class RiskRequest(BaseModel):
    temperature: float = Field(..., ge=10, le=50, description="Sea surface temp °C")
    wind_speed:  float = Field(..., ge=0, le=200, description="Wind speed km/h")
    pressure:    float = Field(..., ge=900, le=1050, description="Atmospheric pressure hPa")
    movement:    float = Field(50.0, ge=0, le=100, description="Boat activity score 0-100")

class RiskResponse(BaseModel):
    risk:           str
    confidence:     float
    label:          int
    recommendation: str
    inputs:         dict
    features_used:  list
    model:          str = "decision-tree"


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("", response_model=RiskResponse)
@router.post("/", response_model=RiskResponse)
def predict_risk(request: RiskRequest):
    """
    Predict marine risk level (SAFE / WARNING / DANGER) from environmental data.
    Uses Decision Tree or Logistic Regression — lightweight, works offline.
    """
    try:
        load_risk_model()

        # Feature engineering — must match training
        heat_wind  = (request.temperature * request.wind_speed) / 100
        pres_drop  = 1020 - request.pressure
        inactivity = 100 - request.movement

        feat_dict = {
            "temperature":    request.temperature,
            "wind_speed":     request.wind_speed,
            "pressure":       request.pressure,
            "movement":       request.movement,
            "heat_wind_index":  heat_wind,
            "pressure_drop":    pres_drop,
            "inactivity_score": inactivity,
        }

        X = pd.DataFrame([feat_dict])[_risk_cols]

        pred_label = _risk_model.predict(X)[0]   # 'SAFE' | 'WARNING' | 'DANGER'
        proba      = _risk_model.predict_proba(X)[0] if hasattr(_risk_model, "predict_proba") else None

        label_map  = {"SAFE": 0, "WARNING": 1, "DANGER": 2}
        confidence = float(np.max(proba)) if proba is not None else 0.85

        recs = {
            "SAFE":    "Conditions are safe. Continue fishing operations normally.",
            "WARNING": "Conditions deteriorating. Stay alert, prepare to return to shore.",
            "DANGER":  "DANGER! Return to shore immediately. Activate SOS if vessel at risk.",
        }

        return RiskResponse(
            risk=pred_label,
            confidence=round(confidence, 3),
            label=label_map.get(pred_label, 0),
            recommendation=recs.get(pred_label, "Monitor conditions."),
            inputs=request.dict(),
            features_used=_risk_cols,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction failed: {str(e)}")


@router.post("/batch")
def predict_risk_batch(requests: list[RiskRequest]):
    """Batch predict for multiple readings (e.g. fleet monitoring)."""
    if len(requests) > 50:
        raise HTTPException(status_code=400, detail="Max 50 items per batch")
    return {"predictions": [predict_risk(r) for r in requests], "count": len(requests)}
