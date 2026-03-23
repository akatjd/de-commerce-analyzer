import time
from pytrends.request import TrendReq
from app.services.scraper_service import search_products

# 독일→한국 소싱 유망 카테고리 및 브랜드/키워드
GERMAN_CATEGORIES: dict[str, list[dict]] = {
    "주방·요리": [
        {"keyword": "WMF 냄비", "brand": "WMF", "note": "독일 1위 주방용품"},
        {"keyword": "Zwilling 칼", "brand": "Zwilling", "note": "헨켈스 모기업, 요리사 선호"},
        {"keyword": "Fissler 압력솥", "brand": "Fissler", "note": "프리미엄 조리기구"},
        {"keyword": "스타우브 무쇠냄비", "brand": "Staub", "note": "프랑스 브랜드지만 독일 생산"},
        {"keyword": "레 크루제", "brand": "Le Creuset", "note": "유럽 주방 프리미엄"},
    ],
    "공구·DIY": [
        {"keyword": "보쉬 드릴", "brand": "Bosch", "note": "세계 1위 전동공구"},
        {"keyword": "Festool 샌더", "brand": "Festool", "note": "전문가용 고급 공구"},
        {"keyword": "Knipex 플라이어", "brand": "Knipex", "note": "독일 명품 공구"},
        {"keyword": "Wera 드라이버", "brand": "Wera", "note": "인체공학 수공구"},
        {"keyword": "Metabo 그라인더", "brand": "Metabo", "note": "전문 전동공구"},
    ],
    "자동차용품": [
        {"keyword": "Liqui Moly 엔진오일", "brand": "Liqui Moly", "note": "독일 최고 엔진오일"},
        {"keyword": "Continental 타이어", "brand": "Continental", "note": "세계 3위 타이어"},
        {"keyword": "보쉬 배터리", "brand": "Bosch", "note": "OEM 배터리 강자"},
        {"keyword": "Bilstein 쇼크업쇼버", "brand": "Bilstein", "note": "서스펜션 명가"},
        {"keyword": "Hella 헤드라이트", "brand": "Hella", "note": "자동차 조명 1위"},
    ],
    "건강·뷰티": [
        {"keyword": "Eucerin 크림", "brand": "Eucerin", "note": "피부과 추천 1위"},
        {"keyword": "Weleda 스킨케어", "brand": "Weleda", "note": "유기농 자연주의"},
        {"keyword": "Nivea 로션", "brand": "Nivea", "note": "독일 바이어스도르프"},
        {"keyword": "Dr.Hauschka", "brand": "Dr. Hauschka", "note": "바이오 다이나믹 화장품"},
        {"keyword": "Lavera 자연화장품", "brand": "Lavera", "note": "인증 천연 화장품"},
    ],
    "음향·전자": [
        {"keyword": "Sennheiser 헤드폰", "brand": "Sennheiser", "note": "세계 최고 음향"},
        {"keyword": "Beyerdynamic 헤드셋", "brand": "Beyerdynamic", "note": "스튜디오 표준"},
        {"keyword": "Miele 청소기", "brand": "Miele", "note": "독일 명품 가전"},
        {"keyword": "Braun 면도기", "brand": "Braun", "note": "전통 독일 면도기"},
        {"keyword": "Grundig 가전", "brand": "Grundig", "note": "독일 전통 가전"},
    ],
    "스포츠·아웃도어": [
        {"keyword": "아디다스 운동화", "brand": "Adidas", "note": "독일 스포츠 1위"},
        {"keyword": "Puma 신발", "brand": "Puma", "note": "독일 스포츠 2위"},
        {"keyword": "Jack Wolfskin 아웃도어", "brand": "Jack Wolfskin", "note": "독일 아웃도어 1위"},
        {"keyword": "Uvex 헬멧", "brand": "Uvex", "note": "안전장비 전문"},
        {"keyword": "Deuter 배낭", "brand": "Deuter", "note": "전문 등산배낭"},
    ],
    "아동·완구": [
        {"keyword": "Playmobil 장난감", "brand": "Playmobil", "note": "독일 국민 완구"},
        {"keyword": "Haba 원목장난감", "brand": "Haba", "note": "친환경 유아용품"},
        {"keyword": "Jako-o 아동복", "brand": "Jako-o", "note": "독일 아동 패션"},
        {"keyword": "Lego 레고", "brand": "Lego", "note": "유럽 대표 완구"},
        {"keyword": "Ravensburger 퍼즐", "brand": "Ravensburger", "note": "독일 교육완구"},
    ],
    "식품·음료": [
        {"keyword": "독일 맥주", "brand": "독일 맥주", "note": "바이에른 순수령"},
        {"keyword": "독일 소시지", "brand": "독일 소시지", "note": "정통 부어스트"},
        {"keyword": "유기농 뮤즐리", "brand": "Kölln", "note": "독일 건강식품"},
        {"keyword": "독일 초콜릿", "brand": "Ritter Sport", "note": "리터 스포츠"},
        {"keyword": "Haribo 젤리", "brand": "Haribo", "note": "독일 국민 젤리"},
    ],
}


async def analyze_category(category: str, timeframe: str = "3m") -> dict:
    items = GERMAN_CATEGORIES.get(category, [])
    if not items:
        return {"category": category, "items": [], "error": "카테고리를 찾을 수 없습니다."}

    tf = {
        "1w": "now 7-d", "1m": "today 1-m",
        "3m": "today 3-m", "12m": "today 12-m",
    }.get(timeframe, "today 3-m")

    keywords = [item["keyword"] for item in items[:5]]

    # Google Trends: 한국 관심도
    kr_timeline: list = []
    kr_scores: dict[str, float] = {}
    try:
        time.sleep(0.5)
        pt = TrendReq(hl="ko", tz=540)
        pt.build_payload(keywords, timeframe=tf, geo="KR")
        df = pt.interest_over_time()
        if not df.empty:
            for kw in keywords:
                if kw in df.columns:
                    kr_scores[kw] = round(float(df[kw].mean()), 1)
            for date, row in df.iterrows():
                entry: dict = {"date": date.strftime("%Y-%m-%d")}
                for kw in keywords:
                    if kw in df.columns:
                        entry[kw] = int(row[kw])
                kr_timeline.append(entry)
    except Exception:
        pass

    # 각 아이템별 한국 시장 상품 조회
    result_items = []
    for item in items:
        kw = item["keyword"]
        products = await search_products(kw, 4)
        prices = [p.price for p in products if not p.is_mock]
        result_items.append({
            **item,
            "kr_interest": kr_scores.get(kw, 0),
            "products": [p.model_dump() for p in products],
            "kr_price_min": min(prices) if prices else None,
            "kr_price_max": max(prices) if prices else None,
        })

    # 한국 수요 높은 순 정렬
    result_items.sort(key=lambda x: x["kr_interest"], reverse=True)

    return {
        "category": category,
        "timeframe": timeframe,
        "keywords": keywords,
        "kr_timeline": kr_timeline,
        "items": result_items,
        "trends_available": bool(kr_scores),
    }


def get_categories() -> list[str]:
    return list(GERMAN_CATEGORIES.keys())
