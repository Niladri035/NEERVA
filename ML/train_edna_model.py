import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

def get_kmers(sequence, size=3):
    return [sequence[x:x+size].lower() for x in range(len(sequence) - size + 1)]

def train_model():
    print("Loading dataset...")
    df = pd.read_csv('data/edna_dataset.csv')
    
    # Feature extraction (K-mers)
    print("Extracting features (K-mers)...")
    df['words'] = df.apply(lambda x: " ".join(get_kmers(x['sequence'])), axis=1)
    
    X = df['words']
    y = df['species']
    
    # Vectorization
    cv = CountVectorizer(ngram_range=(1,1))
    X_vec = cv.fit_transform(X)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)
    
    # Train
    print("Training Random Forest Classifier...")
    classifier = RandomForestClassifier(n_estimators=100)
    classifier.fit(X_train, y_train)
    
    # Evaluate
    y_pred = classifier.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    
    # Save model and vectorizer
    os.makedirs('models', exist_ok=True)
    joblib.dump(classifier, 'models/edna_classifier.pkl')
    joblib.dump(cv, 'models/edna_vectorizer.pkl')
    print("Model and Vectorizer saved to models/")

if __name__ == "__main__":
    train_model()
