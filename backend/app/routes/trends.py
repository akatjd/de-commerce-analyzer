from fastapi import APIRouter, Query
from app.services.trends_service import get_trends, get_trends_comparison, get_top_trending_with_products
from pydantic import BaseModel
from typing import List

router = APIRouter()


@router.get("")
async def trends(
    q: str = Query(..., min_length=1, description="검색 키워드"),
    timeframe: str = Query("3m", description="기간: 1w, 1m, 3m, 12m, 5y"),
):
    return get_trends(q, timeframe)


@router.get("/discover")
async def discover(
    timeframe: str = Query("3m", description="기간: 1w, 1m, 3m, 12m, 5y"),
    limit: int = Query(6, ge=1, le=10),
):
    return await get_top_trending_with_products(timeframe, limit)


class ComparisonRequest(BaseModel):
    keywords: List[str]
    timeframe: str = "3m"


@router.post("/comparison")
async def trends_comparison(req: ComparisonRequest):
    return get_trends_comparison(req.keywords, req.timeframe)
