# 모두의 게시판

Node.js, Express, PostgreSQL로 만든 회원제 게시판입니다. 회원가입과 로그인, 게시글 읽기·쓰기·수정·삭제 기능을 제공합니다. 수정과 삭제는 작성자만 할 수 있습니다.

## 실행 방법

### 1. PostgreSQL 데이터베이스 만들기

PostgreSQL에서 빈 데이터베이스를 만듭니다.

```sql
CREATE DATABASE board;
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env` 파일을 만들고 실제 PostgreSQL 접속 정보와 충분히 긴 임의의 세션 비밀키를 입력합니다.

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/board
SESSION_SECRET=replace-with-a-long-random-string
NODE_ENV=development
```

### 3. 설치 및 실행

```bash
npm install
npm run db:init
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 주요 기능

- 안전한 비밀번호 해시 저장(bcrypt)
- PostgreSQL 기반 로그인 세션
- CSRF 방어, 보안 헤더, 매개변수화된 SQL
- 게시글 작성자 권한 검사
- 모바일 대응 화면
- 한국 시간 기준 날짜 표시

## 구조

```text
src/
  app.js              Express 앱 진입점
  db.js               PostgreSQL 연결
  routes/              인증 및 게시글 라우트
  middleware/          로그인 및 CSRF 검사
  views/               EJS 화면
  public/              스타일시트
sql/schema.sql         테이블 정의
scripts/init-db.js     DB 초기화 스크립트
```
