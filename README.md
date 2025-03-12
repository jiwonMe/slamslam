# SlamSlam - 파티룸 플레이리스트

파티룸에서 여러 사람이 함께 플레이리스트를 만들고 관리할 수 있는 웹 애플리케이션입니다. 유튜브 링크를 추가하고, 순서를 변경하고, 재생할 수 있습니다.

## 주요 기능

- 유튜브 링크 추가
- 플레이리스트 순서 변경 (드래그 앤 드롭)
- 노래 삭제
- 재생 제어 (재생/일시정지, 다음 곡)
- 디스플레이 모드 (파티룸 대형 화면용)
- 실시간 동기화 (Supabase Realtime)

## 기술 스택

- **프론트엔드**: Next.js, TypeScript, MUI (Material-UI)
- **백엔드**: Next.js API Routes
- **데이터베이스**: Supabase
- **패키지 관리**: pnpm
- **배포**: Vercel

## 설치 및 실행 방법

### 사전 요구사항

- Node.js 18 이상
- pnpm
- Supabase 계정
- YouTube Data API v3 API 키

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
YOUTUBE_API_KEY=your-youtube-api-key
```

### Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. 다음 SQL 쿼리를 실행하여 필요한 테이블을 생성합니다:

```sql
CREATE TABLE playlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  duration TEXT NOT NULL,
  addedAt BIGINT NOT NULL,
  addedBy TEXT DEFAULT '익명',
  "order" INTEGER
);

-- 실시간 업데이트를 위한 설정
ALTER TABLE playlist ENABLE REALTIME;
```

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start
```

## 배포

이 프로젝트는 Vercel에 쉽게 배포할 수 있습니다:

1. GitHub에 프로젝트를 푸시합니다.
2. Vercel에서 새 프로젝트를 생성하고 GitHub 저장소를 연결합니다.
3. 환경 변수를 설정합니다.
4. 배포합니다.

## 사용 방법

1. 파티룸의 메인 디스플레이 장치(노트북, PC 등)에서 브라우저를 열고 이 웹사이트에 접속합니다.
2. 디스플레이 모드로 전환하여 전체 화면으로 표시합니다.
3. 참가자들은 각자의 모바일 기기나 노트북에서 같은 웹사이트에 접속하여 플레이리스트에 노래를 추가할 수 있습니다.
4. 모든 변경사항은 실시간으로 동기화됩니다.

## 라이선스

MIT
