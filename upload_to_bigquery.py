import os
import pandas as pd
from google.cloud import bigquery
from google.oauth2 import service_account

# ==========================================
# 사용자 설정 영역
# ==========================================
# 1. GCP 프로젝트 ID (콘솔에서 확인 가능, 예: stroke-insight-hub)
PROJECT_ID = 'stroke-insight-hub'

# 2. BigQuery 데이터세트 및 테이블 이름
DATASET_ID = 'stroke_data'
TABLE_ID = 'utilization_stats'

# ==========================================

def load_and_combine_data(data_dir):
    print(f"Reading CSV files from {data_dir}...")
    files = [f for f in os.listdir(data_dir) if f.endswith('.csv') and 'stroke_utilization' in f]
    
    df_list = []
    for file in files:
        file_path = os.path.join(data_dir, file)
        print(f"  - Loading {file}")
        df = pd.read_csv(file_path)
        df_list.append(df)
        
    combined_df = pd.concat(df_list, ignore_index=True)
    print(f"Total rows combined: {len(combined_df)}")
    return combined_df

def upload_to_bigquery(df):
    print("Authenticating with Google Cloud Application Default Credentials...")
    # ADC(Application Default Credentials)를 자동으로 감지하여 인증합니다.
    # 실행 전에 'gcloud auth application-default login' 이 완료되어야 합니다.
    client = bigquery.Client(project=PROJECT_ID)

    # 데이터세트 생성 (존재하지 않으면)
    dataset_ref = f"{PROJECT_ID}.{DATASET_ID}"
    try:
        client.get_dataset(dataset_ref)
        print(f"Dataset {dataset_ref} already exists.")
    except Exception:
        print(f"Creating dataset {dataset_ref}...")
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "asia-northeast3" # 서울 리전
        client.create_dataset(dataset, timeout=30)

    # 테이블 설정 (연도별 파티셔닝 적용)
    table_ref = f"{dataset_ref}.{TABLE_ID}"
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_TRUNCATE", # 덮어쓰기
        time_partitioning=bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.YEAR,
            field="year",  # year 컬럼 기준으로 파티셔닝 (임시로 time_partitioning 사용시 integer range 파티셔닝 필요)
        ),
    )
    
    # Year 컬럼은 integer 이므로 Range 파티셔닝으로 변경
    job_config = bigquery.LoadJobConfig(
        write_disposition="WRITE_TRUNCATE",
        range_partitioning=bigquery.RangePartitioning(
            field="year",
            range_=bigquery.PartitionRange(start=2000, end=2040, interval=1),
        )
    )

    print(f"Uploading data to {table_ref}...")
    job = client.load_table_from_dataframe(df, table_ref, job_config=job_config)
    job.result()  # Wait for the job to complete

    print(f"Upload complete! Uploaded {job.output_rows} rows to {table_ref}.")

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    df = load_and_combine_data(data_dir)
    upload_to_bigquery(df)
