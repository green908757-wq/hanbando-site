/* (사)한반도문화예술협회 — 공통 스크립트 */
(function () {
  "use strict";

  /* ---------- 이미지 파일이 아직 없을 때 깨진 아이콘 숨김 ---------- */
  document.querySelectorAll("img:not(.logo img)").forEach(function (img) {
    function miss() { img.classList.add("is-missing"); }
    if (img.complete && img.naturalWidth === 0) miss();
    else img.addEventListener("error", miss);
  });

  /* ---------- 슬라이더 (수상작품 / 초대작가 전시작품 / 도록) ----------
     data-book 이 붙은 슬라이더는 도록 뷰어: 처음·끝에서 멈춤, 쪽수 표시, 드래그·스와이프 */
  var mqMobile = window.matchMedia("(max-width: 767px)");

  document.querySelectorAll("[data-slider]").forEach(function (slider) {
    var track = slider.querySelector(".slider-track");
    var slides = Array.prototype.slice.call(track.children);
    var prev = slider.querySelector(".slider-btn.prev");
    var next = slider.querySelector(".slider-btn.next");
    var dotsWrap = slider.querySelector(".slider-dots");
    var count = slider.querySelector(".book-count");
    var stage = slider.querySelector(".book-stage");
    var isBook = slider.hasAttribute("data-book");
    var total = slides.length;
    var index = 0;

    slider._indexOf = function (el) { return slides.indexOf(el); };

    if (total <= 1) {
      if (prev) prev.hidden = true;
      if (next) next.hidden = true;
      slider._go = function () {};
      return;
    }

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", isBook ? (i + 1) + "쪽 보기" : (i + 1) + "번째 작품 보기");
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      if (isBook) index = Math.max(0, Math.min(total - 1, i));
      else index = (i + total) % total;
      track.style.transform = "translateX(" + (-100 * index) + "%)";
      slides.forEach(function (s, n) { s.setAttribute("aria-hidden", n !== index ? "true" : "false"); });
      dots.forEach(function (d, n) { d.setAttribute("aria-current", n === index ? "true" : "false"); });
      if (isBook) {
        prev.disabled = index === 0;
        next.disabled = index === total - 1;
        if (count) count.textContent = (index + 1) + " / " + total;
      }
    }
    slider._go = go;

    prev.addEventListener("click", function () { go(index - 1); });
    next.addEventListener("click", function () { go(index + 1); });
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    });

    if (isBook && stage) {
      // 드래그 / 스와이프로 넘기기
      var startX = null, startY = null, dragging = false, horizontal = null;
      function down(x, y) { startX = x; startY = y; dragging = true; horizontal = null; }
      function move(x, y, e) {
        if (!dragging) return;
        var dx = x - startX, dy = y - startY;
        if (horizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          horizontal = Math.abs(dx) > Math.abs(dy);
          if (horizontal) { track.classList.add("no-anim"); stage.classList.add("dragging"); }
        }
        if (!horizontal) return;
        if (e && e.cancelable) e.preventDefault();
        var pct = (dx / stage.clientWidth) * 100;
        track.style.transform = "translateX(" + (-index * 100 + pct) + "%)";
      }
      function up(x) {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("no-anim"); stage.classList.remove("dragging");
        if (!horizontal) return;
        var dx = x - startX, th = stage.clientWidth * 0.15;
        if (dx > th) go(index - 1); else if (dx < -th) go(index + 1); else go(index);
      }
      stage.addEventListener("touchstart", function (e) { down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
      stage.addEventListener("touchmove", function (e) { move(e.touches[0].clientX, e.touches[0].clientY, e); }, { passive: false });
      stage.addEventListener("touchend", function (e) { up(e.changedTouches[0].clientX); });
      stage.addEventListener("mousedown", function (e) { e.preventDefault(); down(e.clientX, e.clientY); });
      window.addEventListener("mousemove", function (e) { move(e.clientX, e.clientY); });
      window.addEventListener("mouseup", function (e) { up(e.clientX); });

      // HTML로 짠 펼침면(부문대상)은 무대 폭에 맞춰 축소
      if (stage.querySelector(".spread")) {
        var fit = function () { stage.style.setProperty("--k", stage.clientWidth / 1778); };
        if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
        else window.addEventListener("resize", fit);
        fit();
      }
      go(0);
      return;
    }

    // 모바일 화면(세로 카드 목록)에서는 모든 작품을 보여 줌
    function sync() {
      if (mqMobile.matches) slides.forEach(function (s) { s.removeAttribute("aria-hidden"); });
      else go(index);
    }
    if (mqMobile.addEventListener) mqMobile.addEventListener("change", sync); else mqMobile.addListener(sync);
    sync();
  });

  /* ---------- 대문 띠 슬라이드: 2초마다 한 칸씩 부드럽게 이동, 끝나면 처음으로 이어짐 ---------- */
  document.querySelectorAll("[data-banner]").forEach(function (stage) {
    var track = stage.querySelector(".banner-track");
    var half = track.children.length / 2;           // 같은 그림 두 벌 중 한 벌의 개수
    var step = 100 / track.children.length;          // 트랙 기준 한 칸 비율(%)
    var ms = 2000, i = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setInterval(function () {
      if (document.hidden) return;
      i++;
      track.style.transition = "transform " + ms + "ms cubic-bezier(0.65, 0, 0.35, 1)";
      track.style.transform = "translateX(-" + (i * step) + "%)";
      if (i === half) {
        setTimeout(function () {
          track.style.transition = "none";
          track.style.transform = "translateX(0)";
          i = 0;
        }, ms);
      }
    }, ms);
  });

  /* ---------- 주소의 #위치로 이동 (수상작 → 수상작품 페이지) ----------
     예) awards-works.html#prize-excellent → '최우수상 우수상' 도록의 '우수상' 첫 쪽 */
  function openHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    var slide = target.closest(".slide, .book-slide");
    var slider = target.closest("[data-slider]");
    var section = target.closest(".award-section") || target;
    var stacked = mqMobile.matches && slider && !slider.hasAttribute("data-book");

    function resetScroll() {
      // 브라우저 기본 앵커 이동이 슬라이더를 가로로 밀지 않도록
      if (!slider) return;
      slider.scrollLeft = 0;
      var st = slider.querySelector(".book-stage");
      if (st) st.scrollLeft = 0;
    }
    if (slide && slider && slider._go) {
      slider._go(slider._indexOf(slide));
      resetScroll();
    }
    // 수상 구분 바가 보이도록 구역 맨 위로 (모바일 세로 카드 목록은 해당 카드로)
    var dest = stacked && slide ? slide : section;
    requestAnimationFrame(function () {
      resetScroll();
      dest.scrollIntoView({ block: "start" });
    });
  }
  window.addEventListener("hashchange", openHash);
  window.addEventListener("load", openHash);
  if (document.readyState === "complete") openHash();   /* 늦게 불러와진 경우 */

  /* ---------- 목록: 검색 + 페이지 넘김 (초대작가 / 알림마당 공통) ----------
     <form data-list="표 id" data-pager="페이지 번호 id" data-per-page="15" data-live>
     - 검색 항목 select 값이 "all"이면 줄 전체 글자, 그 밖에는 줄의 data-값(data-name, data-title …)에서 찾음
     - data-live 가 있으면 글자를 입력하는 동안 바로 찾음
     - 이전·다음 페이지가 없으면 Prev·Next는 표시하지 않음 */
  document.querySelectorAll("form[data-list]").forEach(function (form) {
    var table = document.getElementById(form.getAttribute("data-list"));
    var pager = document.getElementById(form.getAttribute("data-pager"));
    if (!table || !pager) return;
    var PER_PAGE = parseInt(form.getAttribute("data-per-page"), 10) || 15;
    var input = form.querySelector("input");
    var select = form.querySelector("select");
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-row]"));
    var noResult = table.querySelector("tr.no-result");
    var matched = rows.slice(), page = 1;

    function filter() {
      var q = input.value.trim().toLowerCase();
      var key = select ? select.value : "all";
      matched = rows.filter(function (tr) {
        if (!q) return true;
        var text = key === "all" ? tr.textContent : (tr.getAttribute("data-" + key) || "");
        return text.toLowerCase().indexOf(q) !== -1;
      });
      page = 1;
      render();
    }

    function render() {
      var total = Math.max(1, Math.ceil(matched.length / PER_PAGE));
      if (page > total) page = total;
      var start = (page - 1) * PER_PAGE;
      rows.forEach(function (tr) { tr.hidden = true; });
      matched.slice(start, start + PER_PAGE).forEach(function (tr) { tr.hidden = false; });
      if (noResult) noResult.hidden = matched.length > 0;

      var html = page > 1 ? '<a href="#" data-page="prev" aria-label="이전 페이지">Prev</a>' : "";
      for (var i = 1; i <= total; i++) {
        html += i === page
          ? '<strong aria-current="page">' + i + "</strong>"
          : '<a href="#" data-page="' + i + '" aria-label="' + i + '페이지">' + i + "</a>";
      }
      if (page < total) html += '<a href="#" data-page="next" aria-label="다음 페이지">Next</a>';
      pager.innerHTML = html;
    }

    pager.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-page]");
      if (!a) return;
      e.preventDefault();
      var total = Math.max(1, Math.ceil(matched.length / PER_PAGE));
      var v = a.getAttribute("data-page");
      page = v === "prev" ? page - 1 : v === "next" ? page + 1 : parseInt(v, 10);
      page = Math.min(Math.max(page, 1), total);
      render();
      table.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); filter(); });
    input.addEventListener("search", filter);              /* x 버튼으로 지웠을 때 */
    if (form.hasAttribute("data-live")) {
      input.addEventListener("input", filter);
      if (select) select.addEventListener("change", filter);
    }
    render();
  });
})();

/* ===== 도록 확대 보기 (수상작품 · 초대작가 전시작품 공통) — 모바일: 도록 슬라이드 크게 보기(두 손가락 확대 · 두 번 탭 확대 · 넘기기) ===== */
(function () {
  var mq = window.matchMedia('(max-width: 767px)');
  var sliders = Array.prototype.slice.call(document.querySelectorAll('.slider.book'));
  if (!sliders.length) return;

  var ICON = {
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    rot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><polyline points="20 4 20 9 15 9"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
  };

  /* 확대 보기 창 */
  var lb = document.createElement('div');
  lb.className = 'zv';
  lb.hidden = true;
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', '작품 크게 보기');
  lb.innerHTML =
    '<div class="zv-stage"><div class="zv-content"></div></div>' +
    '<div class="zv-top"><p class="zv-count" aria-live="polite"></p><div class="zv-tools">' +
    '<button type="button" class="zv-ic zv-rot" aria-label="화면 돌려 보기">' + ICON.rot + '</button>' +
    '<button type="button" class="zv-ic zv-close" aria-label="닫기">' + ICON.close + '</button></div></div>' +
    '<button type="button" class="zv-nav prev" aria-label="이전 페이지">' + ICON.prev + '</button>' +
    '<button type="button" class="zv-nav next" aria-label="다음 페이지">' + ICON.next + '</button>' +
    '<p class="zv-hint">두 손가락으로 벌리거나 두 번 탭하면 확대돼요</p>';
  document.body.appendChild(lb);

  var stage = lb.querySelector('.zv-stage');
  var content = lb.querySelector('.zv-content');
  var countEl = lb.querySelector('.zv-count');
  var btnPrev = lb.querySelector('.zv-nav.prev');
  var btnNext = lb.querySelector('.zv-nav.next');
  var hint = lb.querySelector('.zv-hint');

  var cur = { slider: null, slides: [], idx: 0, title: '' };
  var base = { w: 1, h: 1 };
  var S = 1, tx = 0, ty = 0, rot = 0, fit = 1;
  var MAX = 5, pushed = false, hintTimer = 0;

  function vp() { return { w: stage.clientWidth, h: stage.clientHeight }; }
  function box() { return rot ? { w: base.h, h: base.w } : { w: base.w, h: base.h }; }
  function clampPan() {
    var v = vp(), b = box();
    var mx = Math.max(0, (b.w * fit * S - v.w) / 2);
    var my = Math.max(0, (b.h * fit * S - v.h) / 2);
    tx = Math.min(mx, Math.max(-mx, tx));
    ty = Math.min(my, Math.max(-my, ty));
  }
  function apply(anim) {
    content.classList.toggle('anim', !!anim);
    content.style.transform = 'translate(-50%,-50%) translate(' + tx + 'px,' + ty + 'px) rotate(' + rot + 'deg) scale(' + (fit * S) + ')';
  }
  function layout(anim) {
    var v = vp(), b = box();
    content.style.width = base.w + 'px';
    content.style.height = base.h + 'px';
    fit = Math.min(v.w / b.w, v.h / b.h);
    clampPan();
    apply(anim);
  }
  function reset(anim) { S = 1; tx = 0; ty = 0; layout(anim); }

  /* 슬라이드 한 장을 확대 창에 옮겨 담기 */
  function show(i) {
    var n = cur.slides.length;
    cur.idx = Math.max(0, Math.min(n - 1, i));
    var slide = cur.slides[cur.idx];
    content.innerHTML = '';
    S = 1; tx = 0; ty = 0;
    var img = slide.querySelector(':scope > img');
    if (img) {
      var im = new Image();
      im.alt = img.alt;
      im.draggable = false;
      var set = function () { base = { w: im.naturalWidth || 1000, h: im.naturalHeight || 700 }; layout(false); };
      im.onload = set;
      im.src = img.currentSrc || img.src;
      content.appendChild(im);
      var st = cur.slider.querySelector('.book-stage');
      base = { w: st.offsetWidth || 1000, h: st.offsetHeight || 700 };
      if (im.complete && im.naturalWidth) set();
    } else {
      /* 부문대상처럼 HTML로 짜인 펼침면: 화면에 보이는 모양 그대로 복제 */
      var oStage = cur.slider.querySelector('.book-stage');
      var w = oStage.offsetWidth, h = oStage.offsetHeight;
      var wrap = document.createElement('div');
      wrap.className = cur.slider.className;
      wrap.style.cssText = 'width:' + w + 'px;margin:0;padding:0;max-width:none;position:relative;';
      var st2 = document.createElement('div');
      st2.className = oStage.className;   /* 비율 클래스(ratio-…)까지 함께 */
      st2.setAttribute('style', (oStage.getAttribute('style') || '') + ';width:100%;height:' + h + 'px;margin:0;');
      var tr = document.createElement('div');
      tr.className = 'slider-track';
      tr.style.cssText = 'display:block;transform:none;transition:none;width:100%;height:100%;';
      var cl = slide.cloneNode(true);
      cl.removeAttribute('id');
      cl.removeAttribute('aria-hidden');
      cl.style.cssText = 'width:' + w + 'px;height:' + h + 'px;flex:none;opacity:1;visibility:visible;transform:none;';
      cl.querySelectorAll('img[loading]').forEach(function (x) { x.loading = 'eager'; });
      tr.appendChild(cl); st2.appendChild(tr); wrap.appendChild(st2);
      /* 선명도: 휴대폰 화면 크기(작게) 그대로 복제해 transform으로 키우면 흐려짐.
         zoom으로 여러 배 크게 다시 그려 두고, 화면에 맞게 줄였다가 확대할 때 원래 선명도로 보이게 함 */
      var R = 1;
      if (window.CSS && CSS.supports && CSS.supports('zoom', '2')) {
        var v0 = vp(), dpr = window.devicePixelRatio || 1;
        var need = MAX * Math.max(Math.min(v0.w / w, v0.h / h), Math.min(v0.w / h, v0.h / w));
        var memCap = Math.sqrt(24e6 / (w * h * dpr * dpr));   /* 휴대폰 메모리 한도 */
        R = Math.max(1, Math.min(need, memCap, 6));
      }
      wrap.style.zoom = R;
      content.appendChild(wrap);
      base = { w: w * R, h: h * R };
      layout(false);
      /* 녹색 표지 아래(칸 맨 아래까지) 흰 틈을 표지와 같은 녹색으로 채움
         — 위치를 %로 잡아서 확대·회전해도 그대로 맞음 */
      var oCover = slide.querySelector('.page.cover'), cCover = cl.querySelector('.page.cover');
      if (oCover && cCover) {
        st2.style.position = 'relative';
        content.style.transform = 'none';   /* 회전·확대를 잠깐 풀고 잰다 */
        var sR = st2.getBoundingClientRect(), cR = cCover.getBoundingClientRect();
        apply(false);
        var gapTop = (cR.bottom - sR.top) / sR.height * 100;
        if (gapTop < 99.9) {
          var fill = document.createElement('div');
          fill.className = 'zv-fill';
          fill.style.left = ((cR.left - sR.left) / sR.width * 100) + '%';
          fill.style.width = (cR.width / sR.width * 100) + '%';
          fill.style.top = Math.max(0, gapTop - 0.5) + '%';
          fill.style.background = getComputedStyle(oCover).backgroundColor;
          st2.appendChild(fill);
        }
      }
    }
    countEl.textContent = cur.title + '  ' + (cur.idx + 1) + ' / ' + n;
    btnPrev.disabled = cur.idx === 0;
    btnNext.disabled = cur.idx === n - 1;
  }

  function open(slider, i) {
    var sec = slider.closest('section');
    var h2 = sec && sec.querySelector('h2');
    cur.slider = slider;
    cur.slides = Array.prototype.slice.call(slider.querySelectorAll('.slider-track > .book-slide'));
    cur.title = h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : (slider.getAttribute('data-title') || '');
    rot = 0;
    lb.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    show(i);
    hint.classList.remove('off');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hint.classList.add('off'); }, 2600);
    try { history.pushState({ zv: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    lb.querySelector('.zv-close').focus({ preventScroll: true });
  }
  function close(fromPop) {
    if (lb.hidden) return;
    lb.hidden = true;
    content.innerHTML = '';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (!fromPop && pushed) { pushed = false; history.back(); }
    pushed = false;
    if (cur.slider) cur.slider.focus({ preventScroll: true });
  }
  window.addEventListener('popstate', function () { if (!lb.hidden) { pushed = false; close(true); } });

  /* 지금 보이는 슬라이드 찾기 */
  function currentIndex(slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll('.slider-track > .book-slide'));
    for (var k = 0; k < slides.length; k++) {
      var s = slides[k];
      if (/(^|\s)(is-)?(active|current)(\s|$)/.test(s.className) || s.getAttribute('aria-current') === 'true') return k;
    }
    var st = slider.querySelector('.book-stage').getBoundingClientRect();
    var c = st.left + st.width / 2, best = 0, bd = Infinity;
    slides.forEach(function (s, k) {
      var r = s.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - c);
      if (d < bd) { bd = d; best = k; }
    });
    return best;
  }

  /* 각 도록에 '크게 보기' 버튼 + 그림 탭하면 열기 */
  sliders.forEach(function (slider) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zv-open';
    btn.setAttribute('aria-label', '이 페이지 크게 보기');
    btn.innerHTML = ICON.zoom + '<span>크게 보기</span>';
    ['pointerdown', 'mousedown', 'touchstart'].forEach(function (ev) {
      btn.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      open(slider, currentIndex(slider));
    });
    slider.appendChild(btn);

    var st = slider.querySelector('.book-stage');
    if (!st) return;
    var d = null, justOpened = 0;
    st.addEventListener('pointerdown', function (e) {
      d = (e.isPrimary) ? { x: e.clientX, y: e.clientY, t: Date.now(), n: 1 } : null;
    }, true);
    st.addEventListener('pointermove', function (e) {
      if (d && (Math.abs(e.clientX - d.x) > 10 || Math.abs(e.clientY - d.y) > 10)) d.moved = true;
    }, true);
    st.addEventListener('pointerup', function (e) {
      if (!mq.matches || !d || d.moved || Date.now() - d.t > 500) { d = null; return; }
      if (Math.abs(e.clientX - d.x) > 10 || Math.abs(e.clientY - d.y) > 10) { d = null; return; }
      d = null;
      var hit = e.target.closest ? e.target.closest('.book-slide') : null;
      var slides = Array.prototype.slice.call(slider.querySelectorAll('.slider-track > .book-slide'));
      var i = hit ? slides.indexOf(hit) : -1;
      if (i < 0) i = currentIndex(slider);
      justOpened = Date.now();
      open(slider, i);
    }, true);
    st.addEventListener('click', function (e) {
      if (Date.now() - justOpened < 800) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  });

  /* 확대 창 조작: 두 손가락 확대, 두 번 탭, 끌어서 이동, 좌우로 밀어 넘기기 */
  var pts = new Map(), g = null, tap = null, lastTap = null, swiping = false;
  function rel(x, y) { var r = stage.getBoundingClientRect(); return { x: x - r.left - r.width / 2, y: y - r.top - r.height / 2 }; }
  function snapshot() {
    var a = Array.from(pts.values());
    g = { S: S, tx: tx, ty: ty };
    if (a.length >= 2) {
      g.mid = rel((a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2);
      g.dist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
    } else if (a.length === 1) {
      g.p = { x: a[0].x, y: a[0].y };
    }
  }
  function zoomAt(ns, p, anim) {
    ns = Math.max(1, Math.min(MAX, ns));
    tx = p.x - (p.x - tx) * (ns / S);
    ty = p.y - (p.y - ty) * (ns / S);
    S = ns; clampPan(); apply(anim);
  }
  stage.addEventListener('pointerdown', function (e) {
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    snapshot();
    tap = pts.size === 1 ? { x: e.clientX, y: e.clientY, t: Date.now() } : null;
    swiping = false;
    content.classList.remove('anim');
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var a = Array.from(pts.values());
    if (a.length >= 2 && g.mid) {
      var mid = rel((a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2);
      var dist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      var ns = Math.max(1, Math.min(MAX, g.S * dist / g.dist));
      tx = mid.x - (g.mid.x - g.tx) * (ns / g.S);
      ty = mid.y - (g.mid.y - g.ty) * (ns / g.S);
      S = ns; clampPan(); apply(false);
    } else if (a.length === 1 && g.p) {
      var dx = a[0].x - g.p.x, dy = a[0].y - g.p.y;
      if (tap && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) tap = null;
      if (S > 1.01) { tx = g.tx + dx; ty = g.ty + dy; clampPan(); apply(false); }
      else { swiping = true; tx = dx; ty = 0; apply(false); }
    }
  });
  function end(e) {
    if (!pts.has(e.pointerId)) return;
    var p0 = g && g.p, last = pts.get(e.pointerId);
    pts.delete(e.pointerId);
    if (pts.size > 0) { snapshot(); tap = null; return; }
    if (swiping && p0) {
      var dx = last.x - p0.x;
      swiping = false;
      if (Math.abs(dx) > 60) {
        var ni = cur.idx + (dx < 0 ? 1 : -1);
        if (ni >= 0 && ni < cur.slides.length) { show(ni); return; }
      }
      tx = 0; ty = 0; apply(true); return;
    }
    if (tap && Date.now() - tap.t < 300) {
      var now = Date.now();
      if (lastTap && now - lastTap.t < 320 && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < 40) {
        if (S > 1.05) reset(true); else zoomAt(2.5, rel(tap.x, tap.y), true);
        lastTap = null;
      } else {
        lastTap = { x: tap.x, y: tap.y, t: now };
      }
    }
    tap = null;
    if (S < 1.01) { S = 1; tx = 0; ty = 0; apply(true); }
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomAt(S * (e.deltaY < 0 ? 1.15 : 1 / 1.15), rel(e.clientX, e.clientY), false);
  }, { passive: false });

  btnPrev.addEventListener('click', function () { show(cur.idx - 1); });
  btnNext.addEventListener('click', function () { show(cur.idx + 1); });
  lb.querySelector('.zv-close').addEventListener('click', function () { close(false); });
  lb.querySelector('.zv-rot').addEventListener('click', function () { rot = rot ? 0 : 90; reset(true); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close(false);
    else if (e.key === 'ArrowLeft') show(cur.idx - 1);
    else if (e.key === 'ArrowRight') show(cur.idx + 1);
  });
  window.addEventListener('resize', function () { if (!lb.hidden) layout(false); });
})();

/* ===== 공지 상세: 주소의 ?id= 값에 맞는 글만 보여주기 + 첨부파일 내려받기 ===== */
(function () {
  var arts = document.querySelectorAll("[data-notice-id]");
  if (!arts.length) return;   /* 공지 상세 페이지에서만 동작 */
  var id = new URLSearchParams(location.search).get("id") || arts[0].getAttribute("data-notice-id");
  var found = false;
  arts.forEach(function (a) {
    var on = a.getAttribute("data-notice-id") === id;
    a.hidden = !on;
    if (on) found = true;
    // 그림이 파일 안에 들어 있으므로 내려받기도 그 그림으로 (폴더 경로와 상관없이 동작)
    var img = a.querySelector(".notice-file img"), btn = a.querySelector(".dl-btn");
    if (img && btn) btn.href = img.src;
  });
  if (!found && arts[0]) arts[0].hidden = false;
  var cur = document.querySelector("[data-notice-id]:not([hidden]) h2");
  if (cur) document.title = cur.textContent + " | 알림마당 | (사)한반도문화예술협회";

  /* 첨부파일 내려받기: 그림이 브라우저에서 열리지 않고 무조건 파일로 저장되게 */
  function save(blob, name) {
    if (window.navigator && navigator.msSaveOrOpenBlob) { navigator.msSaveOrOpenBlob(blob, name); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  /* 그림 파일 내용을 받아오기 (주소로 → 안 되면 화면의 그림을 jpg로) */
  function viaCanvas(img) {
    return new Promise(function (ok, no) {
      var go = function () {
        try {
          var c = document.createElement("canvas");
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          var g = c.getContext("2d");
          g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, 0);
          c.toBlob(function (bl) { bl ? ok(bl) : no(); }, "image/jpeg", 0.95);
        } catch (e) { no(e); }
      };
      if (img.complete && img.naturalWidth) go();
      else { img.addEventListener("load", go, { once: true }); img.loading = "eager"; }
    });
  }
  function getBlob(src, img) {
    var byUrl = (window.fetch && !/^file:/i.test(src))
      ? fetch(src).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      : Promise.reject();
    return byUrl.catch(function () { if (img) return viaCanvas(img); throw 0; });
  }

  document.querySelectorAll(".notice-view .dl-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var name = btn.getAttribute("download") || "첨부파일.jpg";
      var img = btn.closest(".notice-view").querySelector(".notice-file img");
      var src = btn.href;
      var ext = (name.match(/\.[^.]+$/) || [".jpg"])[0].toLowerCase();
      var mime = ext === ".png" ? "image/png" : ext === ".pdf" ? "application/pdf" : "image/jpeg";

      /* 크롬·엣지: 저장 창을 '바탕화면'에서 열어 바로 저장 */
      if (window.showSaveFilePicker) {
        var opts = { suggestedName: name, startIn: "desktop",
          types: [{ description: "첨부파일", accept: {} }] };
        opts.types[0].accept[mime] = [ext];
        window.showSaveFilePicker(opts).then(function (handle) {
          return getBlob(src, img).then(function (blob) {
            return handle.createWritable().then(function (w) {
              return w.write(blob).then(function () { return w.close(); });
            });
          });
        }).catch(function (err) {
          if (err && err.name === "AbortError") return;   /* 저장 창에서 취소 */
          getBlob(src, img).then(function (b) { save(b, name); }, function () { location.href = src; });
        });
        return;
      }
      /* 그 밖의 브라우저: 파일로 내려받기(브라우저 기본 다운로드 폴더) */
      getBlob(src, img).then(function (b) { save(b, name); }, function () { location.href = src; });
    });
  });
})();
