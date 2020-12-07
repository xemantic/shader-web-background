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

const QUAD_POSITIONS = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];

class WebGlStrategy {

  /**
   * @param {!WebGLRenderingContext} gl
   * @param {!function(T, !string):T} check
   * @template T
   */
  constructor(gl, check) {
    this.gl = gl;
    this.check = check;
  }

  /**
   * @param {!number} width
   * @param {!number} height
   */
  setUpTexture(width, height) {}

  /**
   * @param {!string} extension
   * @return {!Object}
   * @suppress {reportUnknownTypes}
   */
  getExtension(extension) {
    return this.check(
      this.gl.getExtension(extension),
      extension + " extension is not supported"
    );
  }

}

class WebGl1Strategy extends WebGlStrategy {

  /**
   * @param {!WebGLRenderingContext} gl
   * @param {!function(?T, !string):!T} check
   * @template T
   */
  constructor(gl, check) {
    super(gl, check);
    // TODO make double step checking
    this.ext = /** @type {OES_texture_half_float} */
      (this.getExtension("OES_texture_half_float"));
    this.getExtension("OES_texture_half_float_linear");
  }

  /**
   * @param {!number} width
   * @param {!number} height
   */
  setUpTexture(width, height) {
    const gl = this.gl;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, this.ext.HALF_FLOAT_OES, null);
  }

}

class WebGl2Strategy extends WebGlStrategy {

  /**
   * @param {!WebGL2RenderingContext} gl
   * @param {!function(T, !string):T} check
   * @template T
   */
  constructor(gl, check) {
    super(gl, check);
    this.getExtension("EXT_color_buffer_float");
  }

  /**
   * @param {!number} width
   * @param {!number} height
   */
  setUpTexture(width, height) {
    const gl = /** @type {!WebGL2RenderingContext} */ (this.gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
  }

}

/**
 * @typedef {{
 *   location: !WebGLUniformLocation,
 *   setter: !UniformSetter
 * }}
 */
var UniformEntry;

class GlWrapper {

  /**
   * @param {!HTMLCanvasElement} canvas
   * @param {!function(!string):!Error} glErrorFactory
   * @param {Object<string, ?>=} contextAttrs
   */
  constructor(canvas, glErrorFactory, contextAttrs) {
    this.canvas = canvas;
    this.glErrorFactory = glErrorFactory;

    /**
     * @param {?T} condition
     * @param {!string} message
     * @return {!T}
     * @template T
     * @suppress {reportUnknownTypes}
     */
    const check = (condition, message) => {
      if (!condition) throw glErrorFactory(message);
      return (condition);
    };

    let gl = /** @type {WebGL2RenderingContext} */ (canvas.getContext("webgl2", contextAttrs));
    if (gl) {
      this.strategy = new WebGl2Strategy(gl, check);
    } else {
      gl = /** @type {WebGLRenderingContext} */ (canvas.getContext("webgl", contextAttrs));
      if (gl) {
        this.strategy = new WebGl1Strategy(gl, check)
      }
    }
    check(
      gl,
      "webgl context not supported on supplied canvas element: " + canvas
    );
    this.gl = /** @type {!WebGLRenderingContext} */ (gl);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(QUAD_POSITIONS), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.quad = positionBuffer;
    this.buffers = {};
  }

  /**
   * @param {!string} id
   * @param {!number} type
   * @param {!string} source
   * @return {!WebGLShader}
   */
  loadShader(id, type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = String(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      const message = "Cannot compile shader - " + id + ": " + info.trim();
      console.log(message + "\n" + source);
      throw this.glErrorFactory(message);
    }
    return shader;
  }

  /**
   * @param {!string} id
   * @param {!string} vertexShaderSource
   * @param {!string} fragmentShaderSource
   * @return {!WebGLProgram}
   */
  initProgram(id, vertexShaderSource, fragmentShaderSource) {
    const gl = this.gl;
    const vertexShader = this.loadShader(id, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.loadShader(id, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  /**
   * @param {!string} id
   * @param {!WebGLProgram} program
   * @param {!string} vertexAttribute
   * @param {!UniformSetters} uniformSetters
   * @param {!boolean} buffered
   * @param {TextureInitializer|undefined} textureInitializer
   * @return {!ProgramWrapper}
   */
  wrapProgram(id, program, vertexAttribute, uniformSetters, buffered, textureInitializer) {
    const gl = this.gl;

    /** @type {!Object<string, !UniformEntry>} */
    this.uniforms = {};

    const activeUniforms =
      /** @type {!number} */ (gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS));
    for (let i = 0; i < activeUniforms; i++) {
      const uniform = gl.getActiveUniform(program, i);
      const setter = uniformSetters[uniform.name];
      if (!setter) {
        throw this.glErrorFactory(
          "No configuration for uniform \"" + uniform.name
            + "\" defined in shader \"" + id + "\""
        );
      }
      this.uniforms[uniform.name] = {
        location: gl.getUniformLocation(program, uniform.name),
        setter: setter
      }
    }

    // Let's check if we have some extra uniforms in the configuration
    // it's not a critical problem, but failing early might prevent from
    // some hard to debug issues later.
    for (const name in uniformSetters) {
      if (!(name in this.uniforms)) {
        throw this.glErrorFactory(
          "No such uniform \"" + name + "\" defined in shader \"" + id
            + "\" - if unused it might be removed by GLSL compiler"
        );
      }
    }

    let buffer = null;
    if (buffered) {
      buffer = new DoubleBuffer(gl, this.strategy, textureInitializer);
      this.buffers[id] = buffer;
    }

    return new ProgramWrapper(
      gl,
      id,
      program,
      gl.getAttribLocation(program, vertexAttribute),
      this.uniforms,
      buffer,
      this.buffers
    );
  }

  updateViewportSize() {
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * @param {!number} vertexAttributeLocation
   */
  drawQuad(vertexAttributeLocation) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.vertexAttribPointer(vertexAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(vertexAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

}

class ProgramWrapper {

  /**
   * @param {!WebGLRenderingContext} gl
   * @param {!string} id
   * @param {!WebGLProgram} program
   * @param {!number} vertexAttributeLocation
   * @param {!Object<string, !UniformEntry>} uniforms
   * @param {?DoubleBuffer} buffer
   * @param {!Object<string, !DoubleBuffer>} buffers
   */
  constructor(gl, id, program, vertexAttributeLocation, uniforms, buffer, buffers) {
    this.gl = gl;
    this.id = id;
    this.program = program;
    /** @type {!number} */
    this.vertex = vertexAttributeLocation;
    this.uniforms = uniforms;
    this.buffer = buffer;

    this.textureCount = 0;
    this.context = {
      buffers: buffers,
      texture: (
        /** @type {!WebGLUniformLocation} */ loc,
        /** @type {!WebGLTexture|!Buffer} */ texture
      ) => {
        const tex = (texture instanceof DoubleBuffer)
          ? texture.out
          : /** @type {!WebGLTexture} */ (texture);

        gl.activeTexture(gl.TEXTURE0 + this.textureCount);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(loc, this.textureCount++);
      }
    };
  }

  /**
   * @param {!number} width
   * @param {!number} height
   */
  init(width, height) {
    if (this.buffer) {
      this.buffer.init(width, height);
    }
  }

  /**
   * @param {!function()} drawer
   */
  draw(drawer) {
    const gl = this.gl;

    gl.useProgram(this.program);

    for (const name in this.uniforms) {
      const uniform = this.uniforms[name];
      uniform.setter(gl, uniform.location, this.context);
    }

    const buffer = this.buffer;
    if (buffer) {
      buffer.swapTextures();
      buffer.draw(drawer);
    } else {
      drawer();
    }

    for (let i = 0; i < this.textureCount; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.textureCount = 0;
  }

}

class DoubleBuffer {

  /**
   * @param {!WebGLRenderingContext} gl
   * @param {!WebGlStrategy} strategy
   * @param {TextureInitializer|undefined} textureInitializer
   */
  constructor(gl, strategy, textureInitializer) {
    this.fbo = gl.createFramebuffer();
    this.gl = gl;
    this.strategy = strategy;
    this.textureInitializer = textureInitializer;
    /** @type {WebGLTexture} */
    this.in = null;
    /** @type {WebGLTexture} */
    this.out = null;
  }

  /**
   * @param {!number} width
   * @param {!number} height
   */
  init(width, height) {
    this.deleteTextures();
    this.in = this.createTexture(width, height);
    this.out = this.createTexture(width, height);
  }

  /**
   * @param {!number} width
   * @param {!number} height
   * @return {!WebGLTexture}
   */
  createTexture(width, height) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.strategy.setUpTexture(width, height);
    if (this.textureInitializer) this.textureInitializer(gl);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }

  /**
   * @param {!function()} drawer
   */
  draw(drawer) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.out, 0
    );

    drawer();

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  swapTextures() {
    const tmp = this.out;
    this.out = this.in;
    this.in = tmp;
  }

  deleteTextures() {
    if (this.in) this.gl.deleteTexture(this.in);
    if (this.out) this.gl.deleteTexture(this.out);
  }

  release() {
    const gl = this.gl;
    this.deleteTextures();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(this.fbo)
  }

}
