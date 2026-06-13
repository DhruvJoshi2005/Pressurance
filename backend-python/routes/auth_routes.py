from fastapi import APIRouter, HTTPException, Request, Depends
from source.models import RegisterModel, LoginModel
from source.database import db
from source.utils import hash_password, verify_password, create_jwt_token, create_refresh_token, decode_refresh_token, get_current_user
from datetime import datetime, timezone
from fastapi_sso.sso.google import GoogleSSO
import os
from fastapi.responses import JSONResponse


router = APIRouter()



# Initialize GoogleSSO with environment variables
google_sso = GoogleSSO(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    redirect_uri=os.getenv("GOOGLE_REDIRECT_URI")  # e.g. http://localhost:8000/auth/google/callback
)

@router.post("/register")
async def register(user: RegisterModel):
    users = db["users"]
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already registered")
    hashed_pw = hash_password(user.password)
    await users.insert_one({"email": user.email, "password": hashed_pw, "refresh_tokens": []})
    return {"msg": "User registered successfully"}

@router.post("/login")
async def login(user: LoginModel, request: Request):
    users = db["users"]
    db_user = await users.find_one({"email": user.email})
    if not db_user or not db_user.get("password") or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    payload = {"sub": user.email}
    access_token = create_jwt_token(payload)
    refresh_token = create_refresh_token(payload)
    hashed_refresh_token = hash_password(refresh_token)
    device = request.headers.get("user-agent", "unknown")
    await users.update_one(
        {"email": user.email},
        {"$push": {"refresh_tokens": {
            "token": hashed_refresh_token,
            "device": device,
            "created_at": datetime.now(timezone.utc)
        }}
        }
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/google/login")
async def google_login():
    async with google_sso:
        return await google_sso.get_login_redirect()





@router.get("/google/callback")
async def google_callback(request: Request):
    try:
        # Correct usage: pass the request object
        async with google_sso:
            user_info = await google_sso.verify_and_process(request)
    except Exception as e:
        print("🔴 Google SSO Callback Error:", str(e))
        raise HTTPException(status_code=500, detail="Google SSO failed")

    email = user_info.email
    users = db["users"]

    # Check if user already exists
    user = await users.find_one({"email": email})
    if not user:
        # Create new user for Google login
        await users.insert_one({
            "email": email,
            "password": None,
            "is_google_account": True,
            "refresh_tokens": []
        })

    # Create JWT + Refresh token
    payload = {"sub": email}
    access_token = create_jwt_token(payload)
    refresh_token = create_refresh_token(payload)
    hashed_refresh_token = hash_password(refresh_token)
    device = "google_oauth"

    # Store hashed refresh token
    await users.update_one(
        {"email": email},
        {"$push": {
            "refresh_tokens": {
                "token": hashed_refresh_token,
                "device": device,
                "created_at": datetime.now(timezone.utc)
            }
        }}
    )

    # Return tokens
    return JSONResponse({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    })


@router.post("/refresh")
async def refresh_token(request: Request):
    body = await request.json()
    incoming_token = body.get("refresh_token")
    if not incoming_token:
        raise HTTPException(status_code=400, detail="Refresh token missing")
    try:
        payload = decode_refresh_token(incoming_token)
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    users = db["users"]
    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    stored_tokens = user.get("refresh_tokens", [])
    matched_index = None
    for i, entry in enumerate(stored_tokens):
        if verify_password(incoming_token, entry["token"]):
            matched_index = i
            break
    if matched_index is None:
        raise HTTPException(status_code=403, detail="Refresh token invalid or revoked")
    new_payload = {"sub": email}
    new_access_token = create_jwt_token(new_payload)
    new_refresh_token = create_refresh_token(new_payload)
    new_hashed = hash_password(new_refresh_token)
    device = request.headers.get("user-agent", "unknown")
    stored_tokens[matched_index] = {
        "token": new_hashed,
        "device": device,
        "created_at": datetime.now(timezone.utc)
    }
    await users.update_one(
        {"email": email},
        {"$set": {"refresh_tokens": stored_tokens}}
    )
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/medical-history")
async def save_medical_history(request: Request, email: str = Depends(get_current_user)):
    body = await request.json()
    conditions = body.get("conditions", {})
    users = db["users"]
    await users.update_one(
        {"email": email},
        {"$set": {"medical_history": conditions, "medical_history_completed": True}}
    )
    return {"msg": "Medical history saved"}

@router.post("/logout")
async def logout(request: Request):
    body = await request.json()
    incoming_token = body.get("refresh_token")
    if not incoming_token:
        raise HTTPException(status_code=400, detail="Refresh token missing")
    try:
        payload = decode_refresh_token(incoming_token)
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    users = db["users"]
    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_tokens = []
    for entry in user.get("refresh_tokens", []):
        if not verify_password(incoming_token, entry["token"]):
            new_tokens.append(entry)
    await users.update_one(
        {"email": email},
        {"$set": {"refresh_tokens": new_tokens}}
    )
    return {"msg": "Logged out successfully"}
