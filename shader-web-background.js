class ShaderWebBackgroundException extends Error {
  constructor(message) {
    super(message);
    this.name = "ShaderWebBackgroundException";
  }
}

function shaderCanvas(canvasElementId, feedbackShaderElementId, screenShaderElementId) {
  return new ShaderCanvas(
    canvasElementId,
    shaderSourceOrDefault(feedbackShaderElementId, feedbackFs),
    shaderSourceOrDefault(screenShaderElementId, fs),
  );
}

function shaderSourceOrDefault(elementId, defaultSource) {
  return (elementId
      && document.getElementById(elementId)
      && document.getElementById(elementId).text.trim()
  ) || defaultSource;
}

class ShaderCanvas {

  constructor(canvasElementId, feedbackSource, screenSource) {
    const canvas = document.getElementById(canvasElementId)

    updateCanvasSize(canvas);

    const gl = canvas.getContext("webgl");
    if (!gl) throw new ShaderWebBackgroundException(
      "webgl context not supported on supplied canvas element: " + canvas
    );
    const ext = gl.getExtension("OES_texture_half_float");
    if (!ext) throw new ShaderWebBackgroundException(
      "OES_texture_half_float is required but not supported here"
    );
    if (!gl.getExtension("OES_texture_half_float_linear")) throw new ShaderWebBackgroundException(
      "OES_texture_half_float_linear is required but not supported here"
    );

    var rts = newRenderTargets(gl, canvas.width, canvas.height, ext);

    const loopbackProgram = initProgram(gl, vs, feedbackSource);
    const screenProgram = initProgram(gl, vs, screenSource);

    gl.useProgram(loopbackProgram);
    const quadPos = gl.getAttribLocation(loopbackProgram, 'V');
    const quad = initQuad(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.vertexAttribPointer(quadPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(quadPos);
    updateViewportSize(gl);

    const loopbackResolutionPosition = gl.getUniformLocation(loopbackProgram, "R");
    const loopbackMinDimensionPosition = gl.getUniformLocation(loopbackProgram, "D");
    const loopbackTimePosition = gl.getUniformLocation(loopbackProgram, "T");
    const loopbackFramePosition = gl.getUniformLocation(loopbackProgram, "F");

    gl.useProgram(screenProgram);
    const screenResolutionPosition = gl.getUniformLocation(screenProgram, "R");
    const screenMinDimensionPosition = gl.getUniformLocation(screenProgram, "D");
    const screenTimePosition = gl.getUniformLocation(loopbackProgram, "T");

    let setResolutionUniforms = function() {
      var minDimension = Math.min(canvas.width, canvas.height);
      gl.useProgram(loopbackProgram);
      gl.uniform2f(loopbackResolutionPosition, canvas.width, canvas.height);
      gl.uniform1f(loopbackMinDimensionPosition, minDimension);
      gl.useProgram(screenProgram);
      gl.uniform2f(screenResolutionPosition, canvas.width, canvas.height);
      gl.uniform1f(screenMinDimensionPosition, minDimension);
    }

    setResolutionUniforms();

    let frame = 0;
    let time = 0;

    let animate = function() {
      time = performance.now() / 1000;

      if (isResized(canvas)) {
        updateCanvasSize(canvas);
        updateViewportSize(gl);
        for (const rt of rts) {
          rt.release();
        }
        rts = newRenderTargets(gl, canvas.width, canvas.height, ext);
        setResolutionUniforms();
      }

      gl.useProgram(loopbackProgram);
      gl.uniform1f(loopbackTimePosition, time);
      gl.uniform1i(loopbackFramePosition, frame);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fbo);
      gl.bindTexture(gl.TEXTURE_2D, rts[1].texture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.useProgram(screenProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, rts[0].texture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rts.reverse();
      frame++;
      requestAnimationFrame(animate);
    }
    animate();
  }

}

function isResized(canvas) {
  return (
    canvas.width !== canvas.clientWidth
    || canvas.height !== canvas.clientHeight
  );
}

function updateCanvasSize(canvas) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

class RenderTarget {
  constructor(gl, width, height, ext) {
    this.gl = gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
  }
  release() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.deleteTexture(this.texture);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.deleteFramebuffer(this.fbo)
  }
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = String(gl.getShaderInfoLog(shader));
    console.log(info, source);
    gl.deleteShader(shader);
    return info;
  }
  return shader;
}

function initProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  return shaderProgram;
}

function initQuad(gl) {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return positionBuffer;
}

function newRenderTargets(gl, width, height, ext) {
  const rt1 = new RenderTarget(gl, width, height, ext);
  const rt2 = new RenderTarget(gl, width, height, ext);
  return [rt1, rt2];
}

function updateViewportSize(gl) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

// TODO should we specify precision here?
const vs = `
attribute vec2 V;
//attribute vec2 aUV;
//varying vec2 vUV;

void main() {
    gl_Position = vec4(V, 0.0, 1.0);
    //vUV = aUV;
}
`;

// TODO is lowp good enough?
// TODO is it faster to use texelFetch? will it work on mac/safari?
const fs = `
precision mediump float;

uniform vec2 R;
uniform sampler2D T;
varying vec2 vUV;

void main() {
    // vUV is equal to gl_FragCoord/uScreenResolution
    // do some pixel shader related work
    gl_FragColor = texture2D(T, gl_FragCoord.xy/R);
}
`;

const feedbackFs = `
precision mediump float;

uniform vec2 R;
uniform sampler2D T;
varying vec2 vUV;

void main() {
    // vUV is equal to gl_FragCoord/uScreenResolution
    // do some pixel shader related work
    gl_FragColor = vec4(0.);
}
`;

/*
#version 300 es
precision lowp float;uniform sampler2D T;uniform vec2 R;out vec4 O;void main(){O=texture(T,gl_FragCoord.xy/R);

}
*/

window["shaderCanvas"] = shaderCanvas;
window["ShaderWebBackgroundException"] = ShaderWebBackgroundException;
