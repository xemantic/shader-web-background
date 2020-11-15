/**
 * @fileoverview Public API of shader-web-background.js
 *
 * @externs
 */
"use strict";

const shaderWebBackground = {};

/**
 * @typedef {Object}
 */
var Buffer;

/**
 * @typedef {{
 *   buffers: !Object<string, !Buffer>,
 *   texture: function(!WebGLUniformLocation, (!WebGLTexture|!Buffer))
 * }}
 */
var Context;

/**
 * @typedef {
 *   function(!WebGLRenderingContext, !WebGLUniformLocation, Context=)
 * }
 */
var UniformSetter;

/**
 * @typedef {
 *   Object<string, !UniformSetter>
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
shaderWebBackground.ConfigError = class extends Error {}

/**
 * Indicates WebGL problems.
 */
shaderWebBackground.GlError = class extends Error {}

/**
 * Will start shading.
 *
 * @param {Config=} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
shaderWebBackground.shade = function(config) {}

/**
 * Will start shading when the page is loaded.
 *
 * @param {Config=} config
 * @throws {shaderWebBackground.ConfigError}
 * @throws {shaderWebBackground.GlError}
 */
shaderWebBackground.shadeOnLoad = function(config) {}
