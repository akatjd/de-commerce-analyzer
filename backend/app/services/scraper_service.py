import random
import hashlib
from typing import List
from pydantic import BaseModel


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


SOURCES = ["쿠팡", "네이버쇼핑", "G마켓", "11번가"]
SOURCE_DOMAINS = {
    "쿠팡": "coupang.com",
    "네이버쇼핑": "shopping.naver.com",
    "G마켓": "gmarket.co.kr",
    "11번가": "11st.co.kr",
}
ADJECTIVES = ["프리미엄", "베이직", "스탠다드", "울트라", "프로", "라이트", "스마트", "하이엔드"]
TYPES = ["A타입", "B타입", "특가", "한정판", "신상품", "베스트셀러"]


async def search_products(keyword: str, limit: int = 20) -> List[ProductResult]:
    seed = int(hashlib.md5(keyword.encode()).hexdigest(), 16) % 100000
    rng = random.Random(seed)

    base_price_pools = [9900, 15000, 19800, 25000, 35000, 49000, 69000, 89000, 129000, 199000, 299000]

    results = []
    for i in range(limit):
        source = SOURCES[i % len(SOURCES)]
        domain = SOURCE_DOMAINS[source]

        base_price = rng.choice(base_price_pools) + rng.randint(0, 10) * 100
        discount = rng.choice([0, 0, 5, 10, 10, 15, 20, 25, 30])
        if discount > 0:
            original_price = int(base_price / (1 - discount / 100) / 100) * 100
        else:
            original_price = None

        adj = ADJECTIVES[i % len(ADJECTIVES)]
        typ = TYPES[i % len(TYPES)]
        name = f"{keyword} {adj} {typ}"

        product_id = f"{seed}_{i}"

        results.append(ProductResult(
            id=product_id,
            name=name,
            price=base_price,
            original_price=original_price,
            discount_rate=discount if discount > 0 else None,
            source=source,
            url=f"https://www.{domain}/products/{product_id}",
            image_url=f"https://picsum.photos/seed/{seed + i}/300/300",
            rating=round(rng.uniform(3.5, 5.0), 1),
            review_count=rng.randint(10, 80000),
        ))

    results.sort(key=lambda x: x.price)
    return results
