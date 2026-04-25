from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import os
import numpy as np

router = APIRouter()

MODEL_PATH = "models/edna_classifier.pkl"
VEC_PATH = "models/edna_vectorizer.pkl"

class EdnaRequest(BaseModel):
    sequence: str

def get_kmers(sequence, size=3):
    return [sequence[x:x+size].lower() for x in range(len(sequence) - size + 1)]

@router.post("/predict-edna")
async def predict_edna(request: EdnaRequest):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VEC_PATH):
        raise HTTPException(status_code=503, detail="eDNA Model not trained or missing")
    
    try:
        # Load model and vectorizer
        clf = joblib.load(MODEL_PATH)
        cv = joblib.load(VEC_PATH)
        
        # Preprocess
        words = " ".join(get_kmers(request.sequence))
        X_vec = cv.transform([words])
        
        # Predict
        species = clf.predict(X_vec)[0]
        probs = clf.predict_proba(X_vec)[0]
        confidence = float(np.max(probs))
        
        return {
            "species": species,
            "confidence": confidence,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
