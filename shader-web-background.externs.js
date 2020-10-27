/**
 * @fileoverview Public API of shader-web-background.js
 *
 * @externs
 */

const shaderWebBackground = {};

shaderWebBackground.Config = class {
  constructor() {
    /** @type {!HTMLCanvasElement} */
    this.canvas
    /** @type {!string} */
    this.imageShader;
    /** @type {!string} */
    this.feedbackShader;
    /** @type {!Map<string, function((WebGLRenderingContext|WebGL2RenderingContext), WebGLUniformLocation)>} */
    this.uniforms;
    /** @type {!boolean} */
    this.fallback;
  }
}

/**
 * Indicates misconfiguration.
 */
shaderWebBackground.ConfigError = class extends Error {
  /** @param {string} message */
  constructor(message) {}
}

/**
 * Indicates WebGL problems.
 */
shaderWebBackground.GlError = class extends Error {
  /** @param {string} message */
  constructor(message) {}
}

/**
 * Will start shading.
 *
 * @param {shaderWebBackground.Config} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
shaderWebBackground.shade = function(config) {}

/**
 * Will start shading when the page is loaded.
 *
 * @param {shaderWebBackground.Config} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
shaderWebBackground.shadeOnLoad = function(config) {}
