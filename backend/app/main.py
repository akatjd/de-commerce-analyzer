from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import products, trends, compare, sourcing
from app.database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="DE Commerce Analyzer", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(trends.router, prefix="/api/v1/trends", tags=["trends"])
app.include_router(compare.router, prefix="/api/v1/compare", tags=["compare"])
app.include_router(sourcing.router, prefix="/api/v1/sourcing", tags=["sourcing"])


@app.get("/")
def root():
    return {"status": "ok", "message": "DE Commerce Analyzer API"}
