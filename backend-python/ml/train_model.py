"""
Train a Random Forest migraine-type classifier on the ICHD-3 migraine dataset.
Saves model.joblib to backend-python/ml/ alongside this script.

Usage:  python3 -m backend-python.ml.train_model
    or: cd backend-python/ml && python3 train_model.py
"""
import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

HERE = Path(__file__).parent
DATA = HERE / "data" / "migraine_symptom_classification.csv"
OUT  = HERE / "model.joblib"

df = pd.read_csv(DATA)

# Encode any categorical columns (Location, Character are numeric in this dataset)
X = df.drop(columns=["Type"])
y = df["Type"]

label_encoders = {}
for col in X.select_dtypes(include="object").columns:
    le = LabelEncoder()
    X = X.copy()
    X[col] = le.fit_transform(X[col].astype(str))
    label_encoders[col] = le

feature_columns = list(X.columns)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

model = RandomForestClassifier(
    n_estimators=200,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

print("=== Hold-out test set ===")
print(classification_report(y_test, model.predict(X_test)))

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(model, X, y, cv=cv, scoring="f1_macro")
print(f"5-fold CV macro-F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

joblib.dump(
    {
        "model": model,
        "label_encoders": label_encoders,
        "columns": feature_columns,
    },
    OUT,
)
print(f"\nSaved → {OUT}")
