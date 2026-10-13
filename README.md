# hanbando-site
한반도문화예술협회 홈페이지

## 내용 편집 (admin.html)

### 사이트에서 바로 편집하기 (추천)
1. https://hanbandoart.co.kr/admin.html 을 열면 편집 화면이 나옵니다.
2. 내용을 고친 뒤 위쪽 [사이트에 저장]을 누릅니다. 1~2분 뒤 사이트에 반영됩니다.
3. 처음 저장할 때만 GitHub 저장소 이름과 토큰을 묻습니다. [기억하기]를 켜 두면 다음부터는 묻지 않습니다.
   - 토큰 만들기: GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token
   - Repository access: 이 저장소만 선택 / Permissions → Contents: Read and write
- js/admin.js 안의 SITE_REPO 값(green908757-wq/hanbando-site)이 연결 창에 미리 채워집니다.
- 내용 파일(data/site-data.js)과 새로 고른 사진이 한 번의 기록(커밋)으로 올라가므로, 예전 내용으로 언제든 되돌릴 수 있습니다.
- 저장 후 편집기가 실제 사이트에 반영됐는지 자동으로 확인해 알려 줍니다. 5분이 지나도 반영되지 않으면 Actions 탭과 Settings → Pages 를 확인하세요.
- 공용 컴퓨터에서는 [기억하기]를 끄거나, 다 쓴 뒤 왼쪽 아래 [연결 끊기]를 누르세요.
- 토큰은 브라우저에만 보관되며 사이트 파일에는 들어 있지 않습니다.

### 컴퓨터 폴더로 편집하기
크롬이나 엣지로 admin.html 을 열고 위쪽 [컴퓨터 폴더로 저장 ▾] → [사이트 폴더 연결] → [폴더에 저장]을 누릅니다.
다른 브라우저는 [바뀐 파일 내려받기(zip)]로 받은 뒤 GitHub 저장소의 [Add file] → [Upload files]에 압축 푼 내용을 끌어다 놓고 [Commit changes]를 누릅니다.

### 캐시(옛 화면이 계속 보이는 문제)
- 내용 파일(data/site-data.js)은 열 때마다 새로 받아 오므로 저장 내용이 바로 보입니다.
- css·js 파일을 직접 고쳤다면 js/boot.js 의 VERSION 숫자와 HTML 의 ?v= 숫자를 함께 바꾸세요.
- HTML 파일 자체는 GitHub Pages 가 최대 10분 동안 캐시합니다. 바로 확인하려면 Ctrl+F5(맥은 Cmd+Shift+R)를 누르세요.
