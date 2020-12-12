"use strict";

window.addEventListener("DOMContentLoaded", _ => {
  const pre = document.createElement("pre");
  pre.id = "source";
  pre.classList.add("language-html");

  const source = document.firstElementChild.outerHTML
    .replace("<head>", "\n<head>")
    .replace(
      '<script src="../dist/shader-web-background.min.js"></script>',
      '<script src="https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js"></script>'
    )
    .replace('<link rel="stylesheet" href="demo.css">\n', "")
    .replace('<script src="../src/test/js/show-demo-source.js"></script>\n', "");

  pre.textContent = "<!DOCTYPE html>\n" + source;
  document.body.append(pre);

  const highlightStyle = document.createElement("link");
  highlightStyle.rel = "stylesheet";
  highlightStyle.href = "../lib/highlight/styles/ir-black.css";

  const highlightScript = document.createElement("script");
  highlightScript.src = "../lib/highlight/highlight.pack.js"

  document.head.append(highlightStyle);
  document.head.append(highlightScript);

  highlightScript.onload = _ => {
    hljs.highlightBlock(pre);
  }

}, true);
