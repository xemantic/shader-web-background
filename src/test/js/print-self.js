"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const pre = document.createElement("pre");
  pre.id = "source";
  pre.textContent = "<!DOCTYPE html>\n" + document.firstElementChild.outerHTML;
  document.body.append(pre);
}, true);
