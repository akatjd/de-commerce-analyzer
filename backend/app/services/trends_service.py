import time
from pytrends.request import TrendReq
from typing import List

# 인메모리 캐시 (키: (keyword, timeframe), TTL: 6시간)
_cache: dict = {}
_CACHE_TTL = 6 * 3600


def _cache_get(key: tuple):
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _cache_set(key: tuple, data):
    _cache[key] = (data, time.time())


TIMEFRAME_OPTIONS = {
    "1w": "now 7-d",
    "1m": "today 1-m",
    "3m": "today 3-m",
    "12m": "today 12-m",
    "5y": "today 5-y",
}


def get_trends(keyword: str, timeframe: str = "3m") -> dict:
    cache_key = ("trends", keyword, timeframe)
    cached = _cache_get(cache_key)
    if cached:
        return cached

    tf = TIMEFRAME_OPTIONS.get(timeframe, "today 3-m")
    try:
        pytrends = TrendReq(hl="ko", tz=540)
        pytrends.build_payload([keyword], timeframe=tf, geo="KR")

        interest_df = pytrends.interest_over_time()
        related_queries = pytrends.related_queries()

        timeline = []
        if not interest_df.empty and keyword in interest_df.columns:
            for date, row in interest_df.iterrows():
                timeline.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "value": int(row[keyword]),
                })

        related_top = []
        related_rising = []
        if keyword in related_queries:
            top_df = related_queries[keyword].get("top")
            rising_df = related_queries[keyword].get("rising")
            if top_df is not None and not top_df.empty:
                related_top = top_df.head(10).to_dict("records")
            if rising_df is not None and not rising_df.empty:
                related_rising = rising_df.head(10).to_dict("records")

        result = {
            "keyword": keyword,
            "timeframe": timeframe,
            "timeline": timeline,
            "related_top": related_top,
            "related_rising": related_rising,
        }
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        return {
            "keyword": keyword,
            "timeframe": timeframe,
            "timeline": [],
            "related_top": [],
            "related_rising": [],
            "error": str(e),
        }


# 한국 이커머스 인기 후보 키워드 (카테고리별)
CANDIDATE_KEYWORDS = [
    "무선이어폰", "노트북", "스마트워치", "태블릿", "공기청정기",
    "전기차", "다이슨", "삼성갤럭시", "아이폰", "닌텐도",
    "패딩", "운동화", "크록스", "골프", "요가매트",
    "에어프라이어", "캡슐커피", "비타민", "프로틴", "다이어트",
    "스킨케어", "선크림", "향수", "립스틱", "마스크팩",
    "캠핑", "텀블러", "백팩", "여행가방", "호텔",
]


async def get_top_trending_with_products(timeframe: str = "3m", limit: int = 6) -> dict:
    from app.services.scraper_service import search_products

    cache_key = ("discover", timeframe, limit)
    cached = _cache_get(cache_key)
    if cached:
        return cached

    tf = TIMEFRAME_OPTIONS.get(timeframe, "today 3-m")

    keyword_scores: dict[str, float] = {}
    timelines: dict[str, list] = {}
    trends_available = False

    # API 호출 최소화: 5개씩 최대 2번만 시도
    # pytrends는 한 번에 최대 5개 비교 가능
    for batch_start in range(0, min(10, len(CANDIDATE_KEYWORDS)), 5):
        batch = CANDIDATE_KEYWORDS[batch_start:batch_start + 5]
        try:
            time.sleep(1.0)
            pt = TrendReq(hl="ko", tz=540)
            pt.build_payload(batch, timeframe=tf, geo="KR")
            df = pt.interest_over_time()
            if not df.empty:
                trends_available = True
                for kw in batch:
                    if kw in df.columns:
                        avg = float(df[kw].mean())
                        keyword_scores[kw] = avg
                        timelines[kw] = [
                            {"date": d.strftime("%Y-%m-%d"), "value": int(row[kw])}
                            for d, row in df.iterrows()
                        ]
        except Exception:
            pass

    # Trends API 실패 시: 사전 정의 순위 사용 (index 낮을수록 인기)
    if not trends_available:
        for i, kw in enumerate(CANDIDATE_KEYWORDS):
            keyword_scores[kw] = float(len(CANDIDATE_KEYWORDS) - i)

    # 점수 기준 정렬 후 limit개 선택
    ranked = sorted(keyword_scores, key=lambda k: keyword_scores[k], reverse=True)[:limit]

    # 부족하면 나머지 후보로 채우기
    for kw in CANDIDATE_KEYWORDS:
        if len(ranked) >= limit:
            break
        if kw not in ranked:
            ranked.append(kw)
            keyword_scores.setdefault(kw, 0.0)

    results = []
    for kw in ranked:
        products = await search_products(kw, 4)
        results.append({
            "keyword": kw,
            "timeline": timelines.get(kw, []),
            "products": [p.model_dump() for p in products],
            "avg_interest": round(keyword_scores.get(kw, 0), 1),
            "trends_available": trends_available,
        })

    result = {"timeframe": timeframe, "trends": results, "trends_available": trends_available}
    # 실제 Trends 데이터를 가져왔을 때만 캐시 (폴백은 캐시 안 함)
    if trends_available:
        _cache_set(cache_key, result)
    return result


def get_trends_comparison(keywords: List[str], timeframe: str = "3m") -> dict:
    tf = TIMEFRAME_OPTIONS.get(timeframe, "today 3-m")
    keywords = keywords[:5]
    try:
        pytrends = TrendReq(hl="ko", tz=540)
        pytrends.build_payload(keywords, timeframe=tf, geo="KR")

        interest_df = pytrends.interest_over_time()

        timeline = []
        if not interest_df.empty:
            for date, row in interest_df.iterrows():
                entry = {"date": date.strftime("%Y-%m-%d")}
                for kw in keywords:
                    if kw in row:
                        entry[kw] = int(row[kw])
                    else:
                        entry[kw] = 0
                timeline.append(entry)

        return {
            "keywords": keywords,
            "timeframe": timeframe,
            "timeline": timeline,
        }
    except Exception as e:
        return {
            "keywords": keywords,
            "timeframe": timeframe,
            "timeline": [],
            "error": str(e),
        }
