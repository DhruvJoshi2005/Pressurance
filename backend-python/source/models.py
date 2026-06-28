from pydantic import BaseModel, EmailStr
from typing import List, Optional

class RegisterModel(BaseModel):
    email: EmailStr
    password: str

class LoginModel(BaseModel):
    email: EmailStr
    password: str

class AuraData(BaseModel):
    visual_aura:  Optional[bool] = None
    sensory:      Optional[bool] = None
    diplopia:     Optional[bool] = None
    dysphasia:    Optional[bool] = None
    dysarthria:   Optional[bool] = None
    vertigo:      Optional[bool] = None
    tinnitus:     Optional[bool] = None
    hypoacusis:   Optional[bool] = None
    defect:       Optional[bool] = None   # sudden one-sided weakness
    ataxia:       Optional[bool] = None
    duration:     Optional[int]  = None   # 1 = <1hr, 2 = 1–24hr, 3 = >24hr
    frequency:    Optional[int]  = None   # episodes per month

class RecommendationRequest(BaseModel):
    zone: str
    painTypes: List[str]
    severity: int
    auraData: Optional[AuraData] = None

class FeedbackRequest(BaseModel):
    recommendationId: str
    pointId: str
    helped: bool
    rating: Optional[int] = None
    notes: Optional[str] = None
