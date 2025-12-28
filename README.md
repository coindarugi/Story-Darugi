# 초고속 Cloudflare 블로그 (Hono + D1)

워드프레스보다 가볍고 빠른, 애드센스 최적화 블로그입니다.
Cloudflare Pages와 D1(데이터베이스)을 사용하여 **평생 무료**로 운영 가능합니다.

## 🚀 기능
- **초고속 로딩**: Cloudflare Edge 네트워크에서 실행 (SEO 점수 UP!)
- **깔끔한 디자인**: TailwindCSS 적용 (모바일 최적화)
- **관리자 페이지**: `/admin`에서 글 작성/수정/삭제 가능 (Markdown 지원)
- **애드센스 준비**: 필수 페이지(개인정보처리방침) 및 광고 영역 배치 완료

## 🛠 사용 방법

### 1. 로컬 개발 (내 컴퓨터에서 실행)
```bash
# 의존성 설치
npm install

# 데이터베이스 생성 (최초 1회)
npm run db:migrate

# 서버 실행 (미리보기)
npm run preview
```
서버가 켜지면 `http://localhost:3000` (또는 3001) 접속.

### 2. 관리자 접속
- 주소: `/admin`
- 기본 아이디: `admin`
- 기본 비번: `secret`
- (변경하려면 `.dev.vars` 파일 수정 및 Cloudflare 배포 시 환경변수 설정 필요)

### 3. 배포하기 (Cloudflare)
1. GitHub에 이 코드를 올립니다.
2. Cloudflare Dashboard > Workers & Pages > Create Application > Connect to Git.
3. 설정:
   - Framework Preset: `None` (또는 Hono)
   - Build Command: `npm run build`
   - Build Output Directory: `dist`
4. **중요: D1 데이터베이스 연결**
   - Cloudflare 대시보드에서 D1 데이터베이스 생성 (`webapp-db`)
   - Settings > Functions > D1 Database Bindings에서 변수명 `DB`로 연결.
5. **환경변수 설정** (Settings > Environment Variables)
   - `ADMIN_USER`: 원하는 아이디
   - `ADMIN_PASSWORD`: 원하는 비밀번호

## 📝 글 쓰는 법
`/admin` 접속 후 'New Post' 클릭.
Markdown 문법을 지원합니다.
- `**굵게**` -> **굵게**
- `# 제목` -> 제목
- `[링크](https://...)` -> 링크

## 💰 애드센스 팁
- 글은 최소 10~20개 정도 작성 후 신청하세요.
- `/policy` 페이지(개인정보처리방침) 내용을 본인 사이트에 맞게 꼭 수정하세요.
- `src/index.tsx` 파일 내 `[AdSense Area]` 주석 부분에 광고 코드를 넣으면 됩니다.
