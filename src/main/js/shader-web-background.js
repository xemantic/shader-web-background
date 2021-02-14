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
  VERTEX_SHADER_SCRIPT_TYPE = "x-shader/x-vertex",
  FRAGMENT_SHADER_SCRIPT_TYPE = "x-shader/x-fragment",
  CANVAS_ELEMENT_ID = "shader-web-background",
  FALLBACK_CLASS = "shader-web-background-fallback",
  VERTEX_ATTRIBUTE = "V",
  DEFAULT_VERTEX_SHADER = "attribute vec2 V;void main(){gl_Position=vec4(V,0,1);}",
  /** @type {!TextureInitializer} */
  DEFAULT_TEXTURE_INITIALIZER = (gl, ctx) => {
    ctx.initHalfFloatRGBATexture(ctx.width, ctx.height);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  },
  /** @type {!ErrorHandler} */
  DEFAULT_ON_ERROR = (error, canvas) => {
    console.warn("shader-web-background cannot shade, adding fallback CSS classes");
    document.documentElement.classList.add(FALLBACK_CLASS);
    canvas.classList.add(FALLBACK_CLASS);
    if (error instanceof shaderWebBackground.GlError) {
      console.warn("Not sufficient WebGL support:", error);
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
 * @param {!string} type
 * @param {!string} id
 * @return {!string}
 */
const scriptSpec = (type, id) => "<script type=\"" + type + "\" id=\"" + id + "\">";

/**
 * @param {!Element} element
 * @param {!string} type
 * @param {!string} id
 */
function checkScript(element, type, id) {
  check(
    (element instanceof HTMLScriptElement)
      && (element.type === type),
    "Shader source element of id \"" + id + "\" "
      + "should be of type: " + scriptSpec(type, id)
  );
}

/**
 * @param {!string} id
 * @return {!string}
 */
function getFragmentShaderSource(id) {
  const element = document.getElementById(id);
  check(element, "Missing shader source: " + scriptSpec(FRAGMENT_SHADER_SCRIPT_TYPE, id));
  checkScript(/** @type {!Element} */ (element), FRAGMENT_SHADER_SCRIPT_TYPE, id);
  return element.text;
}

/**
 * @param {!string} id
 * @return {!string}
 */
function getVertexShaderSource(id) {
  const vertexShaderId = id + "Vertex";
  const element = document.getElementById(vertexShaderId);
  if (element) {
    checkScript(element, VERTEX_SHADER_SCRIPT_TYPE, vertexShaderId);
    return element.text;
  }
  return DEFAULT_VERTEX_SHADER;
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
 * @typedef {{
 *   location: !WebGLUniformLocation,
 *   setter:   !UniformSetter
 * }}
 */
var Uniform;

class Renderer {

  /**
   * @param {!GlWrapper} glWrapper
   * @param {!Context} context
   * @param {!Program} program
   * @param {!Array<!Uniform>} uniforms
   */
  constructor(glWrapper, context, program, uniforms) {
    this.program = program;
    const gl = glWrapper.gl;
    this.fillUniforms = () => {
      for (const uniform of uniforms) {
        uniform.setter(gl, uniform.location, context);
      }
    }
    this.draw = () => {
      glWrapper.drawQuad(program.vertexAttributeLocation);
      glWrapper.unbindTextures();
    }
  }

  render() {
    this.program.draw(
      this.fillUniforms,
      this.draw
    );
  }

}

/**
 * @param {!HTMLCanvasElement} canvas
 * @param {!Object} contextAttrs
 * @return {!GlWrapper}
 * @throws {shaderWebBackground.GlError}
 */
function initCanvas(canvas, contextAttrs) {
  try {
    return new GlWrapper(canvas, contextAttrs);
  } catch (/** @type {!Error} */ error) {
    throw new shaderWebBackground.GlError(error.message);
  }
}

/**
 * @param {!HTMLCanvasElement} canvas
 * @param {!Object<string, !Shader>} shaders
 * @param {function(Context)|undefined} onInit
 * @param {function(!number, !number, Context=)|undefined} onResize
 * @param {function(Context)|undefined} onBeforeFrame
 * @param {function(Context)|undefined} onAfterFrame
 * @return {Context}
 */
function doShade(canvas, shaders, onInit, onResize, onBeforeFrame, onAfterFrame) {

  // in the future it should be configurable as well
  const contextAttrs = {
    antialias: false,
    depth: false,
    alpha: false
  };
  const glWrapper = initCanvas(canvas, contextAttrs);

  /**
   * @param {!string} id
   * @param {!string} vertexShaderSource
   * @param {!string} fragmentShaderSource
   * @return {!WebGLProgram}
   * @throws {shaderWebBackground.ConfigError}
   */
  function initProgram(id, vertexShaderSource, fragmentShaderSource) {
    try {
      return glWrapper.initProgram(id, vertexShaderSource, fragmentShaderSource)
    } catch (/** @type {!Error} */ error) {
      throw new shaderWebBackground.ConfigError(error.message);
    }
  }

  /** @type {!Array<!Renderer>} */
  const renderers = [];

  /** @type {Context} */
  const context = {
    gl: glWrapper.gl,
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
    toShaderX: (x) =>
      (x - canvas.getBoundingClientRect().left)
      * context.cssPixelRatio + .5,
    /** @type {!function(!number): !number} */
    toShaderY: (y) =>
      (canvas.height - (y - canvas.getBoundingClientRect().top)
      * context.cssPixelRatio) - .5,
    /** @type {!function(): boolean} */
    maybeResize: () => {
      if ((context.cssWidth !== canvas.clientWidth)
        || (context.cssHeight !== canvas.clientHeight)
      ) {
        context.resize();
        return true;
      }
      return false;
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

      for (const renderer of renderers) {
        renderer.program.init(width, height);
      }
    },
    /** @type {!TextureBinder} */
    texture: (loc, tex) => glWrapper.bindTexture(loc, tex),
    buffers: {},
    /** @type {!function(!number, !number)} */
    initHalfFloatRGBATexture: (width, height) => {
      glWrapper.texImage2DHalfFloatRGBA(width, height);
    }
  }

  const imageShaderIndex = Object.keys(shaders).length - 1;
  let index = 0;
  for (const id in shaders) {

    if (index++ < imageShaderIndex) {
      const textureInitializer = shaders[id].texture || DEFAULT_TEXTURE_INITIALIZER;
      context.buffers[id] = glWrapper.newDoubleBuffer(() => {
        textureInitializer(glWrapper.gl, context);
      });
    }

    const program = glWrapper.wrapProgram(
      id,
      initProgram(id, getVertexShaderSource(id), getFragmentShaderSource(id)),
      VERTEX_ATTRIBUTE,
      context.buffers[id]
    );

    const uniformSetters =
      (shaders[id].uniforms) || /** @type {!UniformSetters} */ ({});
    var extraUniforms = Object.keys(uniformSetters);
    for (const spec of program.uniformSpecs) {
      check(
        uniformSetters[spec.name],
        "No configuration for uniform \"" + spec.name
          + "\" defined in shader \"" + id + "\""
      );
      extraUniforms = extraUniforms.filter(name => name !== spec.name);
    }

    if (extraUniforms.length !== 0) {
      console.warn(
        "Extra uniforms configured for shader \"" + id
          + "\", which are not present in the shader code "
          + "- might have been removed by GLSL compiler if not used: " + extraUniforms.join(", ")
      );
    }

    /** @type {!Array<!Uniform>} */
    const uniforms = program.uniformSpecs.map(spec => ({
      /** @type {!WebGLUniformLocation} */
      location: spec.location,
      /** @type {!UniformSetter} */
      setter: uniformSetters[spec.name]
    }));

    renderers.push(
      new Renderer(glWrapper, context, program, uniforms)
    );

  }

  const animate = () => {
    if (context.maybeResize() && onResize) {
      onResize(context.width, context.height, context);
    }
    if (onBeforeFrame) {
      onBeforeFrame(context);
    }
    for (const renderer of renderers) {
      renderer.render();
    }
    if (onAfterFrame) {
      onAfterFrame(context);
    }
    requestAnimationFrame(animate);
  }

  // we will start animation only when everything is loaded
  doOrWaitFor("load", () => {
    context.resize();
    if (onInit) {
      onInit(context);
    }
    if (onResize) {
      onResize(context.width, context.height, context);
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
  check(config, "Missing config argument");

  const canvas = (config.canvas)
    ? checkIfCanvas(config.canvas)
    : newBackgroundCanvas();

  check(config.shaders, "No shaders specified in config");

  try {
    const ctx = doShade(
      canvas,
      config.shaders,
      config.onInit,
      config.onResize,
      config.onBeforeFrame,
      config.onAfterFrame
    );
    if (!config.canvas) {
      doOrWaitFor("DOMContentLoaded", () => {
        document.body.appendChild(canvas);
      });
    }
    return ctx;
  } catch (/** @type {!Error} */ error) {
    (config.onError || DEFAULT_ON_ERROR)(error, canvas);
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
