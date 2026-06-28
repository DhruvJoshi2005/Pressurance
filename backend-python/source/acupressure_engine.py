from pathlib import Path
from typing import List, Dict, Any, Optional
import json

_DATA_DIR = Path(__file__).parent.parent / "data"

def _load_points() -> Dict[str, Any]:
    with open(_DATA_DIR / "acupressure_points_head.json") as f:
        return {p["_id"]: p for p in json.load(f)}

def _load_mapping() -> Dict[str, Any]:
    with open(_DATA_DIR / "zone_point_mapping_head.json") as f:
        return json.load(f)

_RED_FLAG_PAIN_TYPES = {"Sharp/Stabbing", "Acute (sudden)"}

# Predicted migraine subtypes that are medically serious — do not apply
# positive point boosts; route to cautionary message instead.
CAUTIONARY_MIGRAINE_TYPES = {
    "Familial hemiplegic migraine",
    "Sporadic hemiplegic migraine",
    "Basilar-type aura",
}


def check_red_flag(
    severity: int,
    pain_types: List[str],
    aura_fields: Optional[dict] = None,
) -> bool:
    has_danger_type = bool(set(pain_types) & _RED_FLAG_PAIN_TYPES)
    # Severity-based triggers
    if severity >= 9 or (severity >= 7 and has_danger_type):
        return True
    # Neurological combo trigger (visual + diplopia + speech + weakness)
    if aura_fields:
        combo = (
            aura_fields.get("visual_aura")
            and aura_fields.get("diplopia")
            and (aura_fields.get("dysphasia") or aura_fields.get("dysarthria"))
            and aura_fields.get("defect")
        )
        if combo:
            return True
    return False


def score_points(
    zone: str,
    pain_types: List[str],
    severity: int,
    history_conditions: List[str],
    helpful_point_ids: Optional[List[str]] = None,
    migraine_type: Optional[str] = None,
    migraine_confidence: Optional[float] = None,
) -> List[Dict[str, Any]]:
    points_db  = _load_points()
    mapping_db = _load_mapping()
    scores: Dict[str, Dict] = {}

    def add(point_id: str, amount: float, reason: str):
        if point_id not in points_db:
            return
        entry = scores.setdefault(point_id, {"score": 0.0, "reasons": []})
        entry["score"] += amount
        entry["reasons"].append(reason)

    # Zone primary/secondary
    zone_data = mapping_db.get(zone, {})
    if zone_data.get("primary"):
        add(zone_data["primary"], 5.0, f"Primary point for {zone.replace('_', ' ')}")
    if zone_data.get("secondary"):
        add(zone_data["secondary"], 3.0, f"Secondary point for {zone.replace('_', ' ')}")

    # Pain-type match
    pain_type_set = set(pain_types)
    for point_id, point in points_db.items():
        matched_types = pain_type_set & set(point.get("boost_pain_types", []))
        if matched_types:
            add(point_id, 2.0, f"Matches {', '.join(matched_types)} pain quality")

    # Medical history match
    history_set = set(history_conditions)
    for point_id, point in points_db.items():
        matched_conds = history_set & set(point.get("boost_conditions", []))
        if matched_conds:
            add(point_id, 2.0, f"Relevant to your history: {', '.join(matched_conds)}")

    # High severity analgesic
    if severity >= 7:
        add("LI4", 4.0, "Added for high reported severity — general analgesic point")

    # Feedback personalisation
    if helpful_point_ids:
        for pid in helpful_point_ids:
            add(pid, 1.5, "Previously reported as helpful for you")

    # Migraine-type classifier boost (skip for cautionary subtypes, require confidence ≥ 0.5)
    if (
        migraine_type
        and migraine_type not in CAUTIONARY_MIGRAINE_TYPES
        and (migraine_confidence or 0) >= 0.5
    ):
        for point_id, point in points_db.items():
            if migraine_type in point.get("boost_migraine_types", []):
                add(point_id, 2.0, f"Pattern suggests {migraine_type} (classifier)")

    ranked = sorted(scores.items(), key=lambda kv: kv[1]["score"], reverse=True)

    def _build_entry(point_id: str, score_data: Dict) -> Dict[str, Any]:
        point = points_db[point_id]
        return {
            "point_id":         point_id,
            "score":            score_data["score"],
            "reasons":          score_data["reasons"],
            "name_en":          point["name_en"],
            "description":      point["description"],
            "technique":        point["technique"],
            "contraindications": point.get("contraindications", []),
            "region":           point["region"],
            "coordinates":      point.get("coordinates"),
        }

    result = [_build_entry(pid, sd) for pid, sd in ranked[:3]]

    # Guarantee LI4 in result at high severity
    if severity >= 7 and "LI4" in points_db:
        if not any(r["point_id"] == "LI4" for r in result):
            li4_score_data = scores.get("LI4", {
                "score": 4.0,
                "reasons": ["Added for high reported severity — general analgesic point"],
            })
            result[-1] = _build_entry("LI4", li4_score_data)

    return result
