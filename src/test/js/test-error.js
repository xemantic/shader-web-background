/*
 * This file is part of shader-web-background.
 *
 *  shader-web-background is free software: you can redistribute it and/or modify
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
 * along with Foobar.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

const report = (message, color) => {
  const div = document.createElement("div")
  div.style.fontSize = "1.4rem";
  div.style.backgroundColor = color;
  div.style.padding = "1.4rem";
  div.textContent = message;
  document.body.prepend(div);
}

const reportFailure = (message) => report(message, "red");
const reportSuccess = (message) => report(message, "green");

const errorsEqual = (expected, actual) =>
  ((expected.name == actual.name) && actual.message.startsWith(expected.message));

function appendSource() {
  const pre = document.createElement("pre");
  pre.textContent = "<!DOCTYPE html>\n" + document.firstElementChild.outerHTML;
  pre.style.backgroundColor = "black";
  pre.style.color = "white";
  document.body.append(pre);
}

function shouldThrow(expectedError, call) {
  window.addEventListener("DOMContentLoaded", () => {

    appendSource();

    try {
      call();
      reportFailure("Error not thrown, expected: [" + expectedError + "]");
    } catch (e) {
      if (errorsEqual(expectedError, e)) {
        reportSuccess("Expected Error thrown: [" + e + "]");
      } else {
        reportFailure(
          "Expected: [" + expectedError + "], but was thrown: [" + e + "]"
        );
      }
    }

  });
}
