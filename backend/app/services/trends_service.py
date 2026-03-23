import time
from pytrends.request import TrendReq
from typing import List


TIMEFRAME_OPTIONS = {
    "1w": "now 7-d",
    "1m": "today 1-m",
    "3m": "today 3-m",
    "12m": "today 12-m",
    "5y": "today 5-y",
}


def get_trends(keyword: str, timeframe: str = "3m") -> dict:
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

        return {
            "keyword": keyword,
            "timeframe": timeframe,
            "timeline": timeline,
            "related_top": related_top,
            "related_rising": related_rising,
        }
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

    tf = TIMEFRAME_OPTIONS.get(timeframe, "today 3-m")

    # 후보 키워드를 5개씩 배치로 나눠 관심도 조회
    keyword_scores: dict[str, float] = {}
    batches = [CANDIDATE_KEYWORDS[i:i+5] for i in range(0, len(CANDIDATE_KEYWORDS), 5)]

    for batch in batches:
        try:
            time.sleep(0.3)
            pt = TrendReq(hl="ko", tz=540)
            pt.build_payload(batch, timeframe=tf, geo="KR")
            df = pt.interest_over_time()
            if not df.empty:
                for kw in batch:
                    if kw in df.columns:
                        keyword_scores[kw] = float(df[kw].mean())
        except Exception:
            # 배치 실패 시 해당 배치 건너뜀
            for kw in batch:
                keyword_scores.setdefault(kw, 0.0)

    # 관심도 높은 순으로 정렬 → 상위 limit개
    top_keywords = sorted(keyword_scores, key=lambda k: keyword_scores[k], reverse=True)[:limit]

    # 각 키워드별 타임라인 + 상품 조회
    results = []
    for kw in top_keywords:
        entry: dict = {"keyword": kw, "timeline": [], "products": [], "avg_interest": round(keyword_scores.get(kw, 0), 1)}
        try:
            time.sleep(0.3)
            pt2 = TrendReq(hl="ko", tz=540)
            pt2.build_payload([kw], timeframe=tf, geo="KR")
            interest_df = pt2.interest_over_time()
            if not interest_df.empty and kw in interest_df.columns:
                entry["timeline"] = [
                    {"date": d.strftime("%Y-%m-%d"), "value": int(row[kw])}
                    for d, row in interest_df.iterrows()
                ]
        except Exception:
            pass

        products = await search_products(kw, 4)
        entry["products"] = [p.model_dump() for p in products]
        results.append(entry)

    return {"timeframe": timeframe, "trends": results}


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
