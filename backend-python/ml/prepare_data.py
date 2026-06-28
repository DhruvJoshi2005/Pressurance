"""
Inspect the migraine dataset and confirm column names + class distribution.
Run this first to verify the data before training.
"""
import pandas as pd
from pathlib import Path

DATA = Path(__file__).parent / "data" / "migraine_symptom_classification.csv"

df = pd.read_csv(DATA)
print("Shape:", df.shape)
print("\nColumns:", list(df.columns))
print("\nClass distribution:")
print(df["Type"].value_counts())
print("\nMissing values:")
print(df.isnull().sum().sum(), "total NaN cells")
print("\nSample row:")
print(df.iloc[0].to_dict())
