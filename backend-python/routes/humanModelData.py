# humanModelData.py
from fastapi import APIRouter, Depends, HTTPException
from source.database import db
from source.utils import get_current_user
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class PainLogRequest(BaseModel):
    area: str

@router.post("/start-session")
async def start_session(email: str = Depends(get_current_user)):
    pain_area = db["pain_area"]

    existing = await pain_area.find_one({"email": email})
    session = {"session_start": datetime.now(timezone.utc), "logs": []}

    if not existing:
        await pain_area.insert_one({"email": email, "sessions": [session]})
    else:
        await pain_area.update_one(
            {"email": email},
            {"$push": {"sessions": session}}
        )

    return {"msg": "New session started", "email": email}


@router.post("/log-pain")
async def log_pain(request: PainLogRequest, email: str = Depends(get_current_user)):
    pain_area = db["pain_area"]
    
    doc = await pain_area.find_one({"email": email})
    if not doc or "sessions" not in doc or len(doc["sessions"]) == 0:
        raise HTTPException(status_code=404, detail="No active session found. Start session first.")

    last_session_index = len(doc["sessions"]) - 1
    log_entry = {"area": request.area, "time": datetime.now(timezone.utc)}

    await pain_area.update_one(
        {"email": email, f"sessions.{last_session_index}": {"$exists": True}},
        {"$push": {f"sessions.{last_session_index}.logs": log_entry}}
    )

    return {"msg": f"Pain area '{request.area}' logged", "email": email}
