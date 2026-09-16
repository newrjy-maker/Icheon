# 이천 모험지도 기술 요구사항 정의서 (TRD)
상태: 완료

## 문서 기준

- 대상 문서: 완료된 PRD·FRD와 확정 디자인 8장
- 개발 형태: 1인·AI 보조 MVP, 모듈형 모놀리스
- 1차 완료 기준: 외부 계정 없이 내 컴퓨터의 localhost에서 전체 P0 루프 실행
- 배포: 로컬 완성 뒤 선택
- 비용 표기: 2026-09-16 공식 가격 기준, 미국 달러·세금·환율 별도

## ① 선택 기술 스택·이유·비교

### R1 선택 결과

**선택: A안 — Next.js App Router + TypeScript + PostgreSQL + Prisma**

- 화면과 서버를 같은 Next.js 프로젝트에서 운영하는 모듈형 모놀리스로 구성한다.
- 기능별 폴더는 분리하되 별도 서버나 마이크로서비스로 나누지 않는다.
- 현재 정적 HTML 디자인은 React 컴포넌트와 CSS 디자인 토큰으로 옮긴다.
- PostgreSQL 트랜잭션과 고유 제약으로 QR 중복 보상과 3/3 중복 해금을 막는다.
- 로컬 개발은 Docker Compose의 PostgreSQL을 사용하므로 외부 계정이 필요 없다.
- 선택 이메일은 로컬에서 발송 미리보기로 개발하고, 배포할 때만 Resend를 연결한다.

비용: 로컬 $0. 선택 배포 시 무료 한도를 먼저 쓸 수 있으나, 중단 없는 공개 운영 기준으로는 월 $45부터 예상한다. 선택 이메일은 Resend 무료 3,000건/월 한도부터 시작할 수 있다.

나중에 바꾸려면: Next.js 전체 교체는 어려움, Supabase에서 다른 PostgreSQL 서비스로 이동은 보통, 이메일 발송 업체 교체는 쉬움.

### 비교 기록

| 안 | 프론트엔드 | 백엔드 | 데이터베이스 | 로컬 월비용 | 선택 배포의 기본 월비용 | 학습 난이도 | 나중에 스택을 바꾸려면 |
|---|---|---|---|---:|---:|---|---|
| A 선택 | Next.js App Router + TypeScript | 같은 Next.js 프로젝트의 Route Handler·서버 서비스 | PostgreSQL + Prisma, 배포 시 Supabase DB | $0 | 개인 비상업 테스트는 무료 한도 검토, 안정 운영은 Vercel Pro $20 + Supabase Pro $25부터 | 중 | 어려움 |
| B | React/Vite + TypeScript | 같은 저장소의 Express API | PostgreSQL + Prisma, 배포 시 Render Postgres | $0 | 무료 테스트 가능, 유료 최소형은 Render 웹 $7 + DB $6부터 | 중상 | 보통 |
| C | Django 템플릿 + HTMX·필요한 JavaScript | 같은 Django 프로젝트의 서비스 계층 | PostgreSQL + Django ORM | $0 | 무료 테스트 가능, 유료 최소형은 Render 웹 $7 + DB $6부터 | 중 | 어려움 |

### 선택 이유

- 현재 HTML 디자인을 React 컴포넌트로 옮기면서 화면·API를 한 프로젝트에서 관리할 수 있다.
- QR 검증, 조각 지급, 3/3 완료, 다음 맵 해금을 서버에서 한 흐름으로 처리하기 좋다.
- PostgreSQL 트랜잭션과 고유 제약으로 중복 조각 지급을 막을 수 있다.
- TypeScript 한 언어로 화면과 서버를 함께 작성해 1인 유지보수 범위를 줄인다.
- 로컬에서는 모두 무료이며 Vercel·Supabase·Resend 계정은 배포 단계 전까지 필요 없다.

비용: 로컬 $0. 선택 배포 시 무료 한도를 먼저 쓸 수 있으나, 중단 없는 공개 운영 기준으로는 월 $45부터 예상한다. 선택 이메일은 Resend 무료 3,000건/월 한도부터 시작할 수 있다.

나중에 바꾸려면: 프론트엔드 프레임워크 전체 교체는 어려움, Supabase에서 다른 PostgreSQL 서비스로 이동은 보통, 이메일 발송 업체 교체는 쉬움.

### 후보별 판단 기록

- A안: 디자인 재현과 서버 기능의 균형이 가장 좋다. 한 저장소·한 언어라 AI 보조 개발에도 유리하다.
- B안: 구조가 명시적이지만 프론트와 API 연결·배포 설정이 늘어난다.
- C안: 데이터와 서버 규칙은 강하지만 현재 인터랙티브 모바일 디자인을 옮길 때 별도 JavaScript 작업이 많다.

## ② 시스템 구성도

아래 구성으로 최종 확정한다.

~~~mermaid
flowchart TB
    U[가족 사용자 모바일 브라우저]
    CAM[카메라 권한<br/>QR만 사용·GPS 없음]
    MAP[외부 지도 길찾기<br/>링크만 사용]

    subgraph APP[Next.js 모듈형 모놀리스]
        UI[App Router 화면<br/>인트로·계정·허브·장소·QR·MY]
        API[Route Handler<br/>입력검증·세션·속도제한]
        DOMAIN[도메인 서비스<br/>계정·콘텐츠·QR·진행·해금]
        JOB[운영 스크립트<br/>콘텐츠 검증·계정 삭제]
    end

    DB[(PostgreSQL<br/>Prisma 마이그레이션)]
    CONTENT[버전 관리 콘텐츠<br/>장소·맵·퀘스트 JSON]
    MAIL[선택 이메일 발송<br/>로컬 미리보기 / 배포 시 Resend]

    U --> UI
    U --> CAM
    UI --> API
    API --> DOMAIN
    DOMAIN --> DB
    CONTENT --> JOB
    JOB --> DB
    DOMAIN --> MAIL
    UI --> MAP
~~~

- 배포 전: 브라우저 + 로컬 Next.js + 로컬 PostgreSQL만으로 P0를 확인한다.
- 선택 배포 후: Next.js는 Vercel, PostgreSQL은 Supabase, 이메일은 Resend에 연결한다.
- 외부 지도는 API 키 없이 목적지 웹 링크를 여는 방식부터 시작한다.

나중에 바꾸려면: 모놀리스 내부 모듈 경계 변경은 보통, 프론트·백엔드 서버 분리는 어려움.

## ③ 데이터 모델

아래 데이터 모델로 최종 확정한다.

| 모델 | 핵심 필드·제약 | 용도 | 삭제·보존 |
|---|---|---|---|
| Account | id, loginIdDisplay, loginIdNormalized UNIQUE, status, createdAt | 아이디만 사용하는 계정 | 삭제 요청 즉시 비활성, 본 저장소 7일 이내 삭제 |
| Session | id, accountId, tokenHash UNIQUE, familyCondition JSON, expiresAt | 로그인과 세션 한정 가족 추천 조건 | 로그아웃·30일 만료 시 삭제 |
| RecoveryEmail | accountId UNIQUE, emailCiphertext, emailLookupHash, consentAt, verifiedAt | 선택 복구 이메일 | 계정과 함께 삭제 |
| OneTimeToken | purpose, accountId, tokenHash UNIQUE, expiresAt, usedAt | 이메일 인증·로그인·삭제 링크 | 사용 또는 만료 뒤 정리 |
| Place | name, address, category, operationStatus, facilities, sourceStatus | 장소 상세와 운영 상태 | 실제 삭제보다 비공개 처리 |
| SourceAudit | placeId, sourceName, checkedAt, reviewNote | 출처·확인일·검수 근거 | 변경 이력 보존 |
| Quest | placeId, title, mission, status, durationMinutes | 5~15분 현장 미션 | 비활성화 |
| QRMarker | questId, tokenHash UNIQUE, status, expiresAt, rotatedAt | 불투명 QR 검증 | 원문 미저장, 교체·폐기 상태 보존 |
| MapZone | theme, direction, status, badges, totalMinutes, difficulty | 호법JC 4방 지역 맵 | 비공개 처리 |
| MapQuest | mapZoneId, questId, recommendedSequence 1~3 | 정확히 3개 권장 순서 | 맵별 recommendedSequence UNIQUE, 퀘스트 중복 금지 |
| MapConnection | sourceMapId UNIQUE, targetMapId, driveMinutes | 3/3 뒤 열릴 30분+ 맵 | 검수 실패 시 비활성 |
| UserQuestProgress | accountId, questId, mapZoneId, completedAt | QR 완료 기록 | accountId+questId UNIQUE |
| UserMapProgress | accountId, mapZoneId, status, pieceCount, startedAt, completedAt, unlockedAt | 0/3~3/3 및 이어하기 | accountId+mapZoneId UNIQUE |
| AggregateMetric | date, mapZoneId, metricType, count | 노출·시작·완료 집계 | 사용자 식별자 없이 기간 후 삭제 |
| ContentRelease | version, checksum, publishedAt | 어떤 콘텐츠 묶음이 공개됐는지 기록 | 배포 추적용 보존 |

### 데이터·보안 규칙

1. 아이디는 앞뒤 공백 제거 → Unicode NFKC 정규화 → 영문 소문자화 값을 중복 비교에 쓴다.
2. 표시용 아이디는 별도로 보존하고 4~20자의 한글·영문·숫자·밑줄·하이픈만 허용한다.
3. 이메일·전화번호처럼 보이는 문자열은 가입 아이디로 차단한다.
4. 세션 쿠키는 Secure·HttpOnly·SameSite=Lax이며 무작위 토큰 원문은 브라우저에만, 서버에는 해시만 저장한다.
5. 세션은 마지막 사용 기준 30일이며 로그아웃·삭제 요청 시 즉시 폐기한다.
6. 선택 이메일은 AES-256-GCM으로 암호화하고 중복 확인용 별도 HMAC 해시만 저장한다.
7. 삭제 코드는 읽기 쉬운 16자 난수로 한 번만 보여주고 Argon2id 해시만 저장한다.
8. QR 원문 토큰은 데이터베이스와 Git에 저장하지 않고 SHA-256 해시만 저장한다.
9. QR 성공 API는 요청별 idempotencyKey와 데이터베이스 고유 제약을 함께 사용한다.
10. 퀘스트 완료·조각 증가·3/3 완료·다음 맵 해금은 하나의 PostgreSQL 트랜잭션으로 처리한다.
11. 가족 추천 조건은 Session에만 저장하고 로그아웃·만료 시 함께 삭제한다.
12. 로그인·복구 요청 제한에는 원본 IP를 저장하지 않고 짧은 기간만 유효한 HMAC 키를 사용한다.
13. 집계 지표는 일자·맵·유형별 숫자만 올리고 개인별 이벤트·QR 실패 이력은 남기지 않는다.

나중에 바꾸려면: 아이디 정규화·핵심 키·진행 고유 제약은 어려움, 세션 만료기간은 쉬움, 이메일 암호화 키 교체는 보통.

## ④ 폴더 구조

최종 확정 구조:

~~~text
/
├─ app/
│  ├─ (public)/                 # 인트로·아이디 시작
│  ├─ (journey)/                # 허브·장소·QR·해금·MY
│  └─ api/                      # 공개 API 진입점
├─ src/
│  ├─ features/
│  │  ├─ account/               # 아이디·세션·복구·삭제
│  │  ├─ journey-map/           # 4방 허브·추천·코스
│  │  ├─ place/                 # 장소 상세·운영 상태
│  │  ├─ quest/                 # 미션·순서
│  │  ├─ qr-verification/       # 토큰·멱등·오류 상태
│  │  ├─ progress/              # 조각·완료·해금·이어하기
│  │  ├─ content-release/       # 배포 데이터 검증·공개
│  │  └─ metrics/               # 비식별 집계
│  ├─ components/               # 48dp 공통 UI
│  ├─ styles/                   # 디자인 토큰·접근성·모션
│  └─ lib/                      # DB·암호화·메일·속도 제한
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ content/                     # 버전 관리 장소·맵·퀘스트 JSON
├─ scripts/                     # validate·import·QR 발급·계정 정리
├─ public/                      # 검수된 이미지·퍼즐 자산
└─ tests/                       # 단위·통합·Playwright 브라우저 테스트
~~~

- 각 기능 폴더 안에서 UI, schema, server, repository를 나누고 다른 기능의 내부 파일을 직접 참조하지 않는다.
- 공개 콘텐츠와 QR 상태 메타데이터는 Git에 두되 QR 원문·이메일·비밀키는 절대 커밋하지 않는다.
- QR 인쇄용 원문 파일은 Git 밖의 로컬 private-output 폴더로 한 번만 생성한다.

나중에 바꾸려면: 기능 폴더 내부 재배치는 쉬움, 모놀리스를 여러 서버로 분리하는 것은 어려움.

## ⑤ 실행·배포

### 1단계: localhost 완성

1. Node.js LTS와 Docker Desktop을 설치한다.
2. 저장소에서 npm install을 실행한다.
3. docker compose up -d db로 로컬 PostgreSQL을 시작한다.
4. 예시 환경변수를 복사하고 로컬 비밀키를 생성한다.
5. Prisma 마이그레이션과 콘텐츠 검증·입력을 실행한다.
6. npm run dev 뒤 localhost에서 전체 P0 루프를 시험한다.
7. Playwright로 아이디 가입·3개 QR·3/3 해금·재로그인을 자동 확인한다.

로컬 이메일 인증은 실제 전송 대신 개발 화면 또는 터미널에서 일회용 링크를 확인한다. 따라서 이 단계에는 Vercel·Supabase·Resend 계정이 필요 없다.

### 2단계: 선택 배포

- Next.js: Vercel
- PostgreSQL: Supabase
- 선택 복구 이메일: Resend
- 자산: MVP는 Next.js public 폴더, 용량 증가 시 객체 저장소로 이동
- 계정 삭제 정리: 배포 플랫폼의 예약 호출과 보호된 정리 API 사용
- 운영 데이터: content JSON 변경 → 자동 검증 → 데이터베이스 반영 → 공개

배포는 localhost 검증이 끝난 뒤 사용자가 원할 때만 진행한다.

나중에 바꾸려면: Vercel에서 다른 Node 호스팅으로 이동은 보통, Supabase에서 다른 PostgreSQL로 이동은 보통.

## ⑥ 월 비용·무료 한도·유료 전환

| 단계 | 구성 | 월 예상 | 유료 전환 기준 |
|---|---|---:|---|
| 로컬 개발 | Next.js + Docker PostgreSQL + 메일 미리보기 | $0 | 전환 불필요 |
| 개인 비상업 공개 테스트 | Vercel Hobby + Supabase Free + Resend Free | $0 가능 | 각 서비스 약관·한도와 DB 일시중지 허용 시 |
| 안정 공개 운영 | Vercel Pro + Supabase Pro + Resend Free | $45부터 | 상시 접속, DB 자동 백업, 운영 지원이 필요할 때 |
| 이메일 증가 | 위 구성 + Resend Pro | $65부터 | 월 3,000건 또는 일 100건을 넘을 때 |

- Supabase Free: 데이터베이스 500MB, 2개 무료 프로젝트, 1주 미사용 시 일시 중지 가능
- Supabase Pro: $25/월부터, 첫 프로젝트와 일일 백업 7일 포함
- Vercel Hobby: 개인 비상업 프로젝트용이므로 일반 공개 범위가 커지면 약관을 다시 확인한다.
- Vercel Pro: 팀원 1명 기준 $20/월부터
- Resend Free: 월 3,000건·일 100건
- 도메인 구매비, 부가세, 환율, 초과 트래픽은 별도다.

나중에 바꾸려면: 무료→유료 전환은 쉬움, 서비스 공급자 전체 이전은 보통.

## ⑦ 나중에 바꾸기 어려운 결정

| 결정 | 난이도 | 지금 고정하는 이유 |
|---|---|---|
| Next.js 모듈형 모놀리스 | 어려움 | 화면·서버 코드와 배포 방식 전체에 영향을 준다. |
| PostgreSQL 관계·고유 키 | 어려움 | QR 중복 방지와 진행 복원의 기준이다. |
| 아이디 NFKC·소문자 정규화 | 어려움 | 나중에 바꾸면 기존 아이디가 충돌할 수 있다. |
| 아이디만으로 로그인 | 어려움 | 보안 수준과 사용자 안내 전체에 영향을 준다. |
| QR 완료 트랜잭션 경계 | 어려움 | 완료·조각·해금의 불일치를 막아야 한다. |
| 선택 이메일 암호화 방식 | 보통 | 키 순환과 기존 데이터 재암호화가 필요하다. |
| 세션 30일·속도 제한 수치 | 쉬움 | 설정값과 운영 관찰로 조정할 수 있다. |
| Vercel·Supabase·Resend | 보통 | 표준 Node·PostgreSQL 경계를 유지하면 이전 가능하다. |
| 외부 지도 링크 | 쉬움 | 링크 생성 어댑터만 교체하면 된다. |

### 최종 확정 가정

- 아이디 허용 길이는 4~20자다.
- 아이디는 한글·영문·숫자·밑줄·하이픈을 허용한다.
- 로그인 세션은 마지막 사용 후 30일 유지한다.
- 복구 이메일은 암호화 저장하고 동의·인증 시각을 남긴다.
- QR 원문은 인쇄 때만 한 번 생성하고 서버에는 해시만 저장한다.
- 로컬 PostgreSQL은 Docker Compose로 실행한다.
- 첫 배포 대상은 Vercel + Supabase + Resend다.

### 최종 확정 요약

- 범위: Next.js 모듈형 모놀리스, PostgreSQL, Prisma, P0 계정·허브·장소·QR·조각·해금·이어하기, 버전 관리 콘텐츠 운영
- 비용: localhost $0, 개인 비상업 공개 테스트 $0 가능, 안정 공개 운영 월 $45부터
- 외부 서비스: 배포를 선택할 때만 Vercel·Supabase·Resend를 사용하며 외부 지도는 링크 방식으로 연결
- 권한: QR 버튼을 누를 때만 카메라 권한을 요청하고 GPS·위치 권한은 요청하지 않음
- 개인정보: 필수값은 서비스 아이디뿐이며 선택 이메일은 동의 후 암호화 저장

## 참고한 공식 자료

- Next.js App Router: https://nextjs.org/docs/app
- Vercel 요금: https://vercel.com/pricing
- Supabase 요금: https://supabase.com/pricing
- Resend 요금: https://resend.com/pricing
- Render 요금: https://render.com/pricing
