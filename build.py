#!/usr/bin/env python3
"""8개 페이지를 공통 헤더/푸터로 생성하는 빌드 스크립트 (결과물은 순수 정적 HTML)."""
from pathlib import Path

OUT = Path(__file__).resolve().parent

NAV = [
    ("greeting.html", "협회소개", "about"),
    ("awards.html", "수상작", "awards"),
    ("artists.html", "초대작가", "artists"),
    ("notice.html", "공지사항", "notice"),
]

def head(title, desc):
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
"""

def header(active):
    items = "\n".join(
        f'        <li><a href="{href}"{" aria-current=\"page\"" if key == active else ""}>{label}</a></li>'
        for href, label, key in NAV
    )
    return f"""<header class="site-header">
  <div class="container">
    <a class="logo" href="index.html" aria-label="(사)한반도문화예술협회 홈">
      <img src="images/19-image1/한반도 로고.jpg" alt="(사)한반도문화예술협회">
    </a>
    <nav class="gnb" aria-label="주 메뉴">
      <ul>
{items}
      </ul>
    </nav>
  </div>
</header>
"""

FOOTER = """<footer class="site-footer">
  <div class="container">
    <strong>(사)한반도문화예술협회</strong>
    <address>
      <span>주소: 강원특별자치도 원주시 강변로 525 (평원동)</span>
      <span>E-mail. <a href="mailto:greencomm@hanmail.net">greencomm@hanmail.net</a></span>
      <span>Tel. <a href="tel:07086219936">070-8621-9936</a></span>
    </address>
    <hr>
    <small>© 2026 (사)한반도문화예술협회. All rights reserved.</small>
  </div>
</footer>
<script src="js/main.js"></script>
</body>
</html>
"""

def year_tabs(page):
    # page: 제19회를 눌렀을 때 이동할 페이지
    tabs = [f'<a href="{page}" class="is-current" aria-current="true">제19회</a>']
    tabs += [f'<span aria-disabled="true" title="준비 중">제{n}회</span>' for n in range(20, 26)]
    return '<nav class="year-tabs" aria-label="회차 선택">\n      ' + "\n      ".join(tabs) + "\n    </nav>"

LAUREL = '<img class="laurel" src="images/19-image1/wgs2.png" alt="">'

CHEVRON_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.83 19a1 1 0 0 1-.78-.37l-4.83-6a1 1 0 0 1 0-1.27l5-6a1 1 0 0 1 1.54 1.28L10.29 12l4.32 5.36A1 1 0 0 1 13.83 19z"/></svg>'
CHEVRON_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 19a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41L13.71 12 9.39 6.63a1 1 0 0 1 .15-1.41 1 1 0 0 1 1.46.15l4.83 6a1 1 0 0 1 0 1.27l-5 6A1 1 0 0 1 10 19z"/></svg>'

def slider(slides_html, label, extra_class=""):
    return f"""<div class="slider {extra_class}" data-slider role="region" aria-roledescription="carousel" aria-label="{label}" tabindex="0">
        <div class="slider-track">
{slides_html}
        </div>
        <button class="slider-btn prev" type="button" aria-label="이전 작품">{CHEVRON_L}</button>
        <button class="slider-btn next" type="button" aria-label="다음 작품">{CHEVRON_R}</button>
        <div class="slider-dots"></div>
      </div>"""

def empty_slide(text, sid=""):
    id_attr = f' id="{sid}"' if sid else ""
    return f'          <div class="slide empty"{id_attr}><p>{text}</p></div>'

# ------------------------------------------------------------------ Desktop 1
def page_index():
    heroes = [
        ("hero-1.png", "종합대상 작품"), ("hero-2.png", "현대한국화 작품"),
        ("hero-3.png", "문인화 작품"), ("hero-4.png", "민화 작품"), ("hero-5.png", "한국화 작품"),
    ]
    strip = "\n".join(f'    <div class="ph"><img src="images/{f}" alt="{a}"></div>' for f, a in heroes)
    return head("(사)한반도문화예술협회", "초대작가 등용문 - 한반도문화예술협회") + header("") + f"""<main>
  <section class="hero-strip" aria-label="수상 작품">
{strip}
  </section>

  <section class="intro-band">
    <h1>초대작가 등용문 - 한반도문화예술협회</h1>
    <p lang="en">A Stepping Stone to Becoming an<br>Invited Artist in Korean Art</p>
  </section>

  <section class="statement">
    <p>(사)한반도문화예술협회는<br>오랜 역사와 풍부한 문화유산을 바탕으로<br>우리의 예술은 시대의 정신을 담아내며<br>새로운 창조의 길을 열어갑니다.</p>
    <p class="en" lang="en">Building upon a rich history and<br>cultural heritage, our art reflects the spirit<br>of the age and paves the way<br>for new creative endeavors.</p>
    <div class="mark"><img src="images/19-image1/mark.png" alt=""></div>
  </section>
</main>
""" + FOOTER

# ------------------------------------------------------------------ Desktop 2
def page_greeting():
    return head("인사말 | (사)한반도문화예술협회", "(사)한반도문화예술협회 이사장 인사말") + header("about") + """<div class="title-bar">
  <div class="container" style="max-width:calc(1142px + 40px)"><h1>인사말</h1></div>
</div>
<main>
  <section class="container greeting">
    <div class="text">
      <p>(사)한반도문화예술협회는<br>
      오늘 우리는 한국미술의 전통과 현대, 그리고 미래가 만나는<br>
      오랜 역사와 풍부한 문화유산을 바탕으로 우리의 예술은 시대의<br>
      정신을 담아내며 새로운 창조의 길을 열어갑니다.<br>
      예술가들이 자신들만이 개성과 철학을 자유롭게 표현하고<br>
      서로의 열정을 교류하며, 더 나아가 한국미술의 세계적 위상을<br>
      함께 높여가는 장이 될것입니다.</p>
      <p lang="en">Today, we gather at the intersection of Korean art's tradition,
      present, and future. Grounded in a rich history and
      cultural heritage, our art embodies the spirit of the times
      and opens new pathways of creation. This space will serve as a
      platform where artists can freely express their unique
      individuality and philosophy, exchange mutual passions, and
      collectively elevate the global stature of Korean art.</p>
      <p class="sign">(사)한반도문화예술협회 <span>이사장</span> <span>최 운 기</span></p>
    </div>
    <div class="portrait ph"><img src="images/choi-portrait.png" alt="이사장 최운기"></div>
  </section>

  <section class="feature-work">
    <figure class="container">
      <div class="ph"><img src="images/choi-painting.png" alt="목정 최운기 작 진공대사 상"></div>
      <figcaption>
        <p class="name">목정 최 운 기</p>
        <p class="name" lang="en">Mokjeong Choi Un-gi</p>
        <p class="meta">진공대사 상 (2026)<br>70x100cm</p>
      </figcaption>
    </figure>
  </section>

  <section class="container contest">
    <div class="about">
      <h2>한반도미술대전</h2>
      <p class="lead">국,내외에서 창작활동을 하고 있는 <br>창의력 있고 높은 기량을 가진 신진작가 <br>등용문 역할을 하고있는 공모전입니다.</p>
      <p class="en" lang="en">This design competition serves as a gateway for emerging artists—both domestic and international—who possess exceptional creativity and outstanding craftsmanship</p>
      <div class="fields">
        <h3>출품부문</h3>
        <p>한국화, 민화, 서양화, 서예, 문인화, 공예<br>서각, 섬유아트, 캐리그라피, 불화, 사진<br>보테니칼아트, 조각, 궁중회화</p>
      </div>
    </div>
    <div class="board">
      <h2>제19회 한반도미술대전<br>운영위원 및 심사위원</h2>
      <h3>운영위원</h3>
      <ul>
        <li>이사장 : 최운기</li>
        <li>사무국장 : 강민희</li>
        <li>운영위원장 : 최가림</li>
        <li>심사위원장 : 이충길</li>
      </ul>
      <h3>심사위원</h3>
      <ul>
        <li>한문서예 심사위원 : 최운기</li>
        <li>한글서예 심사위원 : 최유진</li>
        <li>문인화 심사위원 : 박채성, 최유진</li>
        <li>섬유아트 심사위원 : 최가림, 최희규</li>
        <li>서양화 심사위원 : 이영란</li>
        <li>한국화 심사위원 : 최유진</li>
        <li>서각 심사위원 : 유영남, 심종보, 성기태</li>
        <li>민화 심사위원 : 이충길</li>
      </ul>
    </div>
  </section>
</main>
""" + FOOTER

# ------------------------------------------------------------------ Desktop 3
def page_awards():
    prizes = [
        ("awards-works.html#overall", "종합대상"), ("awards-works.html#grand-prize", "부문대상"), None,
        ("awards-works.html#prize-best", "최우수상"), ("awards-works.html#prize-excellent", "우수상"), None,
        ("awards-works.html#prize-encouragement", "장려상"), ("awards-works.html#prize-samchae", "삼채상"), ("awards-works.html#prize-ochae", "오채상"),
        ("awards-works.html#special", "특선"), ("awards-works.html#selected", "입선"),
    ]
    grid = "\n".join(
        '          <span class="gap" aria-hidden="true"></span>' if p is None
        else f'          <a href="{p[0]}">{p[1]}</a>' for p in prizes
    )
    return head("수상작 | (사)한반도문화예술협회", "2026 제19회 한반도미술대전 수상작") + header("awards") + f"""<section class="title-band">
  <div class="container">
    <h1>한반도미술대전 수상작</h1>
    {year_tabs("awards-works.html")}
  </div>
</section>
<main class="container awards-main">
  <div class="award-bar d-only">{LAUREL}<h2>종합대상</h2></div>

  <article class="grand" aria-labelledby="grand-title">
    <div class="grand-m-head m-only">
      <p>2026 제19회 한반도미술대전</p>
      <p class="t"><b>종합대상</b> 섬유아트</p>
    </div>
    <div class="ph"><img src="images/shin-grand.png" alt="신인숙 작 소나무 벽걸이"></div>
    <div class="info">
      <p class="edition d-only">2026<br>제19회 한반도미술대전</p>
      <div class="badge d-only"><img src="images/19-image1/wgs2.png" alt=""><span>종합대상</span></div>
      <p class="prize d-only" lang="en">Grand Prize - Textile &amp; Fiber Art</p>
      <h2 class="artist" id="grand-title">신 인 숙 <span lang="en">Shin In-sook</span></h2>
      <p class="work">섬유아트 : 소나무 벽걸이</p>
    </div>
  </article>

  <section class="categories" aria-labelledby="cat-title">
    <p class="lead"><span class="hl">한반도 문화예술협회</span>는 국,내외에서 창작활동을 하고 있는 창의력 있고 <br>높은 기량을 가진 신진작가 등용문 역할을 하고있는 <span class="hl">한반도미술대전</span>입니다.</p>
    <div class="body">
      <h2 class="quote-title" id="cat-title">부문출품 수상</h2>
      <nav class="prize-grid" aria-label="수상 구분">
{grid}
      </nav>
    </div>
  </section>
</main>
""" + FOOTER

# ------------------------------------------------------------------ Desktop 4
GRAND_PRIZES = [
    ("한국화", "Grand Prize in Korean Painting", "김 기 선", "Kim gi-sun", "한국화 : 소나무와 학 (학의 정원)", "award-korean.png"),
    ("현대한국화", "Grand Prize in Contemporary Korean Painting", "황다미자", "Hwang Da-mi-ja", "현대한국화 : 여백에 핀 꽃", "award-modern.png"),
    ("문인화", "Grand Prize in Literary Artist Painting", "정 차 희", "Jeong Cha-hee", "문인화 : 묵죽", "award-literati.png"),
    ("민화", "Grand Prize in Minhwa", "최 영 순", "Choi Young-soon", "민화 : 파초도", "award-minhwa.png"),
    ("서각", "Grand Prize in Seogak", "강 신 도", "Kang Shin-do", "서각 : 가시리", "award-seogak.png"),
    ("섬유아트", "Grand Prize in Textile &amp; Fiber Art", "손 소 자", "Son So-ja", "섬유아트 : 야생화 벽걸이", "award-textile.png"),
]

def grand_slide(cat, prize, ko, en, work, img):
    return f"""          <figure class="slide">
            <div class="art"><div class="ph"><img src="images/{img}" alt="{ko.replace(' ', '')} 작 {work.split(' : ')[1]}"></div></div>
            <figcaption class="caption">
              <p class="cat"><span class="m-only">부문대상 </span><b>{cat}</b> <i>ㅣ</i> <b>대상</b></p>
              <p class="prize" lang="en">{prize}</p>
              <p class="artist">{ko} <span lang="en">{en}</span></p>
              <p class="work">{work}</p>
            </figcaption>
          </figure>"""

def page_awards_works():
    overall = """          <figure class="slide">
            <div class="art"><div class="ph"><img src="images/19-image2/01대상.jpg" alt="신인숙 작 소나무 벽걸이"></div></div>
            <figcaption class="caption">
              <p class="cat"><span class="m-only">종합대상 </span><b>섬유아트</b> <i>ㅣ</i> <b class="d-only">종합대상</b></p>
              <p class="prize" lang="en">Grand Prize - Textile &amp; Fiber Art</p>
              <p class="artist">신 인 숙 <span lang="en">Shin In-sook</span></p>
              <p class="work">섬유아트 : 소나무 벽걸이</p>
            </figcaption>
          </figure>"""
    sections = [
        ("overall", "종합대상", overall),
        ("grand-prize", "부문대상", "\n".join(grand_slide(*g) for g in GRAND_PRIZES)),
        ("excellence", "최우수상 우수상", "\n".join([
            empty_slide("최우수상 작품 준비 중입니다", "prize-best"),
            empty_slide("우수상 작품 준비 중입니다", "prize-excellent")])),
        ("encouragement", "장려상 삼채상 오채상", "\n".join([
            empty_slide("장려상 작품 준비 중입니다", "prize-encouragement"),
            empty_slide("삼채상 작품 준비 중입니다", "prize-samchae"),
            empty_slide("오채상 작품 준비 중입니다", "prize-ochae")])),
        ("special", "특 선", empty_slide("특선 작품 준비 중입니다")),
        ("selected", "입 선", empty_slide("입선 작품 준비 중입니다")),
    ]
    body = "\n\n".join(f"""    <section class="award-section" id="{sid}" aria-labelledby="{sid}-t">
      <div class="award-bar">{LAUREL}<h2 id="{sid}-t">{title}</h2></div>
      {slider(slides, title + " 작품")}
    </section>""" for sid, title, slides in sections)
    return head("수상작품 | (사)한반도문화예술협회", "2026 제19회 한반도미술대전 수상작품") + header("awards") + f"""<div class="band-thin"></div>
<main>
  <h1 class="page-heading">2026 제19회 한반도미술대전<br>수상작품</h1>
  <div class="container">
{body}
  </div>
</main>
""" + FOOTER

# ------------------------------------------------------------------ Desktop 5
ARTISTS = [
    ("한지연", "민화", "원주전통문화교육원 강사 / 예랑민화연구소 대표"),
    ("최희규", "섬유아트", "국제전통미술대전 초대작가 / 한국전통문화예술진흥협회 초대작가"),
    ("최유진", "한국화", "원주미술협회 초대작가"),
    ("최운기", "궁중회화", "(사)한반도문화예술협회 이사장 / 목정출판 대표"),
    ("최연종", "섬유아트", "대한민국미술대전 입선"),
    ("최가림", "섬유아트", "전통명장협회 섬유명장"),
    ("지은덕", "민화", "한반도미술대전 초대작가"),
    ("정경남", "문인화", "신사임당미술대전 초대작가"),
    ("임미자", "문인화", "한반도미술대전 초대작가"),
    ("이충길", "민화", "한반도미술대전 초대작가 / (사)한국시각디자이너협회 초대작가"),
    ("유영남", "서각", "한국서화협회 서각명인, 초대작가, 지도자"),
    ("원종순", "문인화", "강원미술대전 초대작가 / 운곡세예문인화대전 초대작가"),
    ("심문자", "섬유아트", "한반도미술대전 초대작가"),
    ("성기태", "서각", "한국서화협회 초대작가 / 한국서화협회 서각명인"),
    ("박채성", "문인화", "대한민국미술대전 초대작가 / 전국휘호대회 초대작가"),
    ("박난실", "섬유아트", "한반도미술대전 초대작가"),
    ("박경숙", "섬유아트", "한얼문예박물관 초대작가"),
    ("김영순", "민화", "도원민화연구소 소장"),
    ("김연순", "문인화", "대한민국미술대전 초대작가 / 운곡세예문인화대전 초대작가"),
    ("권진국", "서각", "열린미술협회 초대작가"),
    ("권영숙", "한국화", "대한민국전통서화대전 초대작가"),
    ("강민희", "문인화", "한반도미술대전 초대작가"),
]

SEARCH_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'

def search_form(target, options, label):
    opts = "".join(f'<option value="{v}">{t}</option>' for v, t in options)
    return f"""<form class="search-box" data-search="{target}" role="search" aria-label="{label}">
      <label class="sr-only" for="{target}-field">검색 항목</label>
      <select id="{target}-field">{opts}</select>
      <label class="sr-only" for="{target}-q">검색어</label>
      <input id="{target}-q" type="search" placeholder="검색어를 입력하세요">
      <button type="submit"><span class="label">검색</span>{SEARCH_ICON}<span class="sr-only">검색</span></button>
    </form>"""

def page_artists():
    rows = "\n".join(
        f'        <tr data-row data-name="{n}" data-field="{f}"><td class="col-name">{n}</td><td class="col-field">{f}</td><td class="col-desc">{d}</td></tr>'
        for n, f, d in ARTISTS
    )
    return head("초대작가 소개 | (사)한반도문화예술협회", "2026 제19회 한반도미술대전 초대작가 소개") + header("artists") + f"""<section class="title-band">
  <div class="container">
    <h1>초대작가 소개</h1>
    {year_tabs("artists-works.html")}
  </div>
</section>
<main class="container artists-main">
    {search_form("artist-table", [("name", "작가명"), ("field", "분야"), ("all", "전체")], "초대작가 검색")}

    <table class="data-table" id="artist-table">
      <caption class="sr-only">제19회 초대작가 목록</caption>
      <thead>
        <tr><th class="col-name" scope="col">작가명</th><th class="col-field" scope="col"><span class="sr-only">분야</span></th><th class="col-desc" scope="col"><span class="sr-only">경력</span></th></tr>
      </thead>
      <tbody>
        <tr class="caption-row"><td colspan="3"><a href="artists-works.html">2026 제19회 한반도미술대전 초대작가 전시작품 소개</a></td></tr>
{rows}
        <tr class="no-result" hidden><td colspan="3">검색 결과가 없습니다. 다른 검색어를 입력해 보세요.</td></tr>
      </tbody>
    </table>

    <nav class="pager" aria-label="페이지">
      <a href="#" aria-disabled="true">Prev</a><strong aria-current="page">1</strong><a href="#" aria-disabled="true">Next</a>
    </nav>
</main>
""" + FOOTER

# ------------------------------------------------------------------ Desktop 6
def page_artists_works():
    return head("초대작가 전시작품 | (사)한반도문화예술협회", "2026 제19회 한반도미술대전 초대작가 전시작품 소개") + header("artists") + f"""<div class="band-thin"></div>
<main>
  <h1 class="page-heading">2026 제19회 한반도미술대전<br>초대작가 전시작품 소개</h1>
  <div class="container">
    {slider(empty_slide("초대작가 전시작품 준비 중입니다"), "초대작가 전시작품", "works")}
  </div>
</main>
""" + FOOTER

# ------------------------------------------------------------------ Desktop 7 / 8
NOTICES = [
    ("1", "제19회 한반도미술대전 초대작가 출품원서", "2026.06.10"),
    ("2", "제19회 한반도미술대전 출품원서", "2026.06.10"),
    ("3", "제19회 한반도미술대전 개최요강", "2026.06.10"),
]

BOARD_INTRO = '<p class="board-intro"><span class="hl">(사)한반도 문화예술협회</span>는 국,내외에서 창작활동을 하고 있는 창의력 있고 <br>높은 기량을 가진 신진작가 등용문 역할을 하고있는 <span class="hl">한반도미술대전</span>입니다.</p>'

def notice_head(title):
    return head(title, "(사)한반도문화예술협회 공지사항") + header("notice") + """<div class="title-bar">
  <div class="container"><h1>공지사항</h1></div>
</div>
"""

def page_notice():
    rows = "\n".join(
        f'        <tr data-row data-title="{t}"><td><a href="notice-view.html?id={i}">{t}</a></td><td class="col-date"><time datetime="{d.replace(".", "-")}">{d}</time></td></tr>'
        for i, t, d in NOTICES
    )
    return notice_head("공지사항 | (사)한반도문화예술협회") + f"""<main class="container board-page">
    {BOARD_INTRO}
    {search_form("notice-table", [("all", "제목+내용"), ("title", "제목")], "공지사항 검색")}

    <table class="data-table notice-table" id="notice-table">
      <caption class="sr-only">공지사항 목록</caption>
      <thead><tr><th scope="col">제목</th><th class="col-date" scope="col">날짜</th></tr></thead>
      <tbody>
{rows}
        <tr class="no-result" hidden><td colspan="2">검색 결과가 없습니다. 다른 검색어를 입력해 보세요.</td></tr>
      </tbody>
    </table>

    <nav class="pager" aria-label="페이지">
      <a href="#" aria-disabled="true">Prev</a><strong aria-current="page">1</strong><a href="#" aria-disabled="true">Next</a>
    </nav>
</main>
""" + FOOTER

def page_notice_view():
    return notice_head("공지사항 | (사)한반도문화예술협회") + f"""<main class="container board-page">
    {BOARD_INTRO}
    <article class="notice-view" data-notice-view>
      <header>
        <h2>제19회 한반도미술대전 초대작가 출품원서</h2>
        <time datetime="2026-06-10">2026.06.10</time>
      </header>
      <div class="body">
        <p>공지 내용을 이곳에 입력하세요. 첨부파일(출품원서, 개최요강 등)은 이 영역에 링크로 추가할 수 있습니다.</p>
      </div>
    </article>
    <a class="btn-list" href="notice.html">목록으로</a>
</main>
""" + FOOTER

# awards.html, awards-works.html 은 직접 수정한 내용(이미지 경로, 도록 슬라이드)이 있어
# 이 스크립트로 다시 만들지 않습니다. 두 파일은 HTML을 직접 고쳐 주세요.
PAGES = {
    "index.html": page_index,
    "greeting.html": page_greeting,
    "artists.html": page_artists,
    "notice.html": page_notice,
    "notice-view.html": page_notice_view,
}

for name, fn in PAGES.items():
    (OUT / name).write_text(fn(), encoding="utf-8")
    print("wrote", name)
