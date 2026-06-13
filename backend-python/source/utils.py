from passlib.context import CryptContext
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer


load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_MINUTES = 60  # Token expires in 1 hour
# Create a hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Hash the user's password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Verify a plain password against the hashed version
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.PyJWTError:
        raise ValueError("Invalid token")
    
def create_refresh_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires_delta})
    return jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=JWT_ALGORITHM)

def decode_refresh_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_REFRESH_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("Refresh token expired")
    except jwt.PyJWTError:
        raise ValueError("Invalid refresh token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_jwt_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return email
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))