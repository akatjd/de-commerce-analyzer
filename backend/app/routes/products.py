from fastapi import APIRouter, Query
from app.services.scraper_service import search_products

router = APIRouter()


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, description="검색 키워드"),
    limit: int = Query(20, ge=1, le=100),
):
    results = await search_products(q, limit)
    return {
        "keyword": q,
        "count": len(results),
        "products": [r.model_dump() for r in results],
    }
