from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.scraper_service import search_products

router = APIRouter()


class CompareRequest(BaseModel):
    keywords: List[str]
    limit: int = 6


@router.post("")
async def compare(req: CompareRequest):
    keywords = req.keywords[:5]
    comparisons = {}
    for kw in keywords:
        products = await search_products(kw, req.limit)
        comparisons[kw] = [p.model_dump() for p in products]

    return {
        "keywords": keywords,
        "comparisons": comparisons,
    }
