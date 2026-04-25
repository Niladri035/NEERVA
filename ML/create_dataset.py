import pandas as pd
import numpy as np

def create_sample_dataset():
    # Create 500 rows of mock ocean data
    np.random.seed(42)
    data = {
        'zone_id': np.random.choice(['zone1', 'zone2', 'zone3', 'zone4', 'zone5'], 500),
        'temperature': np.random.normal(28, 2, 500),
        'wind_speed': np.random.normal(20, 10, 500),
        'pressure': np.random.normal(1010, 5, 500),
        'fish_density': np.random.choice(['High', 'Medium', 'Low'], 500),
        'risk_level': np.random.choice(['SAFE', 'WARNING', 'DANGER'], 500)
    }
    
    # Introduce some correlations
    # High temp + high wind -> DANGER
    # Low wind -> SAFE
    
    df = pd.DataFrame(data)
    
    for i, row in df.iterrows():
        if row['wind_speed'] > 35 or row['pressure'] < 995:
            df.at[i, 'risk_level'] = 'DANGER'
        elif row['wind_speed'] < 15:
            df.at[i, 'risk_level'] = 'SAFE'
            df.at[i, 'fish_density'] = 'High'
    
    # Ensure data directory exists
    import os
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/sample_dataset.csv', index=False)
    print("Dataset generated at data/sample_dataset.csv")

if __name__ == "__main__":
    create_sample_dataset()
