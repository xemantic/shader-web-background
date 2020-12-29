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
  },
  /** @type {ErrorHandler} */
  DEFAULT_ON_ERROR = (canvas, error) => {
    canvas.classList.add(FALLBACK_CLASS);
    if (error instanceof shaderWebBackground.GlError) {
      console.log("Could not shade, adding fallback class to canvas: " + error);
    } else {
      throw error;
    }
  };

/**
 * @param {*} condition
 * @param {!string} message
 */
function check(condition, message) {
  if (!condition) throw new shaderWebBackground.ConfigError(message);
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
 * @param {function(Context=)|undefined} onInit
 * @param {function(!number, !number, Context=)|undefined} onResize
 * @param {function(Context=)|undefined} onBeforeFrame
 * @param {function()|undefined} onFrameComplete
 * @return {Context}
 */
function doShade(canvas, shaders, onInit, onResize, onBeforeFrame, onFrameComplete) {

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

  /** @type {Context} */
  const context = {
    canvas: canvas,
    width: 0,
    height: 0,
    cssPixelRatio: 0,
    cssWidth: 0,
    cssHeight: 0,
    /** @type {!function(!number, !number): !boolean} */
    isOverShader: (x, y) => {
      const rect = canvas.getBoundingClientRect();
      return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
    },
    /*
      gl_FragCoord contains floating point values aligned with the middle of a pixel,
      therefore we are adjust our coordinates by half to make them match
     */
    /** @type {!function(!number): !number} */
    getCoordinateX: (x) =>
      (x - canvas.getBoundingClientRect().left) * context.cssPixelRatio + .5,
    /** @type {!function(!number): !number} */
    getCoordinateY: (y) =>
      (canvas.height - (y - canvas.getBoundingClientRect().top) * context.cssPixelRatio) - .5,
    /** @type {!function()} */
    maybeResize: () => {
      if ((context.cssWidth !== canvas.clientWidth)
        || (context.cssHeight !== canvas.clientHeight)
      ) {
        context.resize();
      }
    },
    /** @type {!function()} */
    resize: () => {
      const
        pixelRatio = window.devicePixelRatio || 1,
        cssWidth   = canvas.clientWidth,
        cssHeight  = canvas.clientHeight,
        width      = Math.floor(cssWidth  * pixelRatio),
        height     = Math.floor(cssHeight * pixelRatio);

      canvas.width  = width;
      canvas.height = height;

      context.width         = width;
      context.height        = height;
      context.cssPixelRatio = pixelRatio;
      context.cssWidth      = cssWidth;
      context.cssHeight     = cssHeight;

      glWrapper.updateViewportSize();

      programs.forEach((program) => {
        program.init(width, height)
      });

      if (onResize) {
        onResize(width, height, context);
      }
    },
    /** @type {!TextureBinder} */
    texture: (loc, tex) => glWrapper.bindTexture(loc, tex),
    buffers: {}
  }

  const imageShaderIndex = Object.keys(shaders).length - 1;
  let index = 0;
  for (const id in shaders) {

    if (index++ < imageShaderIndex) {
      context.buffers[id] = glWrapper.newDoubleBuffer(
        shaders[id].texture || DEFAULT_TEXTURE_INITIALIZER
      );
    }

    programs.push(glWrapper.wrapProgram(
      context,
      id,
      glWrapper.initProgram(id, VERTEX_SHADER, getSource(id)),
      VERTEX_ATTRIBUTE,
      (shaders[id].uniforms) || {},
      context.buffers[id]
    ));

  }

  const animate = () => {

    context.maybeResize();

    if (onBeforeFrame) {
      onBeforeFrame(context);
    }

    programs.forEach((program) => {
      program.draw(() => glWrapper.drawQuad(program.vertexAttributeLocation));
      glWrapper.unbindTextures();
    });

    if (onFrameComplete) {
      onFrameComplete();
    }

    requestAnimationFrame(animate);
  }

  // we will start animation only when everything is loaded
  doOrWaitFor("load", () => {
    context.resize();
    if (onInit) {
      onInit(context);
    }
    requestAnimationFrame(animate);
  });

  return context;
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
    if (!config.canvas) {
      doOrWaitFor("DOMContentLoaded", () => document.body.appendChild(canvas));
    }
    return doShade(
      canvas,
      config.shaders,
      config.onInit,
      config.onResize,
      config.onBeforeFrame,
      config.onFrameComplete
    );
  } catch (/** @type {!Error} */ e) {
    (config.onError || DEFAULT_ON_ERROR)(canvas, e);
  }
}

/** @suppress {checkTypes} to redefine the type declared in externs */
shaderWebBackground.Error = class extends Error {
  /** @param {!string} message */
  constructor(message) {
    super(message);
    this.name = "shaderWebBackground.Error";
  }
};

/** @suppress {checkTypes} to redefine the type declared in externs */
shaderWebBackground.ConfigError = class extends shaderWebBackground.Error {
  /** @param {!string} message */
  constructor(message) {
    super(message);
    this.name = "shaderWebBackground.ConfigError";
  }
};

/** @suppress {checkTypes} to redefine the type declared in externs */
shaderWebBackground.GlError = class extends shaderWebBackground.Error {
  /** @param {!string} message */
  constructor(message) {
    super(message);
    this.name = "shaderWebBackground.GlError";
  }
};

/** @suppress {missingSourcesWarnings} to redefine the function declared in externs */
shaderWebBackground.shade = shade;
