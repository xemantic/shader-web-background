/**
 * @fileoverview Public API of shader-web-background.js
 *
 * @externs
 */
"use strict";

const shaderWebBackground = {};

/**
 * @typedef {{
 *   textureIn:  !WebGLTexture,
 *   textureOut: !WebGLTexture
 * }}
 */
var Buffer;

/**
 * @typedef {{
 *   buffers: (!Object<string, !Buffer>)
 * }}
 */
var Context;

/**
 * @typedef {
 *   Object<string, !function(!WebGLRenderingContext, !WebGLUniformLocation, Context=)>
 * }
 */
var Uniforms;

/**
 * @typedef {{
 *   uniforms: (Uniforms|undefined)
 * }}
 */
var Shader;

/**
 * @typedef {{
 *   canvas:   (HTMLCanvasElement|undefined),
 *   fallback: (boolean|undefined),
 *   shaders:  (Object<string, !Shader>|undefined)
 * }}
 */
var Config;

/**
 * Indicates misconfiguration.
 */
shaderWebBackground.ConfigError = class extends Error {
  /** @param {!string} message */
  constructor(message) {}
}

/**
 * Indicates WebGL problems.
 */
shaderWebBackground.GlError = class extends Error {
  /** @param {!string} message */
  constructor(message) {}
}

/**
 * Will start shading.
 *
 * @param {Config=} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
shaderWebBackground.shade = (config) => {}

/**
 * Will start shading when the page is loaded.
 *
 * @param {Config=} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
shaderWebBackground.shadeOnLoad = (config) => {}
