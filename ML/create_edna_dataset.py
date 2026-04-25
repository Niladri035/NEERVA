import pandas as pd
import numpy as np
import os
import random

# Base sequences for various species (simplified for demo)
SPECIES_BASE = {
    'Yellowfin Tuna': 'GTTTGGTAACTGACTTGTCCCACTAATGATCGGAGCCCCAGACATAGCATTTCCTCGAATAAATAACATGAGCTTCTGACTTCTCCCCCCTTCC',
    'Indian Mackerel': 'CCTCTATCTAGTATTTGGTGCTTGAGCCGGAATAGTAGGCACTGCTCTAAGCCTCCTTATTCGAGCAGAACTAGGTCAACCAGGCACCCTACTA',
    'Whale Shark': 'ATCGGACATGAAATTCCTAGTTTAAATCCGCTCATCATCGGGGCTCCAGACATAGCCTTTCCCCGAATGAATAACATGAGCTTTTGACTCCTCC',
    'Sailfish': 'GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC',
    'Tiger Shark': 'TGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTGTG',
    'Blue Marlin': 'AACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAACCAA'
}

def mutate(sequence, rate=0.05):
    seq_list = list(sequence)
    for i in range(len(seq_list)):
        if random.random() < rate:
            seq_list[i] = random.choice(['A', 'T', 'C', 'G'])
    return "".join(seq_list)

def generate_edna_dataset(num_samples=3000):
    print(f"Generating eDNA dataset with {num_samples} samples...")
    data = []
    species_list = list(SPECIES_BASE.keys())
    
    for _ in range(num_samples):
        species = random.choice(species_list)
        base = SPECIES_BASE[species]
        # Pad or truncate to fixed length (e.g., 90)
        base = base[:90].ljust(90, 'A')
        sequence = mutate(base)
        data.append({'sequence': sequence, 'species': species})
    
    df = pd.DataFrame(data)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/edna_dataset.csv', index=False)
    print("Dataset saved to data/edna_dataset.csv")

if __name__ == "__main__":
    generate_edna_dataset()
