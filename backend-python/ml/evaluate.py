"""
Generate evaluation artefacts for the report:
  - confusion matrix (printed as text)
  - feature importances (top 10)

Run after train_model.py has produced model.joblib.
"""
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report

HERE = Path(__file__).parent
DATA = HERE / "data" / "migraine_symptom_classification.csv"
MODEL_PATH = HERE / "model.joblib"

artifact = joblib.load(MODEL_PATH)
model      = artifact["model"]
feature_columns = artifact["columns"]

df = pd.read_csv(DATA)
X  = df[feature_columns]
y  = df["Type"]

_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

y_pred = model.predict(X_test)

print("=== Classification Report ===")
print(classification_report(y_test, y_pred))

print("\n=== Confusion Matrix ===")
labels = sorted(y.unique())
cm = confusion_matrix(y_test, y_pred, labels=labels)
header = f"{'':40s}" + "".join(f"{l[:10]:>12s}" for l in labels)
print(header)
for i, row in enumerate(cm):
    print(f"{labels[i]:40s}" + "".join(f"{v:>12d}" for v in row))

print("\n=== Top 10 Feature Importances ===")
importances = sorted(
    zip(feature_columns, model.feature_importances_),
    key=lambda x: x[1], reverse=True,
)
for feat, imp in importances[:10]:
    bar = "█" * int(imp * 80)
    print(f"  {feat:20s}  {imp:.4f}  {bar}")
