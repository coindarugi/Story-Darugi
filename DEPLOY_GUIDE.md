# Cloudflare Pages 배포 가이드 (story-darugi.com)

이 문서는 `story-darugi.com` 도메인으로 이 블로그를 배포하고 연결하는 방법을 설명합니다.

## 1단계: GitHub에 코드 올리기

1.  GitHub에 로그인하고 새 리포지토리(예: `story-darugi`)를 생성합니다.
2.  아래 명령어로 코드를 푸시합니다.

```bash
# 이미 초기화되어 있다면
git remote add origin https://github.com/사용자명/story-darugi.git
git branch -M main
git push -u origin main
```

## 2단계: Cloudflare Pages 배포

1.  [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인합니다.
2.  **Workers & Pages** 메뉴로 이동합니다.
3.  **Create Application** > **Pages** > **Connect to Git**을 클릭합니다.
4.  방금 만든 GitHub 리포지토리를 선택합니다.
5.  **Build settings** (중요!):
    *   **Framework preset**: `None` (선택하지 않음) 또는 `Hono`가 있다면 선택
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
6.  **Environment Variables (환경 변수)** 설정:
    *   `ADMIN_USER`: 관리자 아이디 (예: admin)
    *   `ADMIN_PASSWORD`: 관리자 비밀번호
7.  **Save and Deploy**를 클릭합니다.

## 3단계: D1 데이터베이스 연결 (중요!)

배포가 완료되어도 데이터베이스가 없으면 에러가 납니다.

1.  Cloudflare 대시보드 > **Workers & Pages** > **D1** 메뉴로 이동합니다.
2.  **Create Database**를 클릭하고 이름을 `webapp-db`로 생성합니다.
3.  생성된 DB ID를 복사해둡니다.
4.  다시 **Pages** 프로젝트 설정으로 돌아갑니다.
5.  **Settings** > **Functions** > **D1 Database Bindings**로 이동합니다.
6.  **Variable name**에 `DB`라고 입력하고, 방금 만든 D1 데이터베이스를 선택합니다.
7.  **Save**를 누르고, **Deployments** 탭에서 **Retry deployment** (재배포)를 해야 적용됩니다.

## 4단계: 도메인 연결 (story-darugi.com)

1.  **Pages** 프로젝트 대시보드에서 **Custom domains** 탭을 클릭합니다.
2.  **Set up a custom domain** 버튼을 누릅니다.
3.  `story-darugi.com`을 입력하고 **Continue**를 누릅니다.
4.  Cloudflare가 안내하는 DNS 레코드(CNAME)를 도메인 구입처(가비아, 후이즈 등)에 설정하거나, 도메인 네임서버를 Cloudflare로 옮겼다면 자동으로 설정됩니다.
5.  **Activate domain**을 누르면 끝! (최대 24시간 소요될 수 있음)

## 5단계: SEO 확인

이미 코드에 SEO 최적화가 적용되어 있습니다.
- `https://story-darugi.com/sitemap.xml` 접속 확인
- `https://story-darugi.com/robots.txt` 접속 확인
- 카카오톡/페이스북에 링크 공유 시 썸네일과 설명이 잘 뜨는지 확인

## 운영 팁

- 글 쓰기 주소: `https://story-darugi.com/admin`
- 이미지는 글 작성 시 Markdown 문법으로 외부 링크를 넣어야 합니다. (Cloudflare R2를 연동하면 이미지 업로드 기능도 추가 가능)
