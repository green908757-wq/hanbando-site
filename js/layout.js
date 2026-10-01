/* (사)한반도문화예술협회 — 모든 페이지 공통 머리말(헤더)·꼬리말(푸터)
   메뉴나 주소·연락처를 바꿀 때는 이 파일 한 곳만 고치면 모든 페이지에 반영됩니다.
   각 페이지 <body data-menu="..."> 값으로 지금 페이지 메뉴에 표시가 붙습니다. */
(function () {
  "use strict";

  var MENU = [
    { key: "about",   href: "greeting.html", label: "협회소개" },
    { key: "awards",  href: "awards.html",   label: "수상작" },
    { key: "artists", href: "artists.html",  label: "초대작가" },
    { key: "notice",  href: "notice.html",   label: "알림마당" }
  ];

  var FOOTER =
    '<div class="container">' +
      '<strong>(사)한반도문화예술협회</strong>' +
      '<address>' +
        '<span>주소: 강원특별자치도 원주시 강변로 525 (평원동)</span>' +
        '<span>E-mail. <a href="mailto:greencomm@hanmail.net">greencomm@hanmail.net</a></span>' +
        '<span>Tel. <a href="tel:07086219936">070-8621-9936</a></span>' +
      '</address>' +
      '<hr>' +
      '<small>© 2026 (사)한반도문화예술협회. All rights reserved.</small>' +
    '</div>';

  function headerHTML(active) {
    var items = MENU.map(function (m) {
      return '<li><a href="' + m.href + '"' + (m.key === active ? ' aria-current="page"' : '') + '>' + m.label + '</a></li>';
    }).join("");
    return '<div class="container">' +
        '<a class="logo" href="index.html" aria-label="(사)한반도문화예술협회 홈">' +
          '<img src="images/19-image1/한반도 로고.jpg" alt="(사)한반도문화예술협회">' +
        '</a>' +
        '<nav class="gnb" aria-label="주 메뉴"><ul>' + items + '</ul></nav>' +
      '</div>';
  }

  /* 헤더: 이 스크립트 바로 앞에 있으므로 즉시 채움(화면 깜빡임 없음) */
  var header = document.querySelector("header.site-header");
  if (header && !header.children.length) header.innerHTML = headerHTML(document.body.getAttribute("data-menu"));

  /* 고정 메뉴: 메뉴 높이를 --header-h 로 알려 줌(가려짐 방지) + 내려가면 그림자 */
  if (header) {
    var root = document.documentElement;
    var setH = function () { root.style.setProperty("--header-h", header.offsetHeight + "px"); };
    setH();
    if (window.ResizeObserver) new ResizeObserver(setH).observe(header);
    else window.addEventListener("resize", setH);
    var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 0); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* 푸터: 페이지 맨 아래에 있으므로 문서를 다 읽은 뒤 채움 */
  function fillFooter() {
    var footer = document.querySelector("footer.site-footer");
    if (footer && !footer.children.length) footer.innerHTML = FOOTER;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fillFooter);
  else fillFooter();
})();
