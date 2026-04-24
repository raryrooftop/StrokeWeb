from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from google.cloud import bigquery
import os
import pandas as pd
import numpy as np
from typing import List, Optional
import json
from datetime import date
from backend.constants import STANDARD_POP_2005, STANDARD_POP_2020
from backend.utils import increment_visitor, get_visitor_stats

app = FastAPI(title="뇌졸중 분석 플랫폼 API")

# CORS 설정 (프론트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 실배포 시에는 프론트엔드 도메인으로 제한 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GCP 프로젝트 설정
PROJECT_ID = 'stroke-insight-hub'
DATASET_ID = 'stroke_data'
TABLE_ID = 'utilization_stats'
bq_client = bigquery.Client(project=PROJECT_ID)

# 빌드된 프론트엔드 경로 설정
FRONTEND_DIST_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.get("/")
async def serve_index():
    """메인 페이지(index.html) 서빙"""
    index_file = os.path.join(FRONTEND_DIST_PATH, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "프론트엔드 빌드 파일이 존재하지 않습니다. (Dashboard API는 작동 중)"}

@app.get("/api/stats/health")
async def health_check():
    return {"status": "ok", "project": PROJECT_ID}

@app.get("/api/stats/visitors")
async def fetch_visitors():
    """방문자 수 단순 조회"""
    return get_visitor_stats()

@app.post("/api/stats/visitors")
async def record_visitor():
    """방문 기록 추가 및 조회"""
    return increment_visitor()

@app.get("/api/stats/summary")
async def get_summary_stats(
    year: Optional[int] = None, 
    start_year: Optional[int] = None, 
    end_year: Optional[int] = None,
    region_name: Optional[str] = None
):
    """대시보드 메인 KPI 카드용 요약 통계 (단일 연도 또는 기간)"""
    where_clause = []
    if start_year and end_year:
        where_clause.append(f"year BETWEEN {start_year} AND {end_year}")
        label = f"{start_year}~{end_year}"
    else:
        target_year = year or 2024
        where_clause.append(f"year = {target_year}")
        label = str(target_year)

    if region_name and region_name != "all":
        where_clause.append(f"region_name = '{region_name}'")

    where_str = " AND ".join(where_clause)

    query = f"""
        SELECT 
            SUM(inpatient_episodes) as total_episodes,
            SUM(death_within_28days) as total_deaths,
            SUM(person_years) as total_person_years
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE {where_str}
    """
    try:
        query_job = bq_client.query(query)
        results = query_job.to_dataframe()
        if results.empty:
            return {"label": label, "data": None}
        
        row = results.iloc[0]
        # 주요 지표 계산
        incidence_rate = (row['total_episodes'] / row['total_person_years']) * 100000 if row['total_person_years'] > 0 else 0
        cfr = (row['total_deaths'] / row['total_episodes']) * 100 if row['total_episodes'] > 0 else 0
        
        return {
            "label": label,
            "metrics": {
                "total_patients": int(row['total_episodes']) if not pd.isna(row['total_episodes']) else 0,
                "total_episodes": int(row['total_episodes']) if not pd.isna(row['total_episodes']) else 0,
                "incidence_rate": round(incidence_rate, 2),
                "cfr": round(cfr, 2),
                "total_deaths": int(row['total_deaths']) if not pd.isna(row['total_deaths']) else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/trends")
async def get_trends(metric: str = "incidence_rate", region_name: Optional[str] = None):
    """연도별 추세 데이터 (1-1, 2-1 영역)"""
    where_str = "1=1"
    if region_name and region_name != "all":
        where_str = f"region_name = '{region_name}'"

    query = f"""
        SELECT 
            year,
            SUM(inpatient_episodes) as episodes,
            SUM(person_years) as person_years,
            SUM(death_within_28days) as deaths
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE {where_str}
        GROUP BY year
        ORDER BY year
    """
    try:
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        
        df['incidence_rate'] = (df['episodes'] / df['person_years']) * 100000
        df['cfr'] = (df['deaths'] / df['episodes']) * 100
        df['mortality_rate'] = (df['deaths'] / df['person_years']) * 100000
        
        result = df[['year', 'incidence_rate', 'cfr', 'mortality_rate']].to_dict(orient='records')
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/asr")
async def get_asr_data(standard: str = "2005"):
    """연령표준화 발생률 (6-1 영역)"""
    std_pop = STANDARD_POP_2005 if standard == "2005" else STANDARD_POP_2020
    total_std_pop = sum(std_pop.values())
    
    query = f"""
        SELECT 
            year,
            age_group_5yr,
            SUM(inpatient_episodes) as episodes,
            SUM(person_years) as person_years
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        GROUP BY year, age_group_5yr
    """
    try:
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        
        # 연령군별 발생률 계산
        df['rate'] = (df['episodes'] / df['person_years']) * 100000
        
        # 표준 인구 가중치 적용
        df['std_pop'] = df['age_group_5yr'].map(std_pop)
        df['weighted_rate'] = df['rate'] * df['std_pop']
        
        # 연도별 ASR 산출
        asr_df = df.groupby('year').agg({
            'weighted_rate': 'sum',
            'std_pop': 'sum'
        })
        asr_df['asr'] = asr_df['weighted_rate'] / asr_df['std_pop']
        
        return asr_df.reset_index()[['year', 'asr']].to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/cross")
async def get_cross_analysis(
    year: Optional[int] = None, 
    start_year: Optional[int] = None, 
    end_year: Optional[int] = None,
    dim1: str = 'sex', 
    dim2: str = 'age_group_5yr'
):
    """복합 교차 분석 (성별 x 연령 등, 단일 연도 또는 기간)"""
    allowed = ['sex', 'age_group', 'age_group_5yr', 'income_level', 'region_name']
    if dim1 not in allowed or dim2 not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid dimensions: {dim1}, {dim2}")
    
    if start_year and end_year:
        where_clause = f"year BETWEEN {start_year} AND {end_year}"
    else:
        target_year = year or 2024
        where_clause = f"year = {target_year}"
        
    query = f"""
        SELECT 
            {dim1}, {dim2},
            SUM(inpatient_episodes) as episodes,
            SUM(person_years) as person_years,
            SUM(death_within_28days) as deaths
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE {where_clause}
        GROUP BY {dim1}, {dim2}
        ORDER BY {dim1}, {dim2}
    """
    try:
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        if df.empty: return []
        
        df['incidence_rate'] = (df['episodes'] / df['person_years']) * 100000
        df['cfr'] = (df['deaths'] / df['episodes']) * 100
        return df.fillna(0).to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats/disparity/income")
async def get_income_disparity(year: int = 2024):
    """소득 수준별 격차 분석 (3-3, 3-4 영역)"""
    query = f"""
        SELECT 
            income_level,
            SUM(inpatient_episodes) as episodes,
            SUM(person_years) as person_years,
            SUM(death_within_28days) as deaths
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE year = {year}
        GROUP BY income_level
        ORDER BY income_level
    """
    try:
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        
        if df.empty:
            return []
            
        df['incidence_rate'] = (df['episodes'] / df['person_years']) * 100000
        df['cfr'] = (df['deaths'] / df['episodes']) * 100
        
        return df.fillna(0).to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/geographic")
async def get_geographic_stats(
    year: Optional[int] = None, 
    start_year: Optional[int] = None, 
    end_year: Optional[int] = None
):
    """지역별 분포 통계 (단일 연도 또는 기간)"""
    if start_year and end_year:
        where_clause = f"year BETWEEN {start_year} AND {end_year}"
    else:
        target_year = year or 2024
        where_clause = f"year = {target_year}"

    query = f"""
        SELECT 
            region_code,
            region_name,
            district_code,
            SUM(inpatient_episodes) as episodes,
            SUM(person_years) as person_years,
            SUM(death_within_28days) as deaths
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE {where_clause}
        GROUP BY region_code, region_name, district_code
    """
    try:
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        if df.empty: return []
        
        df['incidence_rate'] = (df['episodes'] / df['person_years']) * 100000
        df['cfr'] = (df['deaths'] / df['episodes']) * 100
        return df.fillna(0).to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/stats/forecasting")
async def get_forecasting():
    """2030 예측 시뮬레이션 (7-1, 7-2 영역)"""
    query = f"""
        SELECT 
            year,
            SUM(inpatient_episodes) as episodes,
            SUM(person_years) as person_years,
            SUM(death_within_28days) as deaths
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        GROUP BY year
        ORDER BY year
    """
    try:
        query_job = bq_client.query(query)
        df = query_job.to_dataframe()
        
        df['incidence_rate'] = (df['episodes'] / df['person_years']) * 100000
        df['cfr'] = (df['deaths'] / df['episodes']) * 100
        
        # 선형 회귀를 통한 추세 분석 (최근 5년 데이터 기준)
        recent_df = df.tail(5)
        x = recent_df['year'].values
        y_inc = recent_df['incidence_rate'].values
        y_cfr = recent_df['cfr'].values
        
        slope_inc, intercept_inc = np.polyfit(x, y_inc, 1)
        slope_cfr, intercept_cfr = np.polyfit(x, y_cfr, 1)
        
        future_years = [2025, 2026, 2027, 2028, 2029, 2030]
        predictions = []
        
        for f_year in future_years:
            pred_inc = slope_inc * f_year + intercept_inc
            pred_cfr = slope_cfr * f_year + intercept_cfr
            
            # 낙관적 시나리오 (치명률이 더 빠르게 감소, 발생률 감소)
            opt_inc = pred_inc * 0.95
            opt_cfr = pred_cfr * 0.90
            
            # 비관적 시나리오 (발생률 증가, 치명률 유지)
            pess_inc = pred_inc * 1.05
            pess_cfr = pred_cfr * 1.02
            
            predictions.append({
                "year": f_year,
                "incidence_rate": {
                    "base": round(max(0, float(pred_inc)), 2),
                    "optimistic": round(max(0, float(opt_inc)), 2),
                    "pessimistic": round(max(0, float(pess_inc)), 2)
                },
                "cfr": {
                    "base": round(max(0, float(pred_cfr)), 2),
                    "optimistic": round(max(0, float(opt_cfr)), 2),
                    "pessimistic": round(max(0, float(pess_cfr)), 2)
                }
            })
            
        return {
            "historical": df[['year', 'incidence_rate', 'cfr']].to_dict(orient='records'),
            "forecast": predictions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 프론트엔드 정적 파일 서빙 (반드시 모든 API 경로 뒤에 위치해야 함)
# ---------------------------------------------------------
if os.path.exists(FRONTEND_DIST_PATH):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_PATH, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """React Router 대응을 위한 Fallback 라우트"""
    index_file = os.path.join(FRONTEND_DIST_PATH, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="정적 파일을 찾을 수 없습니다.")



