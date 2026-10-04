# 배포 가이드

## 1단계: 청첩장 정보 입력

`public/index.html` 에서 `<!-- TODO -->` 항목 수정:

| 항목 | 위치 |
|------|------|
| 브라우저 탭 제목 | `<title>` |
| 신랑/신부 이름 | `.hero-names`, `.family-info` |
| 결혼식 날짜/시간 | `.hero-date`, `.venue-date` |
| 예식장 이름/주소 | `.venue-name`, `.venue-address` |
| 부모님 이름 | `.family-info` |
| 지도 링크 | `href` of `.btn-kakao`, `.btn-naver` |
| 구글 캘린더 링크 | `href` of `.btn-gcal` (날짜 UTC 변환 주의) |

`public/main.js` 상단의 `weddingDate` 를 실제 날짜로 수정:
```js
const weddingDate = new Date(2027, 0, 1, 13, 0, 0); // (year, month-1, day, hour, min, sec)
```

## 2단계: 사진 추가

```
public/images/main.jpg          ← 헤더 배경 (세로 사진 권장, 1MB 이하)
public/images/gallery/01.jpg
public/images/gallery/02.jpg
...
```

사진 개수 바뀌면 `index.html` 의 `.gallery` 안 `<div class="gallery-item">` 개수 맞게 수정.

파일 크기 줄이기: https://squoosh.app

## 3단계: Cloudflare 계정 & Wrangler 로그인

```bash
npm install -g wrangler
wrangler login      # 브라우저에서 승인
```

## 4단계: D1 DB 생성

```bash
cd /Users/kakaocommerce/Desktop/wedding
wrangler d1 create wedding-db
```

출력된 `database_id` 를 `wrangler.toml` 의 `REPLACE_AFTER_D1_CREATE` 자리에 입력.

```bash
# 프로덕션 DB에 테이블 생성
wrangler d1 execute wedding-db --file=schema.sql
```

## 5단계: GitHub 레포 생성 & 푸시

GitHub (github.com) 에서 새 레포 생성 (이름 예: `wedding`).

```bash
cd /Users/kakaocommerce/Desktop/wedding
git remote add origin https://github.com/YOUR_USERNAME/wedding.git
git push -u origin master
```

## 6단계: Cloudflare Pages 연동

1. https://dash.cloudflare.com → **Workers & Pages** → **Create**
2. **Connect to Git** → GitHub 레포 선택
3. 빌드 설정:
   - Build command: *(비워둠)*
   - Build output directory: `public`
4. **Save and Deploy**
5. 배포 완료 후 URL 확인: `your-project.pages.dev`

## 7단계: D1 바인딩 설정

Pages 프로젝트 → **Settings** → **Functions** → **D1 database bindings**:
- Variable name: `DB`
- D1 database: `wedding-db`

저장 후 재배포:
```bash
git commit --allow-empty -m "trigger: D1 바인딩 후 재배포"
git push
```

## 8단계: QR 코드 생성

배포 URL 확정 후:
1. https://qr.io 또는 https://www.qrcode-monkey.com 접속
2. `https://your-project.pages.dev` 입력
3. PNG 다운로드 (300dpi 이상, 실물 인쇄용)

## 이후 수정 방법

파일 수정 → `git add . && git commit -m "수정 내용" && git push` → Pages 자동 배포.

## 구글 캘린더 링크 날짜 변환

KST(한국 시간)는 UTC+9이므로:
- 13:00 KST → 04:00 UTC → `T040000Z`
- 15:00 KST 종료 → 06:00 UTC → `T060000Z`

형식: `20270101T040000Z/20270101T060000Z`
