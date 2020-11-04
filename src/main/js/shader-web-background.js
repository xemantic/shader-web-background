"use strict";
(() => {

  // API: begin

  /** @suppress {checkTypes} */
  shaderWebBackground.ConfigError = class extends Error {
    /** @param {!string} message */
    constructor(message) {
      super(message);
      this.name = "shaderWebBackground.GlConfigError";
    }
  };

  /** @suppress {checkTypes} */
  shaderWebBackground.GlError = class extends Error {
    /** @param {!string} message */
    constructor(message) {
      super(message);
      this.name = "shaderWebBackground.GlError";
    }
  };

  /**
   * @param {Config=} config
   * @throws {shaderWebBackground.ConfigError}
   * @throws {shaderWebBackground.GlError}
   */
  shaderWebBackground.shade = (config) => {
    config = config || {};
    const canvas = (config.canvas)
      ? fromConfigCanvas(config.canvas) : newBackgroundCanvas();

    const scripts = document.head.querySelectorAll(
      "script[type='" + SHADER_SCRIPT_TYPE + "']"
    );
    check(
      scripts.length > 0,
      "At least one <script type=" + '"'
        + SHADER_SCRIPT_TYPE + '"' + "> required in document head"
    );
    scripts.forEach(script =>
      check(script.id, "Each shader <script> needs unique id attribute")
    );
    const sources = Array.from(scripts).reduce((map, script) => {
      map[script.id] = script.text.trim();
      return map;
    }, {});

    try {
      doShade(
        canvas, sources, config.shaders || {}
      );
    } catch (e) {
      if (config.fallback) {
        console.log(e);
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
  shaderWebBackground.shadeOnLoad = (config) =>
    window.addEventListener("load", e => shaderWebBackground.shade(config));

  // API: end

  const SHADER_SCRIPT_TYPE = "x-shader/x-fragment";
  const FALLBACK_CLASS = "fallback";

  const VERTEX_ATTRIBUTE = "V";
  const VERTEX_SHADER = `attribute vec2 V;void main(){gl_Position = vec4(V, 0.0, 1.0);}`;

  /**
   * @return {!HTMLCanvasElement}
   */
  const fromConfigCanvas = (canvas) => {
    check(canvas instanceof HTMLCanvasElement, "config.canvas must be instance of canvas");
    return canvas;
  }

  /**
   * @return {!HTMLCanvasElement}
   */
  const newBackgroundCanvas = () => {
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

  // TODO check if supplying wrong type will cause error/warning
  /**
   * @param {?} condition
   * @param {!string} message
   */
  const check = (condition, message) => {
    if (!condition) throw new shaderWebBackground.ConfigError(message)
  }

  const glErrorFactory = (message) => new shaderWebBackground.GlError(message);

  /**
   * @param {!HTMLCanvasElement} canvas
   */
  const isResized = (canvas) => (
    (canvas.width !== canvas.clientWidth)
      || (canvas.height !== canvas.clientHeight)
  );

  /**
   * @param {!HTMLCanvasElement} canvas
   */
  const updateSize = (canvas) => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  /**
   * @param {!HTMLCanvasElement} canvas
   * @param {!Object<string, string>} sources
   * @param {Object<string, !Shader>} shaders
   */
  const doShade = (canvas, sources, shaders) => {

      const contextAttrs = {
        antialias: false,
        depth: false,
        alpha: false
      }

      const glWrapper = new GlWrapper(
        canvas, glErrorFactory, contextAttrs
      );

      let frame = 0;
      let time = 0;
      let minDimension = 0;

      const defaultUniforms = {
        "R": (gl, loc) => gl.uniform2f(loc, canvas.width, canvas.height),
        "T": (gl, loc) => gl.uniform1f(loc, time),
        "F": (gl, loc) => gl.uniform1i(loc, frame),
        "D": (gl, loc) => gl.uniform1f(loc, minDimension)
      };

      const sourceIds = Object.keys(sources);
      const imageIndex = sourceIds.length - 1;
      const programs = sourceIds.map((id, index) => {
        const program = glWrapper.initProgram(id, VERTEX_SHADER, sources[id]);
        const uniforms = Object.assign(
          defaultUniforms,
          shaders[id] && shaders[id].uniforms
        );
        const buffered = (index < imageIndex); // not last
        return glWrapper.wrapProgram(
            id, program, VERTEX_ATTRIBUTE, uniforms, buffered
          );
      });

      // will force resize
      canvas.width = 0;
      canvas.height = 0;

      const animate = () => {

        time = performance.now() / 1000;

        if (isResized(canvas)) {
          updateSize(canvas);
          glWrapper.updateViewportSize();
          minDimension = Math.min(canvas.width, canvas.height);
          frame = 0;
          programs.forEach(program => {
            program.init(canvas.width, canvas.height);
          });
        }

        programs.forEach(program => {
          program.draw(() => glWrapper.drawQuad(program.vertex));
        });

        frame++;
        programs.forEach(program => program.afterFrame());

        requestAnimationFrame(animate);
      }
      animate();
    };

})();
