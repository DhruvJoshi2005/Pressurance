# pain_assessment_routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from source.database import db
from source.utils import get_current_user
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter()

# Pydantic models for request validation
class PainAssessmentRequest(BaseModel):
    symptoms: List[str]
    otherSymptom: Optional[str] = None
    painTypes: List[str]
    severity: int
    bodyPart: Optional[str] = "Head"  # Default to Head, can be made dynamic

class PainAssessmentResponse(BaseModel):
    success: bool
    message: str
    assessmentId: str
    data: dict

@router.post("/assessment", response_model=PainAssessmentResponse)
async def create_pain_assessment(
    request: PainAssessmentRequest,
    email: str = Depends(get_current_user)
):
    """
    Create a new pain assessment with symptoms, pain types, and severity
    """
    try:
        # Validate severity range
        if request.severity < 1 or request.severity > 10:
            raise HTTPException(
                status_code=400,
                detail="Severity must be between 1 and 10"
            )

        # Validate required fields
        if not request.symptoms or not request.painTypes:
            raise HTTPException(
                status_code=400,
                detail="Symptoms and pain types are required"
            )

        pain_assessments = db["pain_assessments"]

        # Create assessment document
        assessment_doc = {
            "email": email,
            "bodyPart": request.bodyPart,
            "symptoms": request.symptoms,
            "otherSymptom": request.otherSymptom,
            "painTypes": request.painTypes,
            "severity": request.severity,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }

        # Insert into database
        result = await pain_assessments.insert_one(assessment_doc)
        assessment_id = str(result.inserted_id)

        return PainAssessmentResponse(
            success=True,
            message="Pain assessment saved successfully",
            assessmentId=assessment_id,
            data={
                "symptoms": request.symptoms,
                "otherSymptom": request.otherSymptom,
                "painTypes": request.painTypes,
                "severity": request.severity,
                "bodyPart": request.bodyPart,
                "createdAt": assessment_doc["createdAt"].isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving pain assessment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save pain assessment: {str(e)}"
        )


@router.get("/assessment/history")
async def get_assessment_history(
    limit: int = Query(default=50, ge=1, le=200),
    email: str = Depends(get_current_user)
):
    """
    Get pain assessment history for the current user
    """
    try:
        pain_assessments = db["pain_assessments"]

        # Find all assessments for this user
        cursor = pain_assessments.find(
            {"email": email}
        ).sort("createdAt", -1).limit(limit)

        assessments = []
        async for doc in cursor:
            assessments.append({
                "id": str(doc["_id"]),
                "bodyPart": doc.get("bodyPart"),
                "symptoms": doc.get("symptoms", []),
                "otherSymptom": doc.get("otherSymptom"),
                "painTypes": doc.get("painTypes", []),
                "severity": doc.get("severity"),
                "createdAt": doc.get("createdAt").isoformat() if doc.get("createdAt") else None
            })

        return {
            "success": True,
            "count": len(assessments),
            "data": assessments
        }

    except Exception as e:
        print(f"❌ Error retrieving assessment history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve assessment history: {str(e)}"
        )


@router.get("/assessment/latest")
async def get_latest_assessment(
    email: str = Depends(get_current_user)
):
    """
    Get the most recent pain assessment for the current user
    """
    try:
        pain_assessments = db["pain_assessments"]

        # Find the latest assessment
        latest = await pain_assessments.find_one(
            {"email": email},
            sort=[("createdAt", -1)]
        )

        if not latest:
            return {
                "success": True,
                "message": "No assessments found",
                "data": None
            }

        return {
            "success": True,
            "data": {
                "id": str(latest["_id"]),
                "bodyPart": latest.get("bodyPart"),
                "symptoms": latest.get("symptoms", []),
                "otherSymptom": latest.get("otherSymptom"),
                "painTypes": latest.get("painTypes", []),
                "severity": latest.get("severity"),
                "createdAt": latest.get("createdAt").isoformat() if latest.get("createdAt") else None
            }
        }

    except Exception as e:
        print(f"❌ Error retrieving latest assessment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve latest assessment: {str(e)}"
        )


@router.get("/assessment/stats")
async def get_assessment_stats(
    email: str = Depends(get_current_user)
):
    """
    Get statistics about pain assessments (average severity, most common symptoms, etc.)
    """
    try:
        pain_assessments = db["pain_assessments"]

        pipeline = [
            {"$match": {"email": email}},
            {"$group": {
                "_id": None,
                "totalAssessments": {"$sum": 1},
                "averageSeverity": {"$avg": "$severity"},
                "allSymptoms": {"$push": "$symptoms"},
                "allPainTypes": {"$push": "$painTypes"}
            }}
        ]
        results = await pain_assessments.aggregate(pipeline).to_list(length=1)

        if not results:
            return {
                "success": True,
                "message": "No assessments found",
                "data": {
                    "totalAssessments": 0,
                    "averageSeverity": 0,
                    "mostCommonSymptoms": [],
                    "mostCommonPainTypes": []
                }
            }

        row = results[0]
        symptom_count: dict = {}
        pain_type_count: dict = {}
        for lst in row["allSymptoms"]:
            for s in lst:
                symptom_count[s] = symptom_count.get(s, 0) + 1
        for lst in row["allPainTypes"]:
            for p in lst:
                pain_type_count[p] = pain_type_count.get(p, 0) + 1

        top_symptoms = sorted(symptom_count.items(), key=lambda x: x[1], reverse=True)[:5]
        top_pain_types = sorted(pain_type_count.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "success": True,
            "data": {
                "totalAssessments": row["totalAssessments"],
                "averageSeverity": round(row["averageSeverity"] or 0, 2),
                "mostCommonSymptoms": [{"name": s[0], "count": s[1]} for s in top_symptoms],
                "mostCommonPainTypes": [{"name": p[0], "count": p[1]} for p in top_pain_types]
            }
        }

    except Exception as e:
        print(f"❌ Error calculating stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate statistics: {str(e)}"
        )


@router.delete("/assessment/{assessment_id}")
async def delete_assessment(
    assessment_id: str,
    email: str = Depends(get_current_user)
):
    """
    Delete a specific pain assessment
    """
    try:
        oid = ObjectId(assessment_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format")

    try:
        pain_assessments = db["pain_assessments"]
        result = await pain_assessments.delete_one({"_id": oid, "email": email})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Assessment not found or doesn't belong to user"
            )

        return {"success": True, "message": "Assessment deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete assessment: {str(e)}")