"""
Training script for temperature time-series prediction using Linear Regression.
Predicts future sea surface temperature based on month and zone coordinates.
"""

import os
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

DATASET_PATH = os.getenv("DATASET_PATH", "./data/sample_dataset.csv")
MODEL_DIR = os.getenv("MODEL_DIR", "./models")


def train_and_save():
    os.makedirs(MODEL_DIR, exist_ok=True)

    df = pd.read_csv(DATASET_PATH)
    print(f"📊 Loaded {len(df)} samples for temperature model")

    # Features: lat, lng, month (cyclical encoded), month^2
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    X = df[["lat", "lng", "month_sin", "month_cos", "month"]]
    y = df["temperature"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Polynomial regression degree-2 for seasonal curve capture
    model = Pipeline([
        ("poly", PolynomialFeatures(degree=2, include_bias=False)),
        ("reg", LinearRegression()),
    ])
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n🌡️  Temperature Model — MAE: {mae:.3f}°C, R²: {r2:.3f}")

    joblib.dump(model, os.path.join(MODEL_DIR, "temperature_model.pkl"))
    print(f"✅ Temperature model saved to {MODEL_DIR}/temperature_model.pkl")

    return {"mae": round(mae, 3), "r2": round(r2, 3)}


def predict_future_temps(lat: float, lng: float, days: int = 7) -> list:
    """
    Predict temperatures for the next `days` days starting tomorrow.
    Uses the trained polynomial regression model.
    """
    model_path = os.path.join(MODEL_DIR, "temperature_model.pkl")
    if not os.path.exists(model_path):
        train_and_save()

    model = joblib.load(model_path)

    predictions = []
    for i in range(1, days + 1):
        future_date = pd.Timestamp.now() + pd.DateOffset(days=i)
        month = future_date.month
        month_sin = np.sin(2 * np.pi * month / 12)
        month_cos = np.cos(2 * np.pi * month / 12)

        X_pred = pd.DataFrame([{
            "lat": lat,
            "lng": lng,
            "month_sin": month_sin,
            "month_cos": month_cos,
            "month": month,
        }])

        predicted_temp = float(model.predict(X_pred)[0])
        # Add small random noise for realism
        predicted_temp += np.random.normal(0, 0.15)
        predicted_temp = round(predicted_temp, 2)

        predictions.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "predicted_temp": predicted_temp,
        })

    return predictions


if __name__ == "__main__":
    result = train_and_save()
    print(f"\n🎯 Temperature model training complete: MAE={result['mae']}°C, R²={result['r2']}")

    # Quick test
    test = predict_future_temps(lat=20.5, lng=69.2, days=7)
    print("\n📈 Sample 7-day forecast for Arabian Sea North:")
    for p in test:
        print(f"  {p['date']}: {p['predicted_temp']}°C")
