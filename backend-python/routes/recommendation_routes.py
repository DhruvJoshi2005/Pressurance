from fastapi import APIRouter, Depends, HTTPException
from source.database import db
from source.utils import get_current_user
from source.models import RecommendationRequest, FeedbackRequest
from source.acupressure_engine import check_red_flag, score_points, CAUTIONARY_MIGRAINE_TYPES
from source.migraine_classifier import predict_migraine_type
from datetime import datetime, timezone

router = APIRouter()

# Zones where migraine subtype classification is clinically meaningful
_MIGRAINE_ZONES = {
    "Temple_Left", "Temple_Right",
    "Mid_Forehead_Pain",
    "Forehead_Left", "Forehead_Right",
    "Skull_Pain",
}

_RED_FLAG_MESSAGE = (
    "Your reported pain level and pain type suggest you should seek medical evaluation "
    "before trying self-care. Sudden, severe, or stabbing head pain can have serious causes — "
    "please contact a healthcare professional or emergency services if needed."
)

_AURA_RED_FLAG_MESSAGE = (
    "You've reported a combination of symptoms — visual disturbance, double vision, "
    "speech difficulty, and sudden one-sided weakness — that may require urgent medical "
    "attention. This pattern can sometimes indicate a neurological event. Please seek "
    "medical evaluation before proceeding with self-care."
)

_CAUTIONARY_MESSAGE = (
    "Based on your symptom pattern, our classifier detected features associated with a "
    "rare migraine subtype ({type}). These subtypes can sometimes resemble more serious "
    "neurological events and are best evaluated by a medical professional. "
    "Acupressure self-care is not recommended without a confirmed diagnosis."
)


@router.post("/predict")
async def predict_recommendation(
    request: RecommendationRequest,
    email: str = Depends(get_current_user),
):
    aura_fields = request.auraData.model_dump() if request.auraData else {}

    # ── Red flag check (includes aura neurological combo) ─────────────────
    if check_red_flag(request.severity, request.painTypes, aura_fields):
        # Distinguish aura combo from severity-based trigger for messaging
        msg = _AURA_RED_FLAG_MESSAGE if aura_fields else _RED_FLAG_MESSAGE
        return {"redFlag": True, "message": msg}

    # ── User context ───────────────────────────────────────────────────────
    users = db["users"]
    user  = await users.find_one({"email": email})
    head_neck_conditions: list = []
    if user and isinstance(user.get("medical_history"), dict):
        head_neck_conditions = user["medical_history"].get("head_neck", [])

    # ── Feedback personalisation ───────────────────────────────────────────
    feedback_cursor = db["session_feedback"].find(
        {"email": email, "helped": True},
        {"point_id": 1, "_id": 0},
    )
    helpful_ids = list({doc["point_id"] async for doc in feedback_cursor})

    # ── Migraine classifier (migraine zones + aura data provided) ─────────
    migraine_prediction = None
    if request.zone in _MIGRAINE_ZONES and aura_fields:
        migraine_prediction = predict_migraine_type(
            aura_fields=aura_fields,
            severity=request.severity,
        )

    # ── Cautionary migraine types: no boost, return advisory message ───────
    if (
        migraine_prediction
        and migraine_prediction["type"] in CAUTIONARY_MIGRAINE_TYPES
        and migraine_prediction["confidence"] >= 0.5
    ):
        return {
            "redFlag":    True,
            "cautionary": True,
            "message":    _CAUTIONARY_MESSAGE.format(type=migraine_prediction["type"]),
            "migraineType":       migraine_prediction["type"],
            "migraineConfidence": migraine_prediction["confidence"],
        }

    # ── Score acupressure points ───────────────────────────────────────────
    ranked = score_points(
        zone=request.zone,
        pain_types=request.painTypes,
        severity=request.severity,
        history_conditions=head_neck_conditions,
        helpful_point_ids=helpful_ids or None,
        migraine_type=migraine_prediction["type"]        if migraine_prediction else None,
        migraine_confidence=migraine_prediction["confidence"] if migraine_prediction else None,
    )

    if not ranked:
        raise HTTPException(status_code=404, detail="No acupressure points found for this zone.")

    doc = {
        "email":          email,
        "zone":           request.zone,
        "painTypes":      request.painTypes,
        "severity":       request.severity,
        "historyFlagsUsed": head_neck_conditions,
        "migraineType":   migraine_prediction["type"] if migraine_prediction else None,
        "recommendedPoints": [
            {"point_id": r["point_id"], "score": r["score"], "reason": "; ".join(r["reasons"])}
            for r in ranked
        ],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["point_recommendations"].insert_one(doc)

    response = {
        "redFlag":         False,
        "recommendationId": str(result.inserted_id),
        "zone":            request.zone,
        "severity":        request.severity,
        "points":          ranked,
    }
    if migraine_prediction:
        response["migraineType"]       = migraine_prediction["type"]
        response["migraineConfidence"] = migraine_prediction["confidence"]

    return response


@router.post("/feedback")
async def save_feedback(
    request: FeedbackRequest,
    email: str = Depends(get_current_user),
):
    doc = {
        "email":             email,
        "recommendation_id": request.recommendationId,
        "point_id":          request.pointId,
        "helped":            request.helped,
        "rating":            request.rating,
        "notes":             request.notes or "",
        "created_at":        datetime.now(timezone.utc),
    }
    await db["session_feedback"].insert_one(doc)
    return {"success": True, "message": "Feedback saved"}
