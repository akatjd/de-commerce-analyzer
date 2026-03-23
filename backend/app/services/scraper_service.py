import os
import re
import random
import hashlib
import httpx
from bs4 import BeautifulSoup
from urllib.parse import quote
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9",
}


class ProductResult(BaseModel):
    id: str
    name: str
    price: int
    original_price: int | None = None
    discount_rate: int | None = None
    source: str
    url: str
    image_url: str | None = None
    rating: float | None = None
    review_count: int | None = None
    is_mock: bool = False


def _clean_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def _parse_price(text: str) -> int | None:
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def _discount_rate(low: int, high: int) -> int | None:
    if high > low > 0:
        rate = round((1 - low / high) * 100)
        return rate if rate > 0 else None
    return None


# ── 다나와 스크래퍼 ────────────────────────────────────────
async def _search_danawa(keyword: str, limit: int) -> List[ProductResult]:
    url = f"https://search.danawa.com/dsearch.php?query={quote(keyword)}&page=1"
    async with httpx.AsyncClient(timeout=12, follow_redirects=True, headers=_HEADERS) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    items = soup.select("ul.product_list > li.prod_item")

    results: List[ProductResult] = []
    for item in items[:limit]:
        try:
            name_el = item.select_one(".prod_main_info .prod_name a") or item.select_one(".prod_name a")
            if not name_el:
                continue
            name = name_el.get_text(strip=True)
            link = name_el.get("href", "")
            if link.startswith("//"):
                link = "https:" + link

            # 최저가
            price_el = item.select_one(".price_sect strong") or item.select_one(".price-prodlist-price")
            if not price_el:
                continue
            price = _parse_price(price_el.get_text())
            if not price:
                continue

            # 이미지
            img_el = item.select_one(".thumb_image img")
            image_url = None
            if img_el:
                image_url = img_el.get("data-original") or img_el.get("src")
                if image_url and image_url.startswith("//"):
                    image_url = "https:" + image_url

            # 쇼핑몰 수
            shop_el = item.select_one(".price_sect .count")
            source = shop_el.get_text(strip=True) if shop_el else "다나와"

            # 평점
            rating_el = item.select_one(".star_info .num")
            rating = float(rating_el.get_text(strip=True)) if rating_el else None

            # 리뷰수
            review_el = item.select_one(".star_info .cnt")
            review_count = _parse_price(review_el.get_text()) if review_el else None

            results.append(ProductResult(
                id=hashlib.md5(link.encode()).hexdigest()[:12],
                name=name,
                price=price,
                source=source if source else "다나와",
                url=link or f"https://search.danawa.com/dsearch.php?query={quote(keyword)}",
                image_url=image_url,
                rating=rating,
                review_count=review_count,
                is_mock=False,
            ))
        except Exception:
            continue

    return results


# ── 네이버 쇼핑 API ────────────────────────────────────────
async def _search_naver(keyword: str, limit: int) -> List[ProductResult]:
    url = "https://openapi.naver.com/v1/search/shop.json"
    headers = {
        **_HEADERS,
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {"query": keyword, "display": min(limit, 100), "sort": "sim"}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("items", []):
        try:
            low = int(item.get("lprice") or 0)
            high = int(item.get("hprice") or 0)
            if low == 0:
                continue
            results.append(ProductResult(
                id=item.get("productId") or hashlib.md5(item.get("link", "").encode()).hexdigest()[:12],
                name=_clean_html(item.get("title", "")),
                price=low,
                original_price=high if high > low else None,
                discount_rate=_discount_rate(low, high),
                source=item.get("mallName", "네이버쇼핑"),
                url=item.get("link", ""),
                image_url=item.get("image"),
                is_mock=False,
            ))
        except Exception:
            continue

    return results


# ── 목업 폴백 ──────────────────────────────────────────────
SOURCES = ["쿠팡", "네이버쇼핑", "G마켓", "11번가"]
ADJECTIVES = ["프리미엄", "베이직", "스탠다드", "울트라", "프로", "라이트", "스마트", "하이엔드"]
TYPES = ["A타입", "B타입", "특가", "한정판", "신상품", "베스트셀러"]


def _search_url(source: str, keyword: str) -> str:
    q = quote(keyword)
    urls = {
        "쿠팡": f"https://www.coupang.com/np/search?q={q}",
        "네이버쇼핑": f"https://search.shopping.naver.com/search/all?query={q}",
        "G마켓": f"https://search.gmarket.co.kr/search.aspx?keyword={q}",
        "11번가": f"https://search.11st.co.kr/Search.tmall?kwd={q}",
    }
    return urls.get(source, f"https://www.google.com/search?q={q}+쇼핑")


def _mock_products(keyword: str, limit: int) -> List[ProductResult]:
    seed = int(hashlib.md5(keyword.encode()).hexdigest(), 16) % 100000
    rng = random.Random(seed)
    base_price_pools = [9900, 15000, 19800, 25000, 35000, 49000, 69000, 89000, 129000, 199000, 299000]

    results = []
    for i in range(limit):
        source = SOURCES[i % len(SOURCES)]
        base_price = rng.choice(base_price_pools) + rng.randint(0, 10) * 100
        discount = rng.choice([0, 0, 5, 10, 10, 15, 20, 25, 30])
        original_price = int(base_price / (1 - discount / 100) / 100) * 100 if discount > 0 else None
        results.append(ProductResult(
            id=f"{seed}_{i}",
            name=f"{keyword} {ADJECTIVES[i % len(ADJECTIVES)]} {TYPES[i % len(TYPES)]}",
            price=base_price,
            original_price=original_price,
            discount_rate=discount if discount > 0 else None,
            source=source,
            url=_search_url(source, keyword),
            image_url=f"https://picsum.photos/seed/{seed + i}/300/300",
            rating=round(rng.uniform(3.5, 5.0), 1),
            review_count=rng.randint(10, 80000),
            is_mock=True,
        ))
    results.sort(key=lambda x: x.price)
    return results


# ── 진입점 ─────────────────────────────────────────────────
async def search_products(keyword: str, limit: int = 20) -> List[ProductResult]:
    # 1순위: 네이버 쇼핑 API (키 있을 때)
    if NAVER_CLIENT_ID and NAVER_CLIENT_SECRET:
        try:
            results = await _search_naver(keyword, limit)
            if results:
                return results
        except Exception:
            pass

    # 2순위: 다나와 스크래핑
    try:
        results = await _search_danawa(keyword, limit)
        if results:
            return results
    except Exception:
        pass

    # 3순위: 목업 데이터
    return _mock_products(keyword, limit)
