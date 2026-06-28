import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_routes import router as auth_router
from routes.humanModelData import router as human_model_router
from routes.pain_assessment_routes import router as pain_assessment_router
from routes.recommendation_routes import router as recommendation_router

app = FastAPI()

_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ Include routers
app.include_router(auth_router, prefix="/auth")
app.include_router(human_model_router, prefix="/humanModel")
app.include_router(pain_assessment_router, prefix="/pain", tags=["Pain Assessment"])
app.include_router(recommendation_router, prefix="/recommendations", tags=["Recommendations"])