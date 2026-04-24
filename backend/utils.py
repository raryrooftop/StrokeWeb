import os
from datetime import datetime
from google.cloud import bigquery

# GCP 프로젝트 설정
PROJECT_ID = 'stroke-insight-hub'
DATASET_ID = 'stroke_data'
TABLE_ID = 'visitor_logs'

def get_visitor_stats():
    """BigQuery에서 방문자 통계를 조회합니다."""
    client = bigquery.Client(project=PROJECT_ID)
    
    query = f"""
        SELECT 
            (SELECT COUNT(*) FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`) as total_count,
            (SELECT COUNT(*) FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}` 
             WHERE DATE(timestamp, 'Asia/Seoul') = CURRENT_DATE('Asia/Seoul')) as today_count
    """
    try:
        query_job = client.query(query)
        results = query_job.to_dataframe()
        if not results.empty:
            row = results.iloc[0]
            return {
                "total": int(row['total_count']),
                "today": int(row['today_count'])
            }
    except Exception as e:
        print(f"Error fetching visitor stats: {e}")
    
    return {"total": 0, "today": 0}

def increment_visitor():
    """BigQuery에 새로운 방문 기록을 추가하고 업데이트된 통계를 반환합니다."""
    client = bigquery.Client(project=PROJECT_ID)
    
    # 새로운 방문 기록 삽입
    rows_to_insert = [{"timestamp": datetime.utcnow().isoformat()}]
    try:
        errors = client.insert_rows_json(f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}", rows_to_insert)
        if errors:
            print(f"Error inserting visitor log: {errors}")
    except Exception as e:
        print(f"Exception during visitor log insert: {e}")
        
    return get_visitor_stats()
