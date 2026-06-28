"""
Migraine-type classifier — loaded once at import time, not per-request.

predict_migraine_type(features) accepts a dict of aura + symptom fields
collected by MigraineAuraCheck.jsx and returns:
  {"type": str, "confidence": float}

If features are missing or the model file is absent, returns None so callers
can gracefully skip the boost rather than 500-ing.
"""
from pathlib import Path
from typing import Optional
import joblib
import pandas as pd

_MODEL_PATH = Path(__file__).parent.parent / "ml" / "model.joblib"

_artifact = None

def _load():
    global _artifact
    if _artifact is None and _MODEL_PATH.exists():
        _artifact = joblib.load(_MODEL_PATH)

_load()

# Fields the aura screen collects → dataset column names
_FIELD_MAP = {
    "visual_aura":   "Visual",
    "sensory":       "Sensory",
    "diplopia":      "Diplopia",
    "dysphasia":     "Dysphasia",
    "dysarthria":    "Dysarthria",
    "vertigo":       "Vertigo",
    "tinnitus":      "Tinnitus",
    "hypoacusis":    "Hypoacusis",
    "defect":        "Defect",
    "ataxia":        "Ataxia",
    "duration":      "Duration",
    "frequency":     "Frequency",
}

# Defaults based on dataset medians/modes for columns not in the aura screen
_DEFAULTS = {
    "Age":          35,
    "Location":     1,
    "Character":    1,
    "Intensity":    2,
    "Nausea":       1,
    "Vomit":        0,
    "Phonophobia":  1,
    "Photophobia":  1,
    "Conscience":   0,
    "Paresthesia":  0,
    "DPF":          0,
}


def predict_migraine_type(
    aura_fields: dict,
    severity: Optional[int] = None,
) -> Optional[dict]:
    """
    Returns {"type": str, "confidence": float} or None if prediction
    cannot be made (missing model, empty features).
    """
    if _artifact is None or not aura_fields:
        return None

    model   = _artifact["model"]
    columns = _artifact["columns"]

    row = dict(_DEFAULTS)

    for frontend_key, col_name in _FIELD_MAP.items():
        val = aura_fields.get(frontend_key)
        if val is not None:
            # booleans → 0/1; duration/frequency stay as numbers
            row[col_name] = int(val) if isinstance(val, bool) else val

    if severity is not None:
        row["Intensity"] = severity

    # Build DataFrame in the exact column order the model was trained on
    try:
        X = pd.DataFrame([{col: row.get(col, 0) for col in columns}])
    except Exception:
        return None

    proba  = model.predict_proba(X)[0]
    top_idx = int(proba.argmax())
    confidence = float(proba[top_idx])
    predicted  = model.classes_[top_idx]

    return {"type": predicted, "confidence": round(confidence, 3)}
