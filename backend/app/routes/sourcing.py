from fastapi import APIRouter, Query
from app.services.sourcing_service import analyze_category, get_categories

router = APIRouter()


@router.get("/categories")
def categories():
    return {"categories": get_categories()}


@router.get("/analyze")
async def analyze(
    category: str = Query(..., description="독일 상품 카테고리"),
    timeframe: str = Query("3m", description="기간: 1w, 1m, 3m, 12m"),
):
    return await analyze_category(category, timeframe)
