# 🧠 뇌졸중 분석 플랫폼 (Stroke Insight Hub)

> **Google Cloud BigQuery 연동 기반의 다차원 뇌졸중 임상 지표 분석 및 미래 예측 대시보드 웹 플랫폼**
> 
> 본 플랫폼은 국가/지역 단위의 뇌졸중 관련 의료 및 임상 원시 데이터를 구글 빅쿼리(BigQuery)와 실시간 연동하여, 다차원 통계 지표를 연산하고 시각화해 줍니다. 나아가 머신러닝/통계 예측 모델을 기반으로 2030년 미래의 발생률 추세까지 시뮬레이션해 주는 지능형 의료 통계 대시보드 시스템입니다.

---

## 🚀 주요 특징 (Key Features)

### 📊 1. 다차원 임상 통계 분석
* **실시간 핵심 지표 산출:** 총 입원 건수, 28일 내 사망자 수, 총 인구 통계 데이터를 조합하여 **뇌졸중 발생률(Incidence Rate)** 및 **치명률(Case Fatality Rate)**을 실시간으로 자동 연산합니다.
* **연령표준화 발생률 보정 (ASR):** 고령화에 따른 인구 왜곡 오류를 제거하기 위해 **대한민국 2005년 및 2020년 인구 구조 표준**을 적용한 연령표준화 발생률을 정확하게 계산합니다.

### 🔍 2. 맞춤형 비교 및 격차 추적
* **복합 교차 분석:** 성별(Sex) x 연령군(Age Group) x 지역(Region) x 소득 수준(Income) 등 다양한 인구통계학적 지표들을 유연하게 결합하여 분석합니다.
* **의료/건강 격차 분석:** 소득 분위별 뇌졸중 치명률과 발생률 추이를 추적하여, 소득 수준 및 행정 구역에 따른 보건 의료 불평등 지표를 한눈에 모니터링합니다.

### 🔮 3. 2030 미래 예측 시뮬레이션
* **선형 회귀 통계 예측:** 최근 5개년 실제 환자 데이터를 기반으로 **선형 회귀(Linear Regression)** 예측 모델을 작동합니다.
* **시나리오별 예측:** 2025년부터 2030년까지의 발생률 및 치명률 추세를 **기본(Base)**, **낙관적(Optimistic)**, **비관적(Pessimistic)** 3대 가상 보건 시나리오로 분류하여 경영 보고 및 정책 수립에 활용할 수 있습니다.

---

## 🛠 기술 스택 (Technology Stack)

| 구분 | 사용 기술 및 도구 |
| :--- | :--- |
| **Backend** | Python 3.12, FastAPI (Uvicorn), Pandas, Numpy |
| **Database** | Google Cloud BigQuery API |
| **Frontend** | Modern Single Page Application (React Router 대응 지원) |
| **Deployment** | Google Cloud Platform (GCP) App Engine (Instance Class: F2) |

---

## 📁 프로젝트 폴더 구조 (Directory Structure)

* `backend/`: FastAPI 기반의 초고속 RESTful API 서버 소스 코드
* `frontend/`: 대시보드 화면 및 정적 웹 리소스 (빌드 파일은 `frontend/dist/`에 위치)
* `data/`: 프로젝트 보조 데이터 및 데이터셋 보관함
* `.venv/`: 패키지가 격리된 파이썬 가상환경
* `app.yaml`: Google App Engine 배포 사양 설정 파일
* `DEPLOY_GUIDE.md`: AI 및 관리자를 위한 절대 안전 배포 지침서
* `upload_to_bigquery.py`: 빅쿼리에 원시 통계 데이터를 적재하는 파이썬 유틸리티

---

## 💻 로컬 실행 방법 (How to Run Locally)

### 1. 가상환경 활성화 및 패키지 설치
이미 존재하는 `.venv` 격리 환경을 활성화한 뒤 필요한 패키지를 설치합니다.
```bash
# 가상환경 활성화 (Windows PowerShell 기준)
.venv\Scripts\Activate.ps1

# 라이브러리 설치
pip install -r requirements.txt
```

### 2. 백엔드 API 서버 실행
```bash
uvicorn backend.main:app --reload --port 8000
```
* 서버 기동 시 `http://127.0.0.1:8000/docs` 에서 대화식 API 문서(Swagger UI)를 바로 확인하실 수 있습니다.

---

## ☁️ 구글 클라우드 배포 (GCP Deployment)

안전한 서버 배포를 위해 반드시 **`DEPLOY_GUIDE.md`** 파일에 명시된 3단계 확인 수칙(프로젝트 매칭 -> 사용자 승인 -> 배포 강제 설정)을 먼저 정독하신 후 다음 명령어를 실행합니다.
```bash
gcloud app deploy
```

---

*본 프로그램은 뇌졸중 보건 보조 통계 및 병원 임상 지표 수립을 위해 개발된 의료 도구입니다.*
