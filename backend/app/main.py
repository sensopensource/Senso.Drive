from fastapi import FastAPI
from app.database import SessionLocal
from sqlalchemy import text
from app.routers import documents, auth, categories, tags, historiques, agent, admin, preferences

app = FastAPI()

app.include_router(documents.router)
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(tags.router)
app.include_router(historiques.router)
app.include_router(agent.router)
app.include_router(admin.router)
app.include_router(preferences.router)


