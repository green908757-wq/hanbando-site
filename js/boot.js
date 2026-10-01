/* (사)한반도문화예술협회 — 스크립트 불러오기 (캐시 문제 방지)
   - 내용 파일(data/site-data.js)은 열 때마다 새로 받아 옵니다 → 편집기로 저장한 내용이 바로 보임
   - render.js · main.js 는 아래 VERSION 이 바뀔 때만 새로 받아 옵니다
     (css·js 파일을 직접 고쳤다면 VERSION 숫자를 바꾸고, HTML 의 ?v= 숫자도 같이 바꾸세요)
   사용: <script src="js/boot.js?v=…" data-load="js/render.js js/main.js"></script> */
(function () {
  "use strict";
  var VERSION = "20261001";
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
