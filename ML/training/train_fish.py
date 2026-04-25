"""
Training script for fish density and risk level Random Forest classifiers.
Run standalone: python training/train_fish.py
Or called automatically from main.py on startup.
"""

import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib

DATASET_PATH = os.getenv("DATASET_PATH", "./data/sample_dataset.csv")
MODEL_DIR = os.getenv("MODEL_DIR", "./models")


def train_and_save():
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Load dataset
    df = pd.read_csv(DATASET_PATH)
    print(f"📊 Loaded {len(df)} training samples from {DATASET_PATH}")

    # Feature engineering
    df["temp_squared"] = df["temperature"] ** 2
    df["lat_lng_interaction"] = df["lat"] * df["lng"]
    df["season"] = df["month"].apply(get_season)

    # One-hot encode season
    df = pd.get_dummies(df, columns=["season"], prefix="season")

    feature_cols = ["temperature", "lat", "lng", "month", "temp_squared", "lat_lng_interaction"]
    for col in ["season_summer", "season_monsoon", "season_post_monsoon", "season_winter"]:
        if col in df.columns:
            feature_cols.append(col)

    X = df[feature_cols]

    # ── Fish Density Model ──────────────────────────────────────────────────
    le_fish = LabelEncoder()
    y_fish = le_fish.fit_transform(df["fish_density"])  # High=0, Low=1, Medium=2

    X_train, X_test, y_train, y_test = train_test_split(X, y_fish, test_size=0.2, random_state=42)

    fish_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        min_samples_split=3,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    fish_model.fit(X_train, y_train)

    y_pred_fish = fish_model.predict(X_test)
    fish_accuracy = accuracy_score(y_test, y_pred_fish)
    print(f"\n🐟 Fish Density Model Accuracy: {fish_accuracy:.3f}")
    print(classification_report(y_test, y_pred_fish, target_names=le_fish.classes_))

    # Save fish model + encoder
    joblib.dump(fish_model, os.path.join(MODEL_DIR, "fish_density_model.pkl"))
    joblib.dump(le_fish, os.path.join(MODEL_DIR, "fish_density_encoder.pkl"))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "feature_cols.pkl"))
    print(f"✅ Fish density model saved to {MODEL_DIR}/fish_density_model.pkl")

    # ── Risk Level Model ────────────────────────────────────────────────────
    le_risk = LabelEncoder()
    y_risk = le_risk.fit_transform(df["risk_level"])  # Danger=0, Safe=1, Warning=2

    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X, y_risk, test_size=0.2, random_state=42)

    risk_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        min_samples_split=3,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    risk_model.fit(X_train_r, y_train_r)

    y_pred_risk = risk_model.predict(X_test_r)
    risk_accuracy = accuracy_score(y_test_r, y_pred_risk)
    print(f"\n⚠️  Risk Level Model Accuracy: {risk_accuracy:.3f}")
    print(classification_report(y_test_r, y_pred_risk, target_names=le_risk.classes_))

    # Save risk model + encoder
    joblib.dump(risk_model, os.path.join(MODEL_DIR, "risk_level_model.pkl"))
    joblib.dump(le_risk, os.path.join(MODEL_DIR, "risk_level_encoder.pkl"))
    print(f"✅ Risk level model saved to {MODEL_DIR}/risk_level_model.pkl")

    return {
        "fish_accuracy": round(fish_accuracy, 3),
        "risk_accuracy": round(risk_accuracy, 3),
        "feature_cols": feature_cols,
        "fish_classes": list(le_fish.classes_),
        "risk_classes": list(le_risk.classes_),
    }


def get_season(month):
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "summer"
    elif month in [6, 7, 8, 9]:
        return "monsoon"
    else:
        return "post_monsoon"


def prepare_features(temperature: float, lat: float, lng: float, month: int) -> dict:
    """
    Build the feature vector for inference — must match training features.
    Returns a dict that can be fed to a DataFrame.
    """
    season = get_season(month)
    features = {
        "temperature": temperature,
        "lat": lat,
        "lng": lng,
        "month": month,
        "temp_squared": temperature ** 2,
        "lat_lng_interaction": lat * lng,
        "season_summer": 1 if season == "summer" else 0,
        "season_monsoon": 1 if season == "monsoon" else 0,
        "season_post_monsoon": 1 if season == "post_monsoon" else 0,
        "season_winter": 1 if season == "winter" else 0,
    }
    return features


if __name__ == "__main__":
    result = train_and_save()
    print(f"\n🎯 Training complete: fish={result['fish_accuracy']}, risk={result['risk_accuracy']}")
