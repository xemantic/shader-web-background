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

"use strict";

const
  SHADER_SCRIPT_TYPE = "x-shader/x-fragment",
  CANVAS_ELEMENT_ID = "shader-web-background",
  FALLBACK_CLASS = "fallback",
  VERTEX_ATTRIBUTE = "V",
  VERTEX_SHADER = `attribute vec2 V;void main(){gl_Position=vec4(V,0,1);}`,
  /** @type {TextureInitializer} */
  DEFAULT_TEXTURE_INITIALIZER = (gl) => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

/**
 * @param {*} condition
 * @param {!string} message
 */
function check(condition, message) {
  if (!condition) throw new shaderWebBackground.ConfigError(message)
}

/**
 * @param {*} canvas
 * @return {!HTMLCanvasElement}
 */
function checkIfCanvas(canvas) {
  check(canvas instanceof HTMLCanvasElement, "config.canvas must be instance of canvas");
  return /** @type {!HTMLCanvasElement} */ (canvas);
}

/**
 * @return {!HTMLCanvasElement}
 */
function newBackgroundCanvas() {
  const canvas =
    /** @type {!HTMLCanvasElement} */
    (document.createElement("canvas"));
  const style = canvas.style;
  canvas.id = CANVAS_ELEMENT_ID;
  style.width = "100vw";
  style.height = "100vh";
  style.position = "fixed";
  style.top = "0";
  style.left = "0";
  style.zIndex = -9999;
  return canvas;
}

/**
 * @param {!HTMLCanvasElement} canvas
 * @return {boolean}
 */
function isResized(canvas) {
  return (
    (canvas.width !== canvas.clientWidth)
      || (canvas.height !== canvas.clientHeight)
  );
}

/**
 * @param {!string} id
 * @return {!string}
 */
const scriptSpec = (id) =>
  "<script type=\"" + SHADER_SCRIPT_TYPE
    + "\" id=\"" + id + "\">";

/**
 * @param {!string} id
 * @return {!string}
 */
function getSource(id) {
  const element = document.getElementById(id);
  check(element, "Missing shader source: " + scriptSpec(id));
  check(
    (element instanceof HTMLScriptElement)
      && (element.type === SHADER_SCRIPT_TYPE),
    "Shader source element of id \"" + id + "\" "
      + "should be of type: " + scriptSpec(id)
  );
  return element.text;
}

/**
 * @param {!string} eventType
 * @param {!function()} call
 */
function doOrWaitFor(eventType, call) {
  if ((document.readyState !== "loading")) {
    call();
  } else {
    window.addEventListener(eventType, call);
  }
}

/**
 * @param {!HTMLCanvasElement} canvas
 * @param {!Object<string, !Shader>} shaders
 * @param {function(!number, !number)|undefined} onResize
 * @param {function()|undefined} onBeforeFrame
 * @param {function()|undefined} onFrameComplete
 */
function doShade(canvas, shaders, onResize, onBeforeFrame, onFrameComplete) {

  const contextAttrs = {
    antialias: false,
    depth: false,
    alpha: false
  }

  const glWrapper = new GlWrapper(
    canvas,
    (message) => new shaderWebBackground.GlError(message),
    contextAttrs
  );

  /** @type {Array<!ProgramWrapper>} */
  const programs = [];
  const imageShaderIndex = Object.keys(shaders).length - 1;
  let index = 0;
  for (const id in shaders) {
    programs.push(glWrapper.wrapProgram(
      id,
      glWrapper.initProgram(id, VERTEX_SHADER, getSource(id)),
      VERTEX_ATTRIBUTE,
      (shaders[id].uniforms) || {},
      (index++ < imageShaderIndex) // is buffered?
        ? shaders[id].texture || DEFAULT_TEXTURE_INITIALIZER
        : null
    ));
  }

  // will force resize
  canvas.width = 0;
  canvas.height = 0;

  const animate = () => {

    if (isResized(canvas)) {
      /** @type {!number} */
      const width = canvas.clientWidth;
      /** @type {!number} */
      const height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      glWrapper.updateViewportSize();

      if (onResize) {
        onResize(width, height);
      }

      programs.forEach(program =>
        program.init(width, height)
      );
    }

    if (onBeforeFrame) {
      onBeforeFrame();
    }

    programs.forEach(program =>
      program.draw(() => glWrapper.drawQuad(program.vertex))
    );

    if (onFrameComplete) {
      onFrameComplete();
    }

    requestAnimationFrame(animate);
  }

  // we will start animation only when everything is loaded
  doOrWaitFor("load", () => requestAnimationFrame(animate));
};

/**
 * @param {Config} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
function shade(config) {
  // first we need to validate all the configuration
  check(config, "Missing config argument")

  const canvas = (config.canvas)
    ? checkIfCanvas(config.canvas)
    : newBackgroundCanvas();

  check(config.shaders, "No shaders specified in config");

  try {
    doShade(
      canvas,
      config.shaders,
      config.onResize,
      config.onBeforeFrame,
      config.onFrameComplete
    );
  } catch (/** @type {!Error} */ e) {
    if (config.fallback && (e instanceof shaderWebBackground.GlError)) {
      console.log("Could not load shaders, adding fallback class to canvas" + e);
      canvas.classList.add(FALLBACK_CLASS);
    } else {
      throw e;
    }
  }

  if (!config.canvas) {
    doOrWaitFor("DOMContentLoaded", () => document.body.appendChild(canvas));
  }

}

/** @suppress {checkTypes} to redefine the type declared in externs */
shaderWebBackground.ConfigError = class extends Error {
  /** @param {!string} message */
  constructor(message) {
    super(message);
    this.name = "shaderWebBackground.ConfigError";
  }
};

/** @suppress {checkTypes} to redefine the type declared in externs */
shaderWebBackground.GlError = class extends Error {
  /** @param {!string} message */
  constructor(message) {
    super(message);
    this.name = "shaderWebBackground.GlError";
  }
};

/** @suppress {missingSourcesWarnings} to redefine the function declared in externs */
shaderWebBackground.shade = shade;
