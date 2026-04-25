import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List
from training.train_temp import predict_future_temps

router = APIRouter(prefix="/predict", tags=["trends"])


class TempPoint(BaseModel):
    date: str
    predicted_temp: float


class TrendResponse(BaseModel):
    zone_id: str
    lat: float
    lng: float
    days: int
    trend: List[TempPoint]
    source: str = "polynomial-regression"


# Zone coordinate lookup (same as Backend/config/zones.js)
ZONE_COORDS = {
    "zone1": (20.5, 69.2),
    "zone2": (18.0, 70.1),
    "zone3": (16.5, 82.3),
    "zone4": (8.2, 76.8),
    "zone5": (12.3, 71.7),
    "zone6": (9.1, 79.2),
    "zone7": (11.5, 92.8),
}


@router.get("/temperature-trend", response_model=TrendResponse)
def get_temperature_trend(
    zone_id: str = Query(..., description="Zone ID e.g. zone1"),
    days: int = Query(7, ge=1, le=30, description="Number of days to forecast"),
):
    """
    Predict sea surface temperature trend for a zone over the next N days.
    Uses polynomial regression trained on historical zone SST data.
    """
    coords = ZONE_COORDS.get(zone_id)
    if not coords:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Zone '{zone_id}' not found. Valid zones: {list(ZONE_COORDS.keys())}"
        )

    lat, lng = coords
    predictions = predict_future_temps(lat=lat, lng=lng, days=days)

    return TrendResponse(
        zone_id=zone_id,
        lat=lat,
        lng=lng,
        days=days,
        trend=[TempPoint(**p) for p in predictions],
    )


@router.get("/temperature-trend/all")
def get_all_trends(days: int = Query(7, ge=1, le=14)):
    """
    Get temperature trends for all 7 zones at once.
    """
    results = []
    for zone_id, (lat, lng) in ZONE_COORDS.items():
        predictions = predict_future_temps(lat=lat, lng=lng, days=days)
        results.append({
            "zone_id": zone_id,
            "lat": lat,
            "lng": lng,
            "days": days,
            "trend": predictions,
            "source": "polynomial-regression",
        })
    return {"zones": results, "count": len(results)}
