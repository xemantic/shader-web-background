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
  FALLBACK_CLASS = "fallback",
  VERTEX_ATTRIBUTE = "V",
  VERTEX_SHADER = `attribute vec2 V;void main(){gl_Position=vec4(V,0,1);}`;

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
  style.width = "100vw";
  style.height = "100vh";
  style.position = "fixed";
  style.top = "0";
  style.left = "0";
  style.zIndex = -9999;
  document.body.appendChild(canvas);
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
 * @param {!HTMLCanvasElement} canvas
 * @param {!Object<string, !string>} sources
 * @param {!Object<string, !Shader>} shaders
 * @param {function(!number, !number)|undefined} onResize
 * @param {function()|undefined} onFrameComplete
 */
function doShade(canvas, sources, shaders, onResize, onFrameComplete) {

  const contextAttrs = {
    antialias: false,
    depth: false,
    alpha: false
  }

  const sourceIds = Object.keys(sources);

  const glWrapper = new GlWrapper(
    canvas,
    (message) => new shaderWebBackground.GlError(message),
    contextAttrs
  );

  const imageIndex = sourceIds.length - 1;
  /** @type {Array<!ProgramWrapper>} */
  const programs = sourceIds.map((id, index) => {
    const program = glWrapper.initProgram(id, VERTEX_SHADER, sources[id]);
    const uniforms = (shaders[id] && shaders[id].uniforms) || {}
    const buffered = (index < imageIndex); // not last
    return glWrapper.wrapProgram(
        id, program, VERTEX_ATTRIBUTE, uniforms, buffered
      );
  });

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

      if (onResize) onResize(width, height);
      programs.forEach(program =>
        program.init(width, height)
      );
    }

    programs.forEach(program =>
      program.draw(() => glWrapper.drawQuad(program.vertex))
    );

    programs.forEach(program => program.afterFrame());

    if (onFrameComplete) onFrameComplete();

    requestAnimationFrame(animate);
  }
  animate();
};

/**
 * @param {Config=} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
function shade(config) {
  // first we need to validate all the configuration
  config = config || {};
  const canvas = (config.canvas)
    ? checkIfCanvas(config.canvas)
    : newBackgroundCanvas();

  const scripts = /** @type {NodeList<HTMLScriptElement>} */ (
    document.head.querySelectorAll(
      "script[type='" + SHADER_SCRIPT_TYPE + "']"
    )
  );
  check(
    scripts.length > 0,
    "At least one <script type=" + '"'
      + SHADER_SCRIPT_TYPE + '"' + "> required in document head"
  );
  scripts.forEach(script =>
    check(script.id, "Each shader <script> needs unique id attribute")
  );

  /**
   * @type {function(!Object<string, !string>, !HTMLScriptElement):
   *         !Object<string, !string>
   * }
   */
  const reducer = (map, script) => {
    map[script.id] = script.text.trim();
    return map;
  }

  /** @type {!Object<string, !string>} */
  const sources = Array.from(scripts).reduce(reducer, {});

  if (config.shaders) {
    for (const id in config.shaders) {
      check(id in sources, "No shader source with id: " + id);
    }
  }

  try {
    doShade(
      canvas,
      sources,
      config.shaders || {},
      config.onResize,
      config.onFrameComplete
    );
  } catch (/** @type {!Error} */ e) {
    if (config.fallback) {
      console.log("Could not load shaders, adding fallback class to canvas" + e);
      canvas.classList.add(FALLBACK_CLASS);
    } else {
      throw e;
    }
  }
}

/**
 * @param {Config=} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
function shadeOnLoad(config) {
  window.addEventListener("load", () => shade(config));  // TODO extra parameter?
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

/** @suppress {missingSourcesWarnings} to redefine the function declared in externs */
shaderWebBackground.shadeOnLoad = shadeOnLoad;
