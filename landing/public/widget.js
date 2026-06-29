/**
 * 단답 위젯 로더.
 * 학원 홈페이지에 아래 한 줄만 넣으면 우측 하단에 채팅 버블이 생긴다.
 *
 *   <script src="https://<단답도메인>/widget.js" data-key="WIDGET_KEY"></script>
 *
 * 채팅 UI 자체는 iframe(/widget/<key>)으로 격리되어 호스트 사이트 CSS와 충돌하지 않는다.
 */
(function () {
  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName("script");
      return all[all.length - 1];
    })();

  var key = script.getAttribute("data-key");
  if (!key) {
    console.error("[단답] data-key가 없습니다.");
    return;
  }

  // 스크립트 src에서 단답 도메인(origin) 추출.
  var origin = script.src.replace(/\/widget\.js.*$/, "");
  var ACCENT = "#ff7a45";
  var z = 2147483000;

  // --- 채팅 패널 iframe ---
  var iframe = document.createElement("iframe");
  iframe.src = origin + "/widget/" + encodeURIComponent(key);
  iframe.title = "단답 상담 챗봇";
  iframe.style.cssText = [
    "position:fixed",
    "bottom:96px",
    "right:24px",
    "width:380px",
    "height:min(600px, calc(100vh - 120px))",
    "max-width:calc(100vw - 32px)",
    "border:0",
    "border-radius:20px",
    "box-shadow:0 20px 60px rgba(0,0,0,0.4)",
    "z-index:" + z,
    "display:none",
    "background:#0a0a0a",
  ].join(";");

  // --- 토글 버튼 ---
  var button = document.createElement("button");
  button.setAttribute("aria-label", "상담 챗봇 열기");
  button.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "right:24px",
    "width:60px",
    "height:60px",
    "border:0",
    "border-radius:50%",
    "background:" + ACCENT,
    "color:#000",
    "font-size:28px",
    "cursor:pointer",
    "box-shadow:0 8px 24px rgba(0,0,0,0.3)",
    "z-index:" + (z + 1),
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "transition:transform 0.15s ease",
  ].join(";");
  button.innerHTML = "💬";

  var open = false;
  function setOpen(next) {
    open = next;
    iframe.style.display = open ? "block" : "none";
    button.innerHTML = open ? "✕" : "💬";
    button.setAttribute("aria-label", open ? "상담 챗봇 닫기" : "상담 챗봇 열기");
  }

  button.addEventListener("click", function () {
    setOpen(!open);
  });
  button.addEventListener("mouseenter", function () {
    button.style.transform = "scale(1.05)";
  });
  button.addEventListener("mouseleave", function () {
    button.style.transform = "scale(1)";
  });

  function mount() {
    document.body.appendChild(iframe);
    document.body.appendChild(button);
  }
  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
