/* (사)한반도문화예술협회 — 스크립트 불러오기 (캐시 문제 방지)
   - 내용 파일(data/site-data.js)은 열 때마다 새로 받아 옵니다 → 편집기로 저장한 내용이 바로 보임
   - render.js · main.js 는 아래 VERSION 이 바뀔 때만 새로 받아 옵니다
     (css·js 파일을 직접 고쳤다면 VERSION 숫자를 바꾸고, HTML 의 ?v= 숫자도 같이 바꾸세요)
   - 화면에 표시되는 수상 명칭 오타를 바로잡습니다 (삼채상 → 삼체상, 오채상 → 오체상)
   사용: <script src="js/boot.js?v=…" data-load="js/render.js js/main.js"></script> */
(function () {
  "use strict";
  var VERSION = "20261006";
  var me = document.currentScript;
  var load = (me && me.getAttribute("data-load")) || "js/render.js js/main.js";
  var list = ["data/site-data.js?t=" + Date.now()].concat(load.split(/\s+/).filter(Boolean).map(function (s) {
    return s + (s.indexOf("?") < 0 ? "?v=" : "&v=") + VERSION;
  }));
  list.forEach(function (src) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;            /* 적은 순서대로 실행 */
    document.body.appendChild(s);
  });
})();

/* 수상 명칭 표기 수정 — 모든 페이지에 적용
   바꿀 말을 추가하려면 FIXES 에 [/틀린말/g, "맞는말"] 을 한 줄 더 적으세요. */
(function () {
  "use strict";
  var FIXES = [
    [/삼채상/g, "삼체상"],
    [/오채상/g, "오체상"]
  ];
  function fixText(s) {
    for (var i = 0; i < FIXES.length; i++) s = s.replace(FIXES[i][0], FIXES[i][1]);
    return s;
  }
  function fixNode(n) {
    if (n.nodeType === 3) {
      var t = fixText(n.nodeValue);
      if (t !== n.nodeValue) n.nodeValue = t;
    } else if (n.nodeType === 1) {
      fixAttrs(n);
      var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      var x;
      while ((x = w.nextNode())) {
        if (x.nodeType === 3) {
          var v = fixText(x.nodeValue);
          if (v !== x.nodeValue) x.nodeValue = v;
        } else {
          fixAttrs(x);
        }
      }
    }
  }
  /* alt, title, data-* 등 속성 (CSS content: attr(...) 로 표시되는 글자 포함). 주소(src·href)는 건드리지 않음 */
  function fixAttrs(el) {
    var attrs = el.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (a.name === "src" || a.name === "href" || a.name === "srcset") continue;
      var nv = fixText(a.value);
      if (nv !== a.value) el.setAttribute(a.name, nv);
    }
  }
  function run() {
    document.title = fixText(document.title);
    fixNode(document.body);
  }
  run();
  document.addEventListener("DOMContentLoaded", run);
  window.addEventListener("load", run);
  /* 목록·슬라이드가 나중에 그려져도 바로 고쳐지도록 */
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type === "characterData") { fixNode(m.target); continue; }
      for (var j = 0; j < m.addedNodes.length; j++) fixNode(m.addedNodes[j]);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
})();
