/* (사)한반도문화예술협회 — 내용 그리기
   data/site-data.js 의 내용(사진·수상작·초대작가·알림마당)을 읽어 각 페이지에 채웁니다.
   내용은 admin.html(편집기)에서 고치세요. 이 파일은 고칠 필요가 없습니다. */
(function () {
  "use strict";
  var D = window.SITE_DATA;
  if (!D) return;

  /* ---------- 도구 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function fileName(p) { return String(p || "").split("/").pop(); }
  function isImage(p) { return /\.(jpe?g|png|gif|webp|svg)$/i.test(p || ""); }
  function dot(d) { return String(d || "").replace(/-/g, "."); }
  function ordinal(n) {
    var t = n % 100, o = n % 10;
    return n + ((t >= 11 && t <= 13) ? "th" : o === 1 ? "st" : o === 2 ? "nd" : o === 3 ? "rd" : "th");
  }
  function sup(n) { var s = ordinal(n); return n + "<sup>" + s.slice(String(n).length) + "</sup>"; }
  function spaced(name) { return String(name || "").split("").join(" "); }

  var editions = (D.editions || []).slice().sort(function (a, b) { return a.no - b.no; });
  var current = D.currentEdition;
  var want = parseInt(new URLSearchParams(location.search).get("ed"), 10);
  var ED = editions.filter(function (e) { return e.no === want; })[0] ||
           editions.filter(function (e) { return e.no === current; })[0] ||
           editions[editions.length - 1] || null;

  function url(page, no) { return no === current ? page : page + "?ed=" + no; }
  function edLabel(e) { return e.year + " 제" + e.no + "회 한반도미술대전"; }

  var ICON_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  var LAUREL = "images/19-image1/wgs2.png";

  /* 도록 슬라이더 한 개 */
  function bookHTML(opt) {
    return '<div class="slider book' + (opt.extra ? " " + opt.extra : "") + '" data-slider data-book' +
        (opt.title ? ' data-title="' + esc(opt.title) + '"' : "") +
        ' role="region" aria-roledescription="carousel" aria-label="' + esc(opt.label) + '" tabindex="0">' +
      '<div class="book-stage ratio-' + esc(opt.ratio || "2670x1808") + '"><div class="slider-track">' + opt.slides + '</div></div>' +
      '<button class="slider-btn prev" type="button" aria-label="이전 페이지">' + ICON_PREV + '</button>' +
      '<button class="slider-btn next" type="button" aria-label="다음 페이지">' + ICON_NEXT + '</button>' +
      '<div class="book-footer"><div class="slider-dots"></div><p class="book-count" aria-live="polite"></p></div>' +
    '</div>';
  }
  function imageSlides(pages, label) {
    return (pages || []).map(function (p, i) {
      return '<div class="book-slide"' + (p.anchor ? ' id="' + esc(p.anchor) + '"' : "") + '>' +
        '<img src="' + esc(p.src) + '" alt="' + esc(label + " 도록 " + (i + 1) + "쪽") + '" loading="' + (i ? "lazy" : "eager") + '" draggable="false">' +
        (p.line ? '<span class="center-line" aria-hidden="true"></span>' : "") + '</div>';
    }).join("");
  }
  function emptyNote(msg) { return '<p class="empty-note">' + esc(msg || "준비 중입니다.") + '</p>'; }

  /* ---------- 회차 탭 (수상작 · 초대작가) ---------- */
  $$("[data-render=tabs]").forEach(function (nav) {
    var page = nav.getAttribute("data-page");            /* awards | artists */
    var works = page === "awards" ? "awards-works.html" : "artists-works.html";
    var what = page === "awards" ? "수상작품" : "초대작가 전시작품";
    var html = "", last = 0;
    editions.forEach(function (e) {
      last = e.no;
      if (ED && e.no === ED.no) {
        html += '<a href="' + url(works, e.no) + '" class="is-current" aria-current="true" title="' + esc(edLabel(e) + " " + what + " 보기") + '">제' + e.no + '회</a>';
      } else {
        html += '<a href="' + url(page + ".html", e.no) + '" class="is-other" title="' + esc(edLabel(e)) + ' 보기">제' + e.no + '회</a>';
      }
    });
    for (var n = last + 1, k = editions.length; k < 7; n++, k++) {
      html += '<span aria-disabled="true" title="준비 중">제' + n + '회</span>';
    }
    nav.innerHTML = html;
  });

  /* ---------- 메인: 배너 사진 + 출품 안내 마크 ---------- */
  var banner = $("[data-render=banner]");
  if (banner && D.home) {
    var list = (D.home.banner || []).filter(function (b) { return b.src; });
    var set = list.slice();
    while (set.length && set.length < 5) set = set.concat(list);   /* 5장보다 적으면 반복해서 채움 */
    var one = function (b, hidden) {
      return '<div class="banner-slide"' + (hidden ? ' aria-hidden="true"' : "") + '><img src="' + esc(b.src) + '" alt="' + (hidden ? "" : esc(b.alt)) + '" draggable="false"></div>';
    };
    banner.innerHTML = '<div class="banner-track">' +
      set.map(function (b, i) { return one(b, i >= list.length); }).join("") +
      set.map(function (b) { return one(b, true); }).join("") + '</div>';
    banner.style.setProperty("--n", set.length);
  }
  var badge = $("[data-render=badge]");
  if (badge && D.home && D.home.badge) {
    var bd = D.home.badge;
    if (!bd.src) badge.hidden = true;
    else {
      badge.href = bd.href || "notice.html";
      badge.innerHTML = '<img src="' + esc(bd.src) + '" alt="' + esc(bd.alt) + '" draggable="false">';
    }
  }

  /* ---------- 회차 이름이 들어가는 글자 ---------- */
  $$("[data-render=ed-label]").forEach(function (el) {
    el.innerHTML = ED ? esc(edLabel(ED)) + "<br>" + esc(el.getAttribute("data-suffix") || "") : esc(el.getAttribute("data-suffix") || "");
  });
  if (ED) {
    var meta = $('meta[name="description"]');
    var dt = document.body.getAttribute("data-doc");
    if (dt) {
      if (meta) meta.setAttribute("content", edLabel(ED) + " " + dt);
      if (want) document.title = "제" + ED.no + "회 " + document.title;
    }
  }

  /* ---------- 수상작 (awards.html): 종합대상 ---------- */
  var grandBox = $("[data-render=grand]");
  if (grandBox) {
    var g = ED && ED.awards && ED.awards.grand;
    if (!g || !g.name) {
      grandBox.outerHTML = emptyNote("제" + (ED ? ED.no : "") + "회 수상작은 준비 중입니다.");
    } else {
      grandBox.innerHTML =
        '<div class="grand-m-head m-only"><p>' + esc(edLabel(ED)) + '</p><p class="t"><b>종합대상</b> ' + esc(g.field) + '</p></div>' +
        '<div class="ph"><img src="' + esc(g.image) + '" alt="' + esc(g.name + " 작 " + g.title) + '"></div>' +
        '<div class="info">' +
          '<p class="edition d-only">' + esc(ED.year) + '<br>제' + ED.no + '회 한반도미술대전</p>' +
          '<div class="badge d-only"><img src="' + LAUREL + '" alt=""><span>종합대상</span></div>' +
          '<p class="prize d-only" lang="en">' + esc(g.prizeEn) + '</p>' +
          '<h2 class="artist" id="grand-title">' + esc(spaced(g.name)) + ' <span lang="en">' + esc(g.nameEn) + '</span></h2>' +
          '<p class="work">' + esc(g.field) + ' : ' + esc(g.title) + '</p>' +
        '</div>';
    }
  }
  /* 수상 구분 버튼: 이 회차에 해당 쪽이 없으면 그 부문 맨 앞으로 */
  $$("[data-render=prize-links] a[data-to]").forEach(function (a) {
    var to = a.getAttribute("data-to"), sec = a.getAttribute("data-sec") || to;
    var has = false;
    if (ED && ED.awards) (ED.awards.books || []).forEach(function (b) {
      (b.pages || []).forEach(function (p) { if (p.anchor === to) has = true; });
    });
    var target = (to === sec || has) ? to : sec;
    a.href = (ED ? url("awards-works.html", ED.no) : "awards-works.html") + "#" + target;
  });

  /* ---------- 수상작품 (awards-works.html) ---------- */
  var BOOKS = {
    excellence:    { id: "excellence",    bar: "최우수상 우수상",      label: "최우수상 · 우수상" },
    encouragement: { id: "encouragement", bar: "장려상 삼채상 오채상", label: "장려상 · 삼채상 · 오채상" },
    special:       { id: "special",       bar: "특 선",                label: "특선" },
    selected:      { id: "selected",      bar: "입 선",                label: "입선" }
  };
  function section(id, bar, inner) {
    return '<section class="award-section" id="' + id + '" aria-labelledby="' + id + '-t">' +
      '<div class="award-bar"><img class="laurel" src="' + LAUREL + '" alt=""><h2 id="' + id + '-t">' + esc(bar) + '</h2></div>' + inner + '</section>';
  }
  function spreadHTML(gp) {
    var no = ED.no, year = ED.year;
    var sub = "제" + no + "회 韓半島美術大展運營委員會";
    var side = "The " + ordinal(no) + " Hanbando Annual Art Competition " + year;
    var foot = "The " + sup(no) + " Hanbando Annual Art Competition " + year;
    function deco(t) {
      return '<div class="head"><div class="tab"></div><div class="ht"><div class="t">' + t + '</div><div class="s">' + esc(sub) + '</div></div></div>' +
        '<div class="side-text">' + esc(side) + '</div><div class="foot">' + foot + '</div>';
    }
    var pages = [{ type: "cover" }];
    (gp.winners || []).forEach(function (w) { pages.push({ type: "work", w: w }); });
    if ((pages.length + 1) % 2) pages.push({ type: "blank" });
    pages.push({ type: "closing" });
    var html = "";
    for (var i = 0; i < pages.length; i += 2) {
      html += '<div class="book-slide"><div class="spread">';
      [pages[i], pages[i + 1]].forEach(function (p, k) {
        var side = k ? "R" : "L";
        if (p.type === "cover") {
          html += '<div class="page L cover"><div class="wreath"><img src="' + esc(gp.cover) + '" alt="" draggable="false" loading="lazy"><span>대상</span></div></div>';
        } else if (p.type === "blank") {
          html += '<div class="page ' + side + '"></div>';
        } else if (p.type === "closing") {
          html += '<div class="page ' + side + ' closing">' + deco("대상<i>|</i>수상작") +
            '<div class="index">' + (gp.cover ? '<img class="mini" src="' + esc(gp.cover) + '" alt="" draggable="false" loading="lazy">' : "") +
            '<h2>대상 수상자</h2><ol>' + (gp.winners || []).map(function (w) {
              return '<li><b>' + esc(w.field) + '</b><span>' + esc(w.name) + '</span><em>' + esc(w.title) + '</em></li>';
            }).join("") + '</ol></div></div>';
        } else {
          var w = p.w;
          var t = side === "L" ? "대상<i>|</i>" + esc(w.field) : esc(w.field) + "<i>|</i>대상";
          html += '<div class="page ' + side + '">' + deco(t) +
            '<figure class="art"><div class="frame"><img class="' + (w.shape === "wide" ? "wide" : "tall") + '" src="' + esc(w.image) + '" alt="' + esc(w.field + " : " + w.title) + '" draggable="false" loading="lazy"></div>' +
            '<figcaption><div class="cap">' + esc(w.name) + '<i>|</i>' + esc(w.title) + '</div><div class="cap-en">' + esc(w.nameEn) + (w.prizeEn ? " · " + esc(w.prizeEn) : "") + '</div></figcaption></figure></div>';
        }
      });
      html += (i ? '<div class="center-line"></div>' : "") + '</div></div>';
    }
    return html;
  }
  var worksBox = $("[data-render=award-books]");
  if (worksBox) {
    var A = ED && ED.awards;
    if (!A) worksBox.innerHTML = emptyNote("수상작품은 준비 중입니다.");
    else {
      var out = "";
      var g2 = A.grand;
      out += section("overall", "종합대상", g2 && g2.name ?
        '<div class="slider overall-slider" data-slider role="region" aria-roledescription="carousel" aria-label="종합대상 작품" tabindex="0"><div class="slider-track">' +
          '<figure class="slide"><div class="art"><div class="ph"><img src="' + esc(g2.image) + '" alt="' + esc(g2.name + " 작 " + g2.title) + '"></div></div>' +
          '<figcaption class="caption"><p class="cat"><span class="m-only">종합대상 </span><b>' + esc(g2.field) + '</b> <i>ㅣ</i> <b class="d-only">종합대상</b></p>' +
          '<p class="prize" lang="en">' + esc(g2.prizeEn) + '</p>' +
          '<p class="artist">' + esc(spaced(g2.name)) + ' <span lang="en">' + esc(g2.nameEn) + '</span></p>' +
          '<p class="work">' + esc(g2.field) + ' : ' + esc(g2.title) + '</p></figcaption></figure>' +
        '</div></div>' : emptyNote());
      var gp = A.grandPrize;
      out += section("grand-prize", "부문대상", gp && gp.winners && gp.winners.length ?
        bookHTML({ extra: "spread-book", label: "부문대상 도록", ratio: "1778x1201", slides: spreadHTML(gp) }) : emptyNote());
      ["excellence", "encouragement", "special", "selected"].forEach(function (key) {
        var info = BOOKS[key];
        var b = (A.books || []).filter(function (x) { return x.key === key; })[0];
        out += section(info.id, info.bar, b && b.pages && b.pages.length ?
          bookHTML({ label: info.label + " 도록", ratio: b.ratio, slides: imageSlides(b.pages, info.label) }) : emptyNote());
      });
      worksBox.innerHTML = out;
    }
  }

  /* ---------- 초대작가 (artists.html) ---------- */
  var artistBody = $("[data-render=artist-rows]");
  if (artistBody) {
    var master = {};
    (D.artists || []).forEach(function (a) { master[a.id] = a; });
    var rows = "";
    if (ED) rows += '<tr class="caption-row"><td colspan="3"><a href="' + url("artists-works.html", ED.no) + '">' + esc(edLabel(ED)) + ' 초대작가 전시작품 소개</a>' +
      '<a href="' + url("artists-works.html", ED.no) + '" class="btn-view" aria-label="' + esc(edLabel(ED)) + ' 초대작가 전시작품 보기"><span>보기</span></a></td></tr>';
    ((ED && ED.artists) || []).forEach(function (en) {
      var a = master[en.id]; if (!a) return;
      var field = en.field || a.field, desc = en.desc != null && en.desc !== "" ? en.desc : a.desc;
      rows += '<tr data-row data-name="' + esc(a.name) + '" data-field="' + esc(field) + '"><td class="col-name">' + esc(a.name) + '</td><td class="col-field">' + esc(field) + '</td><td class="col-desc">' + esc(desc) + '</td></tr>';
    });
    rows += '<tr class="no-result" hidden><td colspan="3">검색 결과가 없습니다. 다른 검색어를 입력해 보세요.</td></tr>';
    artistBody.innerHTML = rows;
    var cap = $("#artist-table caption");
    if (cap && ED) cap.textContent = "제" + ED.no + "회 초대작가 목록";
  }

  /* ---------- 초대작가 전시작품 (artists-works.html) ---------- */
  var abBox = $("[data-render=artist-book]");
  if (abBox) {
    var ab = ED && ED.artistBook;
    abBox.innerHTML = ab && ab.pages && ab.pages.length ?
      bookHTML({ title: "초대작가 전시작품", label: "초대작가 전시작품 도록", ratio: ab.ratio, slides: imageSlides(ab.pages, "초대작가 전시작품") }) :
      emptyNote("초대작가 전시작품은 준비 중입니다.");
  }

  /* ---------- 알림마당 목록 (notice.html) ---------- */
  var noticeBody = $("[data-render=notice-rows]");
  if (noticeBody) {
    noticeBody.innerHTML = (D.notices || []).map(function (n) {
      return '<tr data-row data-title="' + esc(n.title) + '" data-content="' + esc(n.body) + '"><td class="col-title"><a href="notice-view.html?id=' + encodeURIComponent(n.id) + '">' + esc(n.title) + '</a></td>' +
        '<td class="col-date"><time datetime="' + esc(n.date) + '">' + esc(dot(n.date)) + '</time></td></tr>';
    }).join("") + '<tr class="no-result" hidden><td colspan="2">' + ((D.notices || []).length ? "검색 결과가 없습니다. 다른 검색어를 입력해 보세요." : "등록된 글이 없습니다.") + '</td></tr>';
  }

  /* ---------- 알림마당 글 보기 (notice-view.html) ---------- */
  var viewBox = $("[data-render=notice-view]");
  if (viewBox) {
    var DL = '<svg class="dl-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 17v3h16v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    viewBox.innerHTML = (D.notices || []).map(function (n) {
      var f = n.file, name = fileName(f);
      return '<article class="notice-view" data-notice-id="' + esc(n.id) + '" hidden>' +
        '<header><h2>' + esc(n.title) + '</h2><time datetime="' + esc(n.date) + '">' + esc(dot(n.date)) + '</time></header>' +
        '<div class="body">' +
          (n.body ? '<div class="notice-text">' + esc(n.body) + '</div>' : "") +
          (f ? '<a class="dl-btn" href="' + esc(f) + '" download="' + esc(name) + '">' + DL + '<span>첨부파일 내려받기</span><small>' + esc(name) + '</small></a>' : "") +
          (f && isImage(f) ? '<figure class="notice-file"><img src="' + esc(f) + '" alt="' + esc(n.title) + '"></figure>' : "") +
        '</div></article>';
    }).join("") || emptyNote("등록된 글이 없습니다.");
  }
})();
