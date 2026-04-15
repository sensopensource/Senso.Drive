from fastapi import FastAPI
from app.database import SessionLocal
from sqlalchemy import text 
from app.routers import documents

app = FastAPI()
app.include_router(documents.router)

@app.get("/health")
def health():
    return {"Status", "ok"}

@app.get("/db-check")
def db_check():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1")).scalar()
        return {"db": "connected", "result": result}
    finally:
        db.close()

