/* (사)한반도문화예술협회 — 내용 편집기(admin.html)
   data/site-data.js 를 읽어 화면에서 고치고, 다시 저장합니다.
   - 크롬·엣지: [사이트 폴더 연결] 후 [폴더에 저장] → 내용 파일과 새 사진이 사이트 폴더에 바로 저장
   - 그 밖의 브라우저: [바뀐 파일 내려받기(zip)] → 압축을 사이트 폴더에 풀어 덮어쓰기 */
(function () {
  "use strict";

  /* =========================================================
     자료 준비
     ========================================================= */
  var BOOK_KEYS = [
    { key: "excellence",    label: "최우수상 · 우수상",        anchors: [["prize-best", "최우수상 시작 쪽"], ["prize-excellent", "우수상 시작 쪽"]] },
    { key: "encouragement", label: "장려상 · 삼채상 · 오채상", anchors: [["prize-encouragement", "장려상 시작 쪽"], ["prize-samchae", "삼채상 시작 쪽"], ["prize-ochae", "오채상 시작 쪽"]] },
    { key: "special",       label: "특선",                    anchors: [] },
    { key: "selected",      label: "입선",                    anchors: [] }
  ];
  var RATIOS = [
    ["2670x1808", "2670 × 1808 (펼침면 사진 · 장려상/특선/입선/전시작품)"],
    ["1778x1201", "1778 × 1201 (펼침면 사진 · 최우수상/우수상)"]
  ];

  var S = JSON.parse(JSON.stringify(window.SITE_DATA || {}));
  var loadedOK = !!window.SITE_DATA;
  normalize(S);

  var pending = {};      /* 새로 고른 파일: 경로 → File */
  var blobUrl = {};      /* 미리보기용 주소: 경로 → blob: */
  var dirty = false;
  var dirHandle = null;
  var ui = { view: "home", ed: S.currentEdition, awTab: "grand", open: {} };

  function normalize(d) {
    d.home = d.home || {};
    d.home.banner = d.home.banner || [];
    d.home.badge = d.home.badge || { src: "", alt: "", href: "notice.html" };
    d.notices = d.notices || [];
    d.notices.forEach(function (n) { n.id = String(n.id); n.body = n.body || ""; n.file = n.file || ""; });
    d.artists = d.artists || [];
    d.editions = d.editions || [];
    var master = byId();
    d.editions.forEach(function (e) {
      e.awards = e.awards || {};
      e.awards.grand = e.awards.grand || { name: "", nameEn: "", field: "", title: "", prizeEn: "", image: "" };
      e.awards.grandPrize = e.awards.grandPrize || { cover: "", winners: [] };
      e.awards.grandPrize.winners = e.awards.grandPrize.winners || [];
      e.awards.books = e.awards.books || [];
      BOOK_KEYS.forEach(function (b) {
        if (!e.awards.books.some(function (x) { return x.key === b.key; }))
          e.awards.books.push({ key: b.key, ratio: b.key === "excellence" ? "1778x1201" : "2670x1808", pages: [] });
      });
      e.artists = (e.artists || []).filter(function (en) { return master[en.id]; });
      e.artists.forEach(function (en) {
        var a = master[en.id];
        if (en.field == null || en.field === "") en.field = a.field || "";
        if (en.desc == null || en.desc === "") en.desc = a.desc || "";
      });
      e.artistBook = e.artistBook || { ratio: "2670x1808", pages: [] };
      e.artistBook.pages = e.artistBook.pages || [];
    });
    sortEditions();
    if (!d.editions.some(function (e) { return e.no === d.currentEdition; }))
      d.currentEdition = d.editions.length ? d.editions[d.editions.length - 1].no : null;
    function byId() { var m = {}; (d.artists || []).forEach(function (a) { m[a.id] = a; }); return m; }
  }
  function sortEditions() { S.editions.sort(function (a, b) { return a.no - b.no; }); }
  function master() { var m = {}; S.artists.forEach(function (a) { m[a.id] = a; }); return m; }
  function edition(no) { return S.editions.filter(function (e) { return e.no === no; })[0] || null; }
  function curEd() {
    var e = edition(ui.ed);
    if (!e && S.editions.length) { e = edition(S.currentEdition) || S.editions[S.editions.length - 1]; ui.ed = e.no; }
    return e;
  }

  /* =========================================================
     작은 도구
     ========================================================= */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "class") n.className = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else if (k === "value") n.value = v;
      else if (k === "checked") n.checked = !!v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  function btn(text, onclick, cls, title) {
    return el("button", { type: "button", class: "ad-btn " + (cls || ""), onclick: onclick, title: title, text: text });
  }
  function toast(msg, ms) {
    var t = document.getElementById("ad-toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, ms || 3200);
  }
  function touch() { dirty = true; status(); }
  function move(arr, i, d) {
    var j = i + d; if (j < 0 || j >= arr.length) return;
    var x = arr[i]; arr[i] = arr[j]; arr[j] = x; touch(); render();
  }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function natural(a, b) { return a.name.localeCompare(b.name, "ko", { numeric: true }); }

  /* 입력 칸 하나: obj[key] 를 고침 */
  function field(label, obj, key, opt) {
    opt = opt || {};
    var input;
    if (opt.type === "textarea") input = el("textarea", { rows: opt.rows || 5 });
    else if (opt.options) {
      input = el("select", {}, opt.options.map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
    } else input = el("input", { type: opt.type || "text", placeholder: opt.placeholder || "" });
    input.value = obj[key] == null ? "" : obj[key];
    input.addEventListener(opt.options ? "change" : "input", function () {
      obj[key] = opt.type === "number" ? (input.value === "" ? "" : Number(input.value)) : input.value;
      touch();
      if (opt.onchange) opt.onchange(input.value);
    });
    return el("label", { class: "ad-field" + (opt.wide ? " wide" : "") }, [el("span", { text: label }), input,
      opt.hint ? el("small", { class: "ad-hint", text: opt.hint }) : null]);
  }

  /* =========================================================
     파일(사진) 다루기
     ========================================================= */
  function pickFiles(accept, multiple) {
    return new Promise(function (ok) {
      var inp = el("input", { type: "file", accept: accept == null ? "image/*" : accept });
      if (multiple) inp.multiple = true;
      inp.style.display = "none";
      inp.addEventListener("change", function () { ok(Array.prototype.slice.call(inp.files || [])); inp.remove(); });
      document.body.appendChild(inp);
      inp.click();
    });
  }
  function cleanName(name) {
    var n = String(name).normalize ? String(name).normalize("NFC") : String(name);
    var dot = n.lastIndexOf(".");
    var base = dot > 0 ? n.slice(0, dot) : n, ext = dot > 0 ? n.slice(dot).toLowerCase() : "";
    base = base.replace(/[\\/:*?"<>|#%&{}$!'@+`=\s]+/g, "_").replace(/^_+|_+$/g, "") || "file";
    return base + ext;
  }
  /* 데이터 안에서 쓰이는 모든 파일 경로 */
  function usedPaths() {
    var set = {};
    (function walk(v) {
      if (typeof v === "string") { if (/^(images|files)\//.test(v)) set[v] = true; }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") Object.keys(v).forEach(function (k) { walk(v[k]); });
    })(S);
    return set;
  }
  /* 고른 파일을 dir 폴더에 둘 경로를 정하고(겹치면 _2, _3 …) 저장 목록에 올림 */
  function place(file, dir, replacing) {
    var used = usedPaths();
    if (replacing) delete used[replacing];
    var name = cleanName(file.name), dot = name.lastIndexOf(".");
    var base = dot > 0 ? name.slice(0, dot) : name, ext = dot > 0 ? name.slice(dot) : "";
    var path = dir + "/" + name, k = 2;
    while ((used[path] || pending[path]) && pending[path] !== file) { path = dir + "/" + base + "_" + k + ext; k++; }
    pending[path] = file;
    blobUrl[path] = URL.createObjectURL(file);
    return path;
  }
  function srcOf(path) { return blobUrl[path] || path; }
  function edDir(e, sub) { return "images/ed" + e.no + "/" + sub; }

  function thumb(path) {
    var box = el("div", { class: "ad-thumb" });
    if (!path) box.textContent = "사진 없음";
    else if (/\.(jpe?g|png|gif|webp|svg)$/i.test(path)) {
      var im = el("img", { src: srcOf(path), alt: "" });
      im.addEventListener("error", function () { box.textContent = "파일을 찾을 수 없음"; });
      box.appendChild(im);
    } else box.textContent = (path.split(".").pop() || "").toUpperCase() + " 파일";
    return box;
  }
  /* 사진 칸: 미리보기 + 경로 + [사진 고르기] */
  function imgField(label, obj, key, dir, opt) {
    opt = opt || {};
    var path = obj[key];
    return el("div", { class: "ad-field" + (opt.wide ? " wide" : "") }, [
      el("span", { text: label }),
      el("div", { class: "ad-img" }, [
        thumb(path),
        el("div", {}, [
          el("div", { class: "ad-path" }, [path || "아직 고르지 않았습니다", pending[path] ? el("span", { class: "ad-new", text: "새 파일" }) : null]),
          el("div", { class: "ad-row", style: "margin-top:8px" }, [
            btn(path ? "바꾸기" : "파일 고르기", function () {
              pickFiles(opt.accept == null ? "image/*" : opt.accept).then(function (fs) {
                if (!fs.length) return;
                obj[key] = place(fs[0], typeof dir === "function" ? dir() : dir, path);
                if (opt.onpick) opt.onpick(fs[0], obj[key]);
                touch(); render();
              });
            }, "small"),
            path && opt.clearable ? btn("지우기", function () { obj[key] = ""; touch(); render(); }, "small danger") : null
          ]),
          opt.hint ? el("p", { class: "ad-hint", style: "margin:6px 0 0", text: opt.hint }) : null
        ])
      ])
    ]);
  }

  /* 도록(여러 쪽 사진) 편집 */
  function bookEditor(book, dir, label, anchors) {
    anchors = anchors || [];
    var pages = book.pages;
    var wrap = el("div", {});
    wrap.appendChild(el("div", { class: "ad-row" }, [
      el("label", { class: "ad-field", style: "min-width:280px" }, [el("span", { text: "사진 크기 비율" }),
        (function () {
          var s = el("select", { class: "ad-input" }, RATIOS.map(function (r) { return el("option", { value: r[0], text: r[1] }); }));
          s.value = book.ratio || "2670x1808";
          s.addEventListener("change", function () { book.ratio = s.value; touch(); });
          return s;
        })()]),
      el("div", { class: "ad-spacer" }),
      btn("＋ 쪽 사진 여러 장 추가", function () {
        pickFiles("image/*", true).then(function (fs) {
          if (!fs.length) return;
          fs.sort(natural);
          var wasEmpty = !pages.length;
          fs.forEach(function (f, i) {
            pages.push({ src: place(f, dir), line: !(wasEmpty && i === 0) });
          });
          touch(); render();
          toast(fs.length + "장을 이름 순서대로 추가했습니다.");
        });
      }, "primary small"),
      pages.length ? btn("모두 지우기", function () {
        if (confirm(label + " 도록의 쪽 " + pages.length + "장을 모두 지울까요?")) { pages.length = 0; touch(); render(); }
      }, "small danger") : null
    ]));
    wrap.appendChild(el("p", { class: "ad-hint", text: "파일 이름 순서(01, 02 …)대로 쪽이 정해집니다. ‘가운데 선’은 두 쪽이 펼쳐진 사진에만 켜세요(가운데 접힌 자리에 가는 선이 그려짐)." }));
    if (!pages.length) {
      wrap.appendChild(el("div", { class: "ad-empty", text: "아직 쪽 사진이 없습니다. 위의 [쪽 사진 여러 장 추가]를 누르세요. 사진이 없으면 사이트에는 ‘준비 중’으로 보입니다." }));
      return wrap;
    }
    wrap.appendChild(el("div", { class: "ad-pages" }, pages.map(function (p, i) {
      var sel = null;
      if (anchors.length) {
        sel = el("select", { title: "수상작 페이지의 버튼을 누르면 이 쪽이 열립니다" },
          [el("option", { value: "", text: "— 바로가기 없음 —" })].concat(anchors.map(function (a) { return el("option", { value: a[0], text: a[1] }); })));
        sel.value = p.anchor || "";
        sel.addEventListener("change", function () {
          pages.forEach(function (q) { if (q !== p && q.anchor === sel.value) delete q.anchor; });
          if (sel.value) p.anchor = sel.value; else delete p.anchor;
          touch(); render();
        });
      }
      return el("div", { class: "ad-page" }, [
        thumb(p.src),
        el("div", { class: "ad-row" }, [el("b", { text: (i + 1) + "쪽" }), pending[p.src] ? el("span", { class: "ad-new", text: "새 파일" }) : null]),
        el("label", { class: "ad-check" }, [
          (function () { var c = el("input", { type: "checkbox", checked: p.line }); c.addEventListener("change", function () { p.line = c.checked; touch(); }); return c; })(),
          "가운데 선"]),
        sel,
        el("div", { class: "ad-page-tools" }, [
          btn("◀", function () { move(pages, i, -1); }, "small", "앞으로"),
          btn("▶", function () { move(pages, i, 1); }, "small", "뒤로"),
          btn("바꾸기", function () {
            pickFiles("image/*").then(function (fs) { if (fs.length) { p.src = place(fs[0], dir, p.src); touch(); render(); } });
          }, "small"),
          btn("삭제", function () { pages.splice(i, 1); touch(); render(); }, "small danger")
        ])
      ]);
    })));
    return wrap;
  }

  /* 회차 고르기 띠 */
  function edBar(note) {
    var s = el("select", {}, S.editions.map(function (e) {
      return el("option", { value: e.no, text: e.year + "년 제" + e.no + "회" + (e.no === S.currentEdition ? " (대표)" : "") });
    }));
    s.value = ui.ed;
    s.addEventListener("change", function () { ui.ed = Number(s.value); render(); });
    return el("div", { class: "ad-edbar" }, [el("b", { text: "편집할 회차" }), s,
      el("span", { class: "ad-hint", text: note || "" }), el("div", { class: "ad-spacer" }),
      btn("회차 추가·관리", function () { go("editions"); }, "small")]);
  }

  /* =========================================================
     화면: 메인 사진
     ========================================================= */
  function viewHome() {
    var v = [];
    v.push(el("h1", { text: "메인 사진" }));
    v.push(el("p", { class: "ad-lead", text: "메인 화면(index.html) 위쪽에서 2초마다 흘러가는 사진과, 사진 위에 놓인 출품 안내 마크를 바꿉니다." }));
    var list = S.home.banner;
    v.push(el("div", { class: "ad-card" }, [
      el("h2", { text: "배너 사진 (" + list.length + "장)" }),
      el("p", { class: "ad-hint", text: "화면에 5장이 나란히 보이며 옆으로 흘러갑니다. 세로로 긴 사진(가로:세로 약 288:631)이 가장 잘 맞습니다. 5장보다 적으면 같은 사진을 반복해서 채웁니다." }),
      el("div", { class: "ad-list" }, list.map(function (b, i) {
        return el("div", { class: "ad-item" }, [
          el("div", { class: "ad-item-head" }, [el("span", { class: "ad-num", text: i + 1 }), el("div", { class: "ad-spacer" }),
            btn("▲", function () { move(list, i, -1); }, "small", "위로"),
            btn("▼", function () { move(list, i, 1); }, "small", "아래로"),
            btn("삭제", function () { if (confirm((i + 1) + "번째 배너 사진을 뺄까요?")) { list.splice(i, 1); touch(); render(); } }, "small danger")]),
          el("div", { class: "ad-grid" }, [
            imgField("사진", b, "src", "images/works/banner"),
            field("사진 설명 (부문·작가·작품명)", b, "alt", { placeholder: "예) 종합대상 섬유아트 신인숙 소나무 벽걸이" })
          ])
        ]);
      })),
      el("div", { class: "ad-row", style: "margin-top:14px" }, [
        btn("＋ 배너 사진 추가", function () {
          pickFiles("image/*", true).then(function (fs) {
            fs.sort(natural).forEach(function (f) { list.push({ src: place(f, "images/works/banner"), alt: "" }); });
            if (fs.length) { touch(); render(); }
          });
        }, "primary")
      ])
    ]));
    var bd = S.home.badge;
    v.push(el("div", { class: "ad-card" }, [
      el("h2", { text: "출품 안내 마크" }),
      el("p", { class: "ad-hint", text: "배너 왼쪽 위에 올라가는 둥근 마크입니다. 누르면 아래 ‘연결할 페이지’로 이동합니다. 사진을 지우면 마크가 보이지 않습니다." }),
      el("div", { class: "ad-grid" }, [
        imgField("마크 사진 (배경이 투명한 PNG 권장)", bd, "src", "images/home", { clearable: true }),
        field("마크 설명", bd, "alt"),
        field("연결할 페이지", bd, "href", { options: [["notice.html", "알림마당"], ["awards.html", "수상작"], ["artists.html", "초대작가"], ["greeting.html", "협회소개"]] })
      ])
    ]));
    return v;
  }

  /* =========================================================
     화면: 회차 관리
     ========================================================= */
  function viewEditions() {
    var v = [];
    v.push(el("h1", { text: "회차 관리" }));
    v.push(el("p", { class: "ad-lead", text: "회차를 새로 만들거나 지웁니다. ‘대표 회차’는 수상작·초대작가 메뉴를 눌렀을 때 처음 보이는 회차입니다." }));
    v.push(el("div", { class: "ad-card" }, [
      el("h2", { text: "회차 목록" }),
      el("div", { class: "ad-table-wrap" }, [el("table", { class: "ad-table" }, [
        el("thead", {}, [el("tr", {}, ["대표", "회차", "연도", "수상작", "초대작가", ""].map(function (t) { return el("th", { text: t }); }))]),
        el("tbody", {}, S.editions.map(function (e) {
          var r = el("input", { type: "radio", name: "cur", checked: e.no === S.currentEdition, title: "대표 회차로" });
          r.addEventListener("change", function () { S.currentEdition = e.no; touch(); render(); });
          var A = e.awards, pageN = A.books.reduce(function (s, b) { return s + b.pages.length; }, 0);
          var yr = el("input", { type: "number", value: e.year, style: "max-width:110px" });
          yr.addEventListener("input", function () { e.year = Number(yr.value) || e.year; touch(); });
          return el("tr", {}, [
            el("td", {}, [r]),
            el("td", {}, [el("b", { text: "제" + e.no + "회" })]),
            el("td", {}, [yr]),
            el("td", { text: (A.grand.name ? "종합대상 ✓ · " : "") + "부문대상 " + A.grandPrize.winners.length + "명 · 도록 " + pageN + "쪽" }),
            el("td", { text: e.artists.length + "명 · 전시작품 " + e.artistBook.pages.length + "쪽" }),
            el("td", { class: "tools" }, [
              btn("수상작", function () { ui.ed = e.no; go("awards"); }, "small"),
              btn("초대작가", function () { ui.ed = e.no; go("artists"); }, "small"),
              btn("삭제", function () {
                if (!confirm("제" + e.no + "회를 지울까요? 이 회차의 수상작·초대작가 명단이 모두 사라집니다.\n(사진 파일은 지워지지 않습니다)")) return;
                S.editions.splice(S.editions.indexOf(e), 1);
                if (S.currentEdition === e.no) S.currentEdition = S.editions.length ? S.editions[S.editions.length - 1].no : null;
                touch(); render();
              }, "small danger")
            ])
          ]);
        }))
      ])])
    ]));

    var last = S.editions[S.editions.length - 1];
    var form = { no: last ? last.no + 1 : 19, year: last ? last.year + 1 : new Date().getFullYear(), copy: last ? String(last.no) : "", makeCur: true };
    v.push(el("div", { class: "ad-card" }, [
      el("h2", { text: "새 회차 만들기" }),
      el("p", { class: "ad-hint", text: "초대작가는 회차마다 겹칠 수 있으므로, 이전 회차 명단을 그대로 복사해 시작한 뒤 빼거나 더하면 편합니다." }),
      el("div", { class: "ad-grid" }, [
        field("회차", form, "no", { type: "number" }),
        field("연도", form, "year", { type: "number" }),
        field("초대작가 명단 시작", form, "copy", { options: [["", "빈 명단으로 시작"]].concat(S.editions.slice().reverse().map(function (e) { return [String(e.no), "제" + e.no + "회 명단 복사 (" + e.artists.length + "명)"]; })) }),
        el("label", { class: "ad-check", style: "align-self:end;padding-bottom:10px" }, [
          (function () { var c = el("input", { type: "checkbox", checked: true }); c.addEventListener("change", function () { form.makeCur = c.checked; }); return c; })(),
          "만든 회차를 대표 회차로"])
      ]),
      el("div", { class: "ad-row", style: "margin-top:14px" }, [btn("＋ 회차 만들기", function () {
        var no = Number(form.no), yr = Number(form.year);
        if (!no || no < 1) return toast("회차 번호를 넣어 주세요.");
        if (edition(no)) return toast("제" + no + "회는 이미 있습니다.");
        var src = form.copy ? edition(Number(form.copy)) : null;
        var cover = last ? last.awards.grandPrize.cover : "";
        var e = { no: no, year: yr, awards: { grand: { name: "", nameEn: "", field: "", title: "", prizeEn: "", image: "" }, grandPrize: { cover: cover, winners: [] }, books: [] },
          artists: src ? src.artists.map(function (x) { return { id: x.id, field: x.field, desc: x.desc }; }) : [], artistBook: { ratio: "2670x1808", pages: [] } };
        S.editions.push(e); normalize(S);
        if (form.makeCur) S.currentEdition = no;
        ui.ed = no; touch(); render();
        toast("제" + no + "회를 만들었습니다. 수상작과 초대작가를 채워 주세요.");
      }, "primary")])
    ]));
    return v;
  }

  /* =========================================================
     화면: 수상작
     ========================================================= */
  function viewAwards() {
    var v = [];
    v.push(el("h1", { text: "수상작" }));
    v.push(el("p", { class: "ad-lead", text: "회차를 고른 뒤 부문별로 채웁니다. ‘수상작’ 메뉴와 ‘수상작품’ 도록 페이지에 함께 반영됩니다." }));
    var e = curEd();
    if (!e) { v.push(el("div", { class: "ad-note", text: "회차가 없습니다. [회차 관리]에서 먼저 만들어 주세요." })); return v; }
    v.push(edBar());
    var tabs = [["grand", "종합대상"], ["grandPrize", "부문대상"]].concat(BOOK_KEYS.map(function (b) { return [b.key, b.label]; }));
    v.push(el("div", { class: "ad-tabs" }, tabs.map(function (t) {
      return el("button", { type: "button", "aria-current": ui.awTab === t[0] ? "true" : "false", text: t[1], onclick: function () { ui.awTab = t[0]; render(); } });
    })));
    var A = e.awards;

    if (ui.awTab === "grand") {
      var g = A.grand;
      v.push(el("div", { class: "ad-card" }, [
        el("h2", { text: "제" + e.no + "회 종합대상" }),
        el("p", { class: "ad-hint", text: "수상작 페이지 맨 위 큰 사진과 수상작품 페이지 첫 칸에 나옵니다. 작가명을 비워 두면 ‘준비 중’으로 보입니다." }),
        el("div", { class: "ad-grid" }, [
          imgField("작품 사진", g, "image", edDir(e, "grand"), { wide: true, hint: "세로로 긴 작품 사진이 잘 맞습니다." }),
          field("작가명", g, "name", { placeholder: "예) 신인숙" }),
          field("작가 영문명", g, "nameEn", { placeholder: "예) Shin In-sook" }),
          field("부문", g, "field", { placeholder: "예) 섬유아트" }),
          field("작품명", g, "title", { placeholder: "예) 소나무 벽걸이" }),
          field("영문 수상명", g, "prizeEn", { placeholder: "예) Grand Prize - Textile & Fiber Art", wide: true })
        ])
      ]));
    } else if (ui.awTab === "grandPrize") {
      var gp = A.grandPrize, W = gp.winners;
      v.push(el("div", { class: "ad-card" }, [
        el("h2", { text: "제" + e.no + "회 부문대상 (" + W.length + "명)" }),
        el("p", { class: "ad-hint", text: "수상자만 넣으면 도록 쪽(표지 → 수상작 → 마지막 수상자 목록)이 자동으로 만들어집니다. 수상자가 없으면 ‘준비 중’으로 보입니다." }),
        el("div", { class: "ad-grid", style: "margin-bottom:16px" }, [imgField("표지 꽃다발 그림 (보통 바꾸지 않음)", gp, "cover", edDir(e, "grand-prize"))]),
        el("div", { class: "ad-list" }, W.map(function (w, i) {
          return el("div", { class: "ad-item" }, [
            el("div", { class: "ad-item-head" }, [el("span", { class: "ad-num", text: i + 1 }), el("b", { text: w.field || "부문 미정" }),
              el("div", { class: "ad-spacer" }),
              btn("▲", function () { move(W, i, -1); }, "small", "위로"),
              btn("▼", function () { move(W, i, 1); }, "small", "아래로"),
              btn("삭제", function () { if (confirm((w.name || "이") + " 수상자를 뺄까요?")) { W.splice(i, 1); touch(); render(); } }, "small danger")]),
            el("div", { class: "ad-grid" }, [
              imgField("작품 사진", w, "image", edDir(e, "grand-prize"), {
                onpick: function (f) { autoShape(f, w); }, hint: "가로로 긴 작품은 ‘모양’을 가로형으로 (사진을 고르면 자동으로 정해짐)"
              }),
              field("부문", w, "field", { placeholder: "예) 한국화" }),
              field("작가명", w, "name"),
              field("작품명", w, "title"),
              field("작가 영문명", w, "nameEn"),
              field("영문 수상명", w, "prizeEn", { placeholder: "예) Grand Prize in Korean Painting" }),
              field("모양", w, "shape", { options: [["tall", "세로형 작품"], ["wide", "가로형 작품"]] })
            ])
          ]);
        })),
        el("div", { class: "ad-row", style: "margin-top:14px" }, [btn("＋ 부문대상 수상자 추가", function () {
          W.push({ field: "", name: "", title: "", nameEn: "", prizeEn: "", image: "", shape: "tall" }); touch(); render();
        }, "primary")])
      ]));
    } else {
      var info = BOOK_KEYS.filter(function (b) { return b.key === ui.awTab; })[0];
      var book = A.books.filter(function (b) { return b.key === info.key; })[0];
      v.push(el("div", { class: "ad-card" }, [
        el("h2", { text: "제" + e.no + "회 " + info.label + " 도록 (" + book.pages.length + "쪽)" }),
        el("p", { class: "ad-hint", text: info.anchors.length ?
          "수상작 페이지의 버튼(" + info.anchors.map(function (a) { return a[1].replace(" 시작 쪽", ""); }).join(" · ") + ")을 누르면 열릴 쪽을 각 쪽의 ‘바로가기’에서 정해 주세요." :
          "도록 사진을 차례대로 올립니다." }),
        bookEditor(book, edDir(e, info.key), info.label, info.anchors)
      ]));
    }
    return v;
  }
  function autoShape(file, w) {
    var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () { w.shape = im.naturalWidth > im.naturalHeight ? "wide" : "tall"; URL.revokeObjectURL(u); render(); };
    im.src = u;
  }

  /* =========================================================
     화면: 초대작가
     ========================================================= */
  function viewArtists() {
    var v = [];
    v.push(el("h1", { text: "초대작가" }));
    v.push(el("p", { class: "ad-lead", text: "회차별 초대작가 명단과 전시작품 도록을 고칩니다. 같은 작가가 여러 회차에 나올 수 있어, 작가는 한 번만 등록하고 회차마다 ‘불러와서’ 씁니다." }));
    var e = curEd();
    if (!e) { v.push(el("div", { class: "ad-note", text: "회차가 없습니다. [회차 관리]에서 먼저 만들어 주세요." })); return v; }
    v.push(edBar());
    var M = master(), L = e.artists;
    var inEds = {};
    S.editions.forEach(function (x) { x.artists.forEach(function (en) { (inEds[en.id] = inEds[en.id] || []).push(x.no); }); });

    /* 명단 표 */
    var rows = L.map(function (en, i) {
      var a = M[en.id];
      var name = el("input", { value: a.name, title: "이름을 고치면 모든 회차에 함께 바뀝니다" });
      name.addEventListener("input", function () { a.name = name.value; touch(); });
      var others = (inEds[en.id] || []).filter(function (n) { return n !== e.no; });
      return el("tr", {}, [
        el("td", { text: i + 1 }),
        el("td", {}, [name]),
        el("td", {}, [inputOf(en, "field", "분야")]),
        el("td", { style: "min-width:280px" }, [inputOf(en, "desc", "경력")]),
        el("td", {}, others.length ? others.map(function (n) { return el("span", { class: "ad-tag", text: "제" + n + "회" }); }) : [el("span", { class: "ad-hint", text: "—" })]),
        el("td", { class: "tools" }, [
          btn("▲", function () { move(L, i, -1); }, "small", "위로"),
          btn("▼", function () { move(L, i, 1); }, "small", "아래로"),
          btn("빼기", function () { L.splice(i, 1); touch(); render(); }, "small danger", "이 회차 명단에서만 뺍니다")
        ])
      ]);
    });
    function inputOf(obj, key, ph) {
      var i = el("input", { value: obj[key] || "", placeholder: ph });
      i.addEventListener("input", function () { obj[key] = i.value; touch(); });
      return i;
    }

    /* 작가 추가 칸 */
    var listId = "ad-artist-list";
    var dl = el("datalist", { id: listId }, S.artists.map(function (a) {
      return el("option", { value: a.name + " · " + (latest(a.id).field || a.field || "") + " · " + ((inEds[a.id] || []).map(function (n) { return n + "회"; }).join(",") || "참여 없음") + " #" + a.id });
    }));
    var addInp = el("input", { class: "ad-input", list: listId, placeholder: "작가 이름을 입력하세요 (등록된 작가는 목록에서 고르기)", style: "max-width:420px" });
    function addArtist() {
      var val = addInp.value.trim(); if (!val) return;
      var m = val.match(/#(\w+)$/), id = m && M[m[1]] ? m[1] : null;
      if (!id) {
        var same = S.artists.filter(function (a) { return a.name === val; });
        if (same.length && confirm("‘" + val + "’ 작가가 이미 등록되어 있습니다.\n같은 사람이면 [확인], 이름만 같은 다른 사람이면 [취소]를 누르세요.")) id = same[0].id;
      }
      if (!id) {
        id = newArtistId();
        S.artists.push({ id: id, name: val.replace(/\s*#\w+$/, ""), field: "", desc: "" });
      }
      if (L.some(function (en) { return en.id === id; })) { toast("이미 이 회차 명단에 있습니다."); return; }
      var lt = latest(id);
      L.push({ id: id, field: lt.field || "", desc: lt.desc || "" });
      addInp.value = ""; touch(); render();
      toast("명단 맨 아래에 추가했습니다. 분야·경력을 확인해 주세요.");
    }
    addInp.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); addArtist(); } });

    var copyFrom = el("select", { class: "ad-input", style: "max-width:200px" }, [el("option", { value: "", text: "다른 회차 명단 더하기…" })]
      .concat(S.editions.filter(function (x) { return x.no !== e.no; }).map(function (x) { return el("option", { value: x.no, text: "제" + x.no + "회 (" + x.artists.length + "명)" }); })));
    copyFrom.addEventListener("change", function () {
      var src = edition(Number(copyFrom.value)); if (!src) return;
      var n = 0;
      src.artists.forEach(function (en) {
        if (!L.some(function (x) { return x.id === en.id; })) { L.push({ id: en.id, field: en.field, desc: en.desc }); n++; }
      });
      touch(); render(); toast("제" + src.no + "회에서 " + n + "명을 더했습니다(이미 있는 작가는 건너뜀).");
    });

    v.push(el("div", { class: "ad-card" }, [
      el("h2", { text: "제" + e.no + "회 초대작가 명단 (" + L.length + "명)" }),
      el("p", { class: "ad-hint", text: "분야·경력은 회차마다 따로 저장됩니다(그 회차 당시 경력). 이름은 모든 회차가 함께 씁니다. 사이트에는 15명씩 페이지로 나뉘어 보입니다." }),
      el("div", { class: "ad-row", style: "margin-bottom:14px" }, [addInp, dl, btn("＋ 명단에 추가", addArtist, "primary"), el("div", { class: "ad-spacer" }), copyFrom,
        btn("가나다순 정렬", function () { L.sort(function (x, y) { return M[x.id].name.localeCompare(M[y.id].name, "ko"); }); touch(); render(); }, "small"),
        btn("가나다 거꾸로", function () { L.sort(function (x, y) { return M[y.id].name.localeCompare(M[x.id].name, "ko"); }); touch(); render(); }, "small")]),
      L.length ? el("div", { class: "ad-table-wrap" }, [el("table", { class: "ad-table" }, [
        el("thead", {}, [el("tr", {}, ["#", "작가명", "분야", "경력", "다른 참여 회차", ""].map(function (t) { return el("th", { text: t }); }))]),
        el("tbody", {}, rows)])]) : el("div", { class: "ad-empty", text: "명단이 비어 있습니다. 위에서 작가를 추가하거나 다른 회차 명단을 더하세요." })
    ]));

    v.push(el("div", { class: "ad-card" }, [
      el("h2", { text: "제" + e.no + "회 초대작가 전시작품 도록 (" + e.artistBook.pages.length + "쪽)" }),
      el("p", { class: "ad-hint", text: "초대작가 페이지의 [보기] 버튼을 누르면 나오는 도록입니다." }),
      bookEditor(e.artistBook, edDir(e, "artists"), "초대작가 전시작품", [])
    ]));

    /* 전체 작가 */
    var open = !!ui.open.master;
    var det = el("details", { class: "ad-card" }, [
      el("summary", { style: "cursor:pointer" }, [el("b", { text: "등록된 전체 작가 (" + S.artists.length + "명) — 이름 고치기 · 지우기" })]),
      el("p", { class: "ad-hint", style: "margin:12px 0", text: "어느 회차에도 없는 작가만 지울 수 있습니다. 이름을 고치면 모든 회차 명단에 함께 바뀝니다." }),
      el("div", { class: "ad-table-wrap" }, [el("table", { class: "ad-table" }, [
        el("thead", {}, [el("tr", {}, ["작가명", "참여 회차", ""].map(function (t) { return el("th", { text: t }); }))]),
        el("tbody", {}, S.artists.slice().sort(function (x, y) { return x.name.localeCompare(y.name, "ko"); }).map(function (a) {
          var nm = el("input", { value: a.name }); nm.addEventListener("input", function () { a.name = nm.value; touch(); });
          var eds = inEds[a.id] || [];
          return el("tr", {}, [el("td", {}, [nm]),
            el("td", {}, eds.length ? eds.map(function (n) { return el("span", { class: "ad-tag", text: "제" + n + "회" }); }) : [el("span", { class: "ad-hint", text: "참여 없음" })]),
            el("td", { class: "tools" }, [eds.length ? null : btn("지우기", function () { S.artists.splice(S.artists.indexOf(a), 1); touch(); render(); }, "small danger")])]);
        }))])])
    ]);
    det.open = open;
    det.addEventListener("toggle", function () { ui.open.master = det.open; });
    v.push(det);
    return v;
  }
  function latest(id) {
    for (var i = S.editions.length - 1; i >= 0; i--) {
      var en = S.editions[i].artists.filter(function (x) { return x.id === id; })[0];
      if (en) return en;
    }
    return S.artists.filter(function (a) { return a.id === id; })[0] || {};
  }
  function newArtistId() {
    var max = 0;
    S.artists.forEach(function (a) { var n = parseInt(String(a.id).replace(/\D/g, ""), 10); if (n > max) max = n; });
    var s = String(max + 1); while (s.length < 3) s = "0" + s;
    return "a" + s;
  }

  /* =========================================================
     화면: 알림마당
     ========================================================= */
  function viewNotices() {
    var v = [], N = S.notices;
    v.push(el("h1", { text: "알림마당" }));
    v.push(el("p", { class: "ad-lead", text: "글을 쓰고 고치고 지웁니다. 위에 있는 글이 목록 맨 위에 보입니다. 첨부파일이 사진이면 글 안에 사진도 함께 보입니다." }));
    v.push(el("div", { class: "ad-row", style: "margin-bottom:16px" }, [btn("＋ 새 글 쓰기", function () {
      var max = 0; N.forEach(function (n) { var k = parseInt(n.id, 10); if (k > max) max = k; });
      var n = { id: String(max + 1), title: "", date: today(), file: "", body: "" };
      N.unshift(n); ui.open["n" + n.id] = true; touch(); render();
    }, "primary")]));
    if (!N.length) v.push(el("div", { class: "ad-empty", text: "글이 없습니다." }));
    N.forEach(function (n, i) {
      var det = el("details", { class: "ad-card" }, [
        el("summary", { style: "cursor:pointer;display:flex;gap:12px;align-items:center" }, [
          el("b", { text: n.title || "(제목 없음)" }), el("span", { class: "ad-hint", text: String(n.date || "").replace(/-/g, ".") }),
          pending[n.file] ? el("span", { class: "ad-new", text: "새 첨부" }) : null]),
        el("div", { style: "margin-top:16px" }, [
          el("div", { class: "ad-grid" }, [
            field("제목", n, "title", { wide: true }),
            field("날짜", n, "date", { type: "date" }),
            field("본문 (비워도 됩니다)", n, "body", { type: "textarea", wide: true }),
            imgField("첨부파일 (사진·PDF·한글 파일 등)", n, "file", "images/notice", { accept: "", clearable: true, wide: true,
              hint: "사진(JPG·PNG)이면 글 안에 그대로 보이고, 그 밖의 파일은 [첨부파일 내려받기] 버튼만 보입니다." })
          ]),
          el("div", { class: "ad-row", style: "margin-top:14px" }, [
            btn("▲ 위로", function () { move(N, i, -1); }, "small"),
            btn("▼ 아래로", function () { move(N, i, 1); }, "small"),
            el("div", { class: "ad-spacer" }),
            el("span", { class: "ad-hint", text: "주소: notice-view.html?id=" + n.id }),
            btn("글 지우기", function () { if (confirm("‘" + (n.title || "제목 없음") + "’ 글을 지울까요?")) { N.splice(i, 1); touch(); render(); } }, "small danger")
          ])
        ])
      ]);
      det.open = !!ui.open["n" + n.id];
      det.addEventListener("toggle", function () { ui.open["n" + n.id] = det.open; });
      v.push(det);
    });
    return v;
  }

  /* =========================================================
     화면: 사용 방법
     ========================================================= */
  function viewHelp() {
    var h = el("div", { class: "ad-help" });
    h.innerHTML =
      '<h1>사용 방법</h1><p class="ad-lead">이 편집기는 내 컴퓨터의 사이트 폴더 안에서 엽니다. 고친 뒤 저장하고, 바뀐 파일을 호스팅에 올리면 됩니다.</p>' +
      '<div class="ad-card"><h2>1. 편집기 열기</h2><ol>' +
      '<li>사이트 폴더(index.html 이 있는 폴더)에서 <code>admin.html</code> 을 <b>크롬</b> 또는 <b>엣지</b>로 엽니다.</li>' +
      '<li>위쪽 [사이트 폴더 연결]을 누르고 그 사이트 폴더를 고른 뒤 ‘파일 수정 허용’을 눌러 주세요.</li></ol></div>' +
      '<div class="ad-card"><h2>2. 고치기</h2><ul>' +
      '<li><b>메인 사진</b>: 배너 사진 바꾸기·추가·순서 바꾸기</li>' +
      '<li><b>회차 관리</b>: 새 회차(예: 제20회) 만들기, 대표 회차 정하기</li>' +
      '<li><b>수상작</b>: 회차를 고르고 종합대상 · 부문대상 · 최우수상/우수상 · 장려상/삼채상/오채상 · 특선 · 입선 채우기</li>' +
      '<li><b>초대작가</b>: 회차별 명단(이전 회차에서 불러오기 가능)과 전시작품 도록</li>' +
      '<li><b>알림마당</b>: 글 쓰기·고치기·지우기, 첨부파일 올리기</li></ul>' +
      '<p class="ad-hint">사진을 고르면 사이트 폴더 안 알맞은 자리(예: <code>images/ed20/excellence/</code>)에 저장됩니다.</p></div>' +
      '<div class="ad-card"><h2>3. 저장하기</h2><ul>' +
      '<li><b>[폴더에 저장]</b> (크롬·엣지): 내용 파일 <code>data/site-data.js</code> 와 새로 고른 사진이 사이트 폴더에 바로 저장됩니다. 저장 뒤 index.html 등을 열어 확인하세요.</li>' +
      '<li><b>[바뀐 파일 내려받기(zip)]</b>: 폴더 연결이 안 되는 브라우저용입니다. 받은 zip 을 사이트 폴더에 풀어 ‘덮어쓰기’ 하세요.</li></ul>' +
      '<p class="ad-hint">저장하지 않고 창을 닫으면 고친 내용이 사라집니다.</p></div>' +
      '<div class="ad-card"><h2>4. 사이트에 올리기(배포)</h2><ul>' +
      '<li>바뀐 파일만 올리면 됩니다: <code>data/site-data.js</code> 와 새로 추가한 사진(<code>images/…</code>).</li>' +
      '<li><code>admin.html</code>, <code>css/admin.css</code>, <code>js/admin.js</code> 는 내 컴퓨터에서만 쓰는 편집기이므로 올리지 않아도 됩니다.</li></ul></div>';
    return [h];
  }

  /* =========================================================
     저장
     ========================================================= */
  function dataJS() {
    return "/* (사)한반도문화예술협회 사이트 내용 — admin.html(편집기)에서 저장하면 자동으로 다시 만들어집니다.\n" +
      "   직접 고치셔도 되지만, 따옴표·쉼표가 하나라도 틀리면 사이트가 보이지 않으니 편집기를 쓰세요.\n" +
      "   마지막 저장: " + new Date().toLocaleString("ko-KR") + " */\n" +
      "window.SITE_DATA = " + JSON.stringify(S, null, 2) + ";\n";
  }
  function liveFiles() {
    var used = usedPaths();
    return Object.keys(pending).filter(function (p) { return used[p]; });
  }
  function check() {
    var warn = [];
    S.editions.forEach(function (e) {
      e.awards.grandPrize.winners.forEach(function (w, i) { if (!w.image) warn.push("제" + e.no + "회 부문대상 " + (i + 1) + "번째 수상자의 작품 사진이 없습니다."); });
      if (e.awards.grand.name && !e.awards.grand.image) warn.push("제" + e.no + "회 종합대상 작품 사진이 없습니다.");
    });
    S.home.banner.forEach(function (b, i) { if (!b.src) warn.push("배너 " + (i + 1) + "번째 사진이 없습니다."); });
    S.notices.forEach(function (n) { if (!n.title) warn.push("제목 없는 알림마당 글이 있습니다."); });
    return warn;
  }
  function confirmWarn() {
    var w = check();
    return !w.length || confirm("확인이 필요한 곳이 있습니다. 그래도 저장할까요?\n\n- " + w.slice(0, 8).join("\n- "));
  }

  async function connectFolder() {
    if (!window.showDirectoryPicker) {
      alert("이 브라우저는 폴더에 바로 저장할 수 없습니다.\n크롬이나 엣지로 여시거나, [바뀐 파일 내려받기(zip)]를 쓰세요.");
      return false;
    }
    try {
      var h = await window.showDirectoryPicker({ id: "hanbando-site", mode: "readwrite" });
      var ok = true;
      try { await h.getFileHandle("index.html"); await h.getDirectoryHandle("js"); } catch (e) { ok = false; }
      if (!ok && !confirm("고른 폴더에 index.html 이 없습니다. 사이트 폴더가 맞나요?\n(맞으면 [확인])")) return false;
      dirHandle = h; status();
      toast("‘" + h.name + "’ 폴더에 연결했습니다.");
      return true;
    } catch (e) { if (e && e.name !== "AbortError") alert("폴더를 열지 못했습니다: " + e.message); return false; }
  }
  async function writeFile(root, path, data) {
    var parts = path.split("/"), name = parts.pop(), dir = root;
    for (var i = 0; i < parts.length; i++) dir = await dir.getDirectoryHandle(parts[i], { create: true });
    var fh = await dir.getFileHandle(name, { create: true });
    var w = await fh.createWritable();
    await w.write(data); await w.close();
  }
  async function saveFolder() {
    if (!dirHandle && !(await connectFolder())) return;
    if (!confirmWarn()) return;
    try {
      if (dirHandle.requestPermission && (await dirHandle.requestPermission({ mode: "readwrite" })) !== "granted") { toast("폴더 저장을 허용해 주세요."); return; }
      var files = liveFiles();
      for (var i = 0; i < files.length; i++) await writeFile(dirHandle, files[i], pending[files[i]]);
      await writeFile(dirHandle, "data/site-data.js", new Blob([dataJS()], { type: "text/javascript" }));
      pending = {}; dirty = false; status(); render();
      toast("저장했습니다. (내용 파일 1개" + (files.length ? " + 새 파일 " + files.length + "개" : "") + ") 사이트 페이지를 새로고침해 확인하세요.", 5000);
    } catch (e) { alert("저장하지 못했습니다: " + (e && e.message)); }
  }

  /* zip 만들기 (압축 없이 묶기) */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipBlob(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
        date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
      ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true);
      ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, b) { return s + b.byteLength; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: "application/zip" });
  }
  async function saveZip() {
    if (!confirmWarn()) return;
    var list = [{ name: "data/site-data.js", data: new TextEncoder().encode(dataJS()) }];
    var files = liveFiles();
    for (var i = 0; i < files.length; i++) list.push({ name: files[i], data: new Uint8Array(await pending[files[i]].arrayBuffer()) });
    var a = el("a", { href: URL.createObjectURL(zipBlob(list)), download: "hanbando-update-" + today() + ".zip" });
    document.body.appendChild(a); a.click(); a.remove();
    pending = {}; dirty = false; status(); render();   /* 미리보기는 그대로 유지 */
    toast("받은 zip 을 사이트 폴더에 풀어 덮어쓰세요. (내용 파일 1개" + (files.length ? " + 새 파일 " + files.length + "개" : "") + ")", 6000);
  }

  /* =========================================================
     그리기
     ========================================================= */
  function status() {
    var s = document.getElementById("ad-status");
    var n = liveFiles().length;
    s.innerHTML = "";
    s.appendChild(el("span", {}, [
      "대표 회차 ", el("b", { text: S.currentEdition ? "제" + S.currentEdition + "회" : "없음" }), " · ",
      dirty ? el("span", { class: "dirty", text: "● 저장하지 않은 변경 있음" + (n ? " (새 파일 " + n + "개)" : "") }) : el("span", { text: "저장된 상태" }), " · 폴더: ",
      el("b", { text: dirHandle ? dirHandle.name : "연결 안 됨" })
    ]));
    document.getElementById("ad-folder").textContent = dirHandle ? "폴더 다시 고르기" : "사이트 폴더 연결";
  }
  function go(view) { ui.view = view; window.scrollTo(0, 0); render(); }
  function render() {
    var y = window.scrollY;
    var box = document.getElementById("ad-view");
    var views = { home: viewHome, editions: viewEditions, awards: viewAwards, artists: viewArtists, notices: viewNotices, help: viewHelp };
    box.innerHTML = "";
    if (!loadedOK) box.appendChild(el("div", { class: "ad-note error", text: "data/site-data.js 를 읽지 못했습니다. admin.html 이 사이트 폴더(index.html 이 있는 곳) 안에 있는지 확인하세요." }));
    (views[ui.view] || viewHome)().forEach(function (n) { box.appendChild(n); });
    document.querySelectorAll(".ad-nav button").forEach(function (b) {
      if (b.getAttribute("data-view") === ui.view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    window.scrollTo(0, y);
    status();
  }

  document.querySelectorAll(".ad-nav button").forEach(function (b) {
    b.addEventListener("click", function () { go(b.getAttribute("data-view")); });
  });
  document.getElementById("ad-folder").addEventListener("click", connectFolder);
  document.getElementById("ad-save").addEventListener("click", saveFolder);
  document.getElementById("ad-zip").addEventListener("click", saveZip);
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  if (!window.showDirectoryPicker) document.getElementById("ad-save").title = "크롬·엣지에서만 쓸 수 있습니다";
  render();
})();
