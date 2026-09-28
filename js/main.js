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

  /* ---------- 목록 검색 (초대작가 / 공지사항) ---------- */
  document.querySelectorAll("[data-search]").forEach(function (form) {
    var table = document.getElementById(form.getAttribute("data-search"));
    if (!table) return;
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-row]"));
    var empty = table.querySelector(".no-result");
    var input = form.querySelector("input");
    var select = form.querySelector("select");

    function run() {
      var q = input.value.trim().toLowerCase();
      var field = select ? select.value : "all";
      var shown = 0;
      rows.forEach(function (tr) {
        var hay = (field === "all" ? tr.textContent : (tr.getAttribute("data-" + field) || "")).toLowerCase();
        var ok = !q || hay.indexOf(q) !== -1;
        tr.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    input.addEventListener("input", run);
  });

  /* ---------- 공지 상세 (?id=) ---------- */
  var view = document.querySelector("[data-notice-view]");
  if (view) {
    var notices = {
      "1": { title: "제19회 한반도미술대전 초대작가 출품원서", date: "2026.06.10", file: "제19회_한반도미술대전_초대작가_출품원서.jpg" },
      "2": { title: "제19회 한반도미술대전 출품원서", date: "2026.06.10", file: "제19회_한반도미술대전_출품원서.jpg" },
      "3": { title: "제19회 한반도미술대전 개최요강", date: "2026.06.10", file: "제19회_한반도미술대전_개최요강.jpg" }
    };
    var id = new URLSearchParams(location.search).get("id") || "1";
    var n = notices[id] || notices["1"];
    view.querySelector("h2").textContent = n.title;
    var t = view.querySelector("time");
    t.textContent = n.date;
    t.setAttribute("datetime", n.date.replace(/\./g, "-"));
    var src = "files/notice/" + n.file;
    var dl = view.querySelector(".dl-btn");
    dl.href = src;
    dl.setAttribute("download", n.file);
    dl.querySelector("small").textContent = n.file;
    var img = view.querySelector(".notice-file img");
    img.src = src;
    img.alt = n.title;
    document.title = n.title + " | 공지사항 | (사)한반도문화예술협회";
  }
})();
