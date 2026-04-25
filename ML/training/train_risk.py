"""
Train Decision Tree + Logistic Regression for marine risk classification.
Features: temperature, wind_speed, pressure, movement
Labels:   SAFE (0), WARNING (1), DANGER (2)

Run: python training/train_risk.py
"""
import os
import sys
import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.pipeline import Pipeline
import joblib

DATASET_PATH = os.getenv("DATASET_PATH", "./data/risk_dataset.csv")
MODEL_DIR    = os.getenv("MODEL_DIR", "./models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = ["temperature", "wind_speed", "pressure", "movement"]
TARGET   = "risk"


def load_data():
    df = pd.read_csv(DATASET_PATH)
    print(f"📊 Risk dataset: {len(df)} samples")
    print(f"   Class distribution:\n{df[TARGET].value_counts().to_string()}\n")
    return df


def feature_engineer(df):
    """Add interaction features for better separation."""
    df = df.copy()
    df["heat_wind_index"]  = df["temperature"] * df["wind_speed"] / 100
    df["pressure_drop"]    = 1020 - df["pressure"]   # positive = below normal
    df["inactivity_score"] = 100 - df["movement"]    # higher = less active
    return df


def train_and_save():
    df = load_data()
    df = feature_engineer(df)

    feature_cols = FEATURES + ["heat_wind_index", "pressure_drop", "inactivity_score"]
    X = df[feature_cols]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Model 1: Decision Tree (lightweight, explainable) ──────────────────
    dt = DecisionTreeClassifier(
        max_depth=6,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
    )
    dt.fit(X_train, y_train)
    dt_pred  = dt.predict(X_test)
    dt_acc   = accuracy_score(y_test, dt_pred)
    dt_cv    = cross_val_score(dt, X, y, cv=5).mean()

    print(f"🌳 Decision Tree — Test Acc: {dt_acc:.3f} | CV Mean: {dt_cv:.3f}")
    print(classification_report(y_test, dt_pred))

    # ── Model 2: Logistic Regression (linear, fast inference) ──────────────
    lr_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("lr",     LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
        )),
    ])
    lr_pipeline.fit(X_train, y_train)
    lr_pred = lr_pipeline.predict(X_test)
    lr_acc  = accuracy_score(y_test, lr_pred)
    lr_cv   = cross_val_score(lr_pipeline, X, y, cv=5).mean()

    print(f"📈 Logistic Regression — Test Acc: {lr_acc:.3f} | CV Mean: {lr_cv:.3f}")
    print(classification_report(y_test, lr_pred))

    # ── Choose best model ──────────────────────────────────────────────────
    best_name   = "decision_tree" if dt_cv >= lr_cv else "logistic_regression"
    best_model  = dt if dt_cv >= lr_cv else lr_pipeline
    print(f"\n✅ Best model: {best_name} (CV={max(dt_cv, lr_cv):.3f})")

    # ── Save both models ───────────────────────────────────────────────────
    joblib.dump(dt,          os.path.join(MODEL_DIR, "risk_decision_tree.pkl"))
    joblib.dump(lr_pipeline, os.path.join(MODEL_DIR, "risk_logistic.pkl"))
    joblib.dump(best_model,  os.path.join(MODEL_DIR, "risk_model.pkl"))       # used by API
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "risk_feature_cols.pkl"))
    print(f"💾 Models saved to {MODEL_DIR}/")

    return {
        "decision_tree_acc": round(dt_acc, 3),
        "logistic_acc":      round(lr_acc, 3),
        "best_model":        best_name,
        "feature_cols":      feature_cols,
    }


if __name__ == "__main__":
    result = train_and_save()
    print(f"\n🎯 Risk model training complete:")
    print(f"   Decision Tree: {result['decision_tree_acc']}")
    print(f"   Logistic Reg:  {result['logistic_acc']}")
    print(f"   Active model:  {result['best_model']}")
