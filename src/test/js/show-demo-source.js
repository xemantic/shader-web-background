/*
 * Copyright 2020  Kazimierz Pogoda
 *
 * This file is part of shader-web-background.
 *
 * shader-web-background is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * shader-web-background is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with shader-web-background.  If not, see <https://www.gnu.org/licenses/>.
 */

window.addEventListener("DOMContentLoaded", () => {
  const pre = document.createElement("pre");
  pre.id = "source";
  pre.style.background = "rgba(0, 0, 0, .6)";
  pre.style.overflowX = "auto";
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
  highlightStyle.href = "../lib/highlight/styles/ir-black-xemantic.css";

  const highlightScript = document.createElement("script");
  highlightScript.src = "../lib/highlight/highlight.pack.js"

  document.head.append(highlightStyle);
  document.head.append(highlightScript);

  highlightScript.onload = () => {
    hljs.highlightBlock(pre);
  }

}, true);
