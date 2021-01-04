# shader-web-background API

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig)
- [Config](#config)
  - [Config: canvas](#config-canvas)
  - [Config: onInit](#config-oninit)
  - [Config: onResize](#config-onresize)
  - [Config: onBeforeFrame](#config-onbeforeframe)
  - [Config: shaders](#config-shaders)
    - [Shader](#shader)
      - [Shader: texture](#shader-texture)
      - [Shader: uniforms](#shader-uniforms)
        - [Uniform setter](#uniform-setter)
  - [Config: onAfterFrame](#config-onafterframe)
  - [Config: onError](#config-onerror)
- [Context](#context)
  - [Context: gl](#context-gl)
  - [Context: canvas](#context-canvas)
  - [Context: width](#context-width)
  - [Context: height](#context-height)
  - [Context: cssPixelRatio](#context-csspixelratio)
  - [Context: cssWidth](#context-csswidth)
  - [Context: cssHeight](#context-cssheight)
  - [Context: isOverShader](#context-isovershader)
  - [Context: toShaderX](#context-toshaderx)
  - [Context: toShaderY](#context-toshadery)
  - [Context: buffers](#context-buffers)
    - [Buffer object](#buffer-object)
  - [Context: texture](#context-texture)
  - [Context: initHalfFloatRGBATexture](#context-inithalffloatrgbatexture)
- [shaderWebBackground.Error](#shaderwebbackgrounderror)
- [shaderWebBackground.ConfigError](#shaderwebbackgroundconfigerror)
- [shaderWebBackground.GlError](#shaderwebbackgroundglerror)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

:information_source: The detailed API is defined in
[src/main/js/shader-web-background-api.js](src/main/js/shader-web-background-api.js)
as 
[Closure Compiler externs](https://developers.google.com/closure/compiler/docs/externs-and-exports).


## shaderWebBackground.shade(config)

Shading starts with the `shaderWebBackground.shade(config)` call which requires
providing a [Config] object and returns a [Context] object.

The processing of configuration and shader compilation will start immediately,
however the animation frames will be requested only when the page is loaded.

This function might throw [shaderWebBackground.Error](#shaderwebbackgrounderror)s of type:

* [shaderWebBackground.ConfigError](#shaderwebbackgroundconfigerror) - on misconfiguration
* [shaderWebBackground.GlError](#shaderwebbackgroundglerror) - on lack of required WebGL capabilities


## Config

An object with the following attributes:

| attribute (* - required)               | type (`=`: optional argument)          | description                                |
| -------------------------------------- | -------------------------------------- | ------------------------------------------ |
| [canvas](#config-canvas)               | [HTMLCanvasElement]                    | canvas to render to                        |
| [onInit](#config-oninit)               | function([Context]=)                   | called before first run                    |
| [onResize](#config-onresize)           | function(number, number, [Context]=)   | called when the canvas is resized          |
| [onBeforeFrame](#config-onbeforeframe) | function([Context]=)                   | called before each frame                   |
| [shaders](#config-shaders) *           | Object of [Shader](#shader)s           | definition of shaders (rendering pipeline) |
| [onAfterFrame](#config-onafterframe)   | function([Context])                    | called when the frame is complete          |
| [onError](#config-onerror)             | function([Error], [HTMLCanvasElement]) | called when shading cannot be started      |

Only [shaders](#config-shaders) attribute is required. The order of
attributes is arbitrary, but in this table they are sorted by a convenient order of
their "lifecycle" in the rendering of each frame.


### Config: canvas

If `canvas` attribute is not specified, the default one will be created, with
fixed position expending over the whole viewport and located behind other
DOM elements (`z-index: -9999`).


### Config: onInit

The `onInit` function is called when the shader is loaded for the first time, before
any rendering starts. The [Context] is passed as an argument.


### Config: onResize

The `onResize` function is called with `width`, `height` and [Context]
parameters when the browser window is resized.

:information_source: Note: `onResize` will be also called before the first frame
just after [Config: onInit](#config-oninit).


### Config: onBeforeFrame

The `onBeforeFrame` function is called with the [Context] before rendering each frame.


### Config: shaders

The `shaders` is the only required attribute of the [Config] object. It's an object where
each attribute represents one [shader](#shader) definition, therefore multiple
shaders can be defined in sequence. All together they will establish a rendering pipeline
where the output of each shader can be wired as an input of another.

Example:

```javascript
shaderWebBackground.shade({
  shaders: {
    BufferA: {
      uniforms: {
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA)  // previous frame of self
      }
    },
    BufferB: {
      uniforms: {
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA), // the latest output of BufferA
        iChannel1: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferB)  // previous frame of self
      }
    },
    Image: {
      uniforms: {
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA), // the latest output
        iChannel1: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferB)  // the latest output
      }
    }
  }
});
```

:information_source: Note: shader names are arbitrary. The last shader will render to screen,
the previous ones (if more than one) to offscreen buffers. See [Shader: uniforms](#shader-uniforms)


#### Shader

An object with the following attributes:

| attribute (* - required)         | type                                       | description         |
| ------------------------------ | -------------------------------------------- | ------------------- |
| [texture](#shader-texture)     | function([WebGLRenderingContext], [Context]) | texture initializer |
| [uniforms](#shader-uniforms) * | Object of [Uniform setter](#uniform-setter)s | uniform setters     |


##### Shader: texture

Optional texture initializer called with [WebGLRenderingContext] and [Context] 
arguments. Here is the default initializer:

```javascript
(gl, ctx) => {
  ctx.initHalfFloatRGBATexture(ctx.width, ctx.height);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
```

:warning: Note: certain combinations of texture parameters might be not supported on some platforms.
In particular repeated textures are not rendered on some iOS devices unless their size is a power
of 2. Here is a recommended workaround:

```glsl
vec4 repeatedTexture(in sampler2D sampler, in vec2 uv) {
  return texture2D(sampler, mod(uv, 1.));
}
// or
#define repeatedTexture(sampler, uv) texture2D(sampler, mod(uv, 1.))
```

See [WebGLTexture], [Context: initHalfFloatRGBATexture](#context-inithalffloatrgbatexture)


##### Shader: uniforms

An object where an attribute name should match a shader uniform name, and an attribute value
represents a [uniform setter](#uniform-setter) function. 


###### Uniform setter

A function called with [WebGLRenderingContext], [WebGLUniformLocation] of the uniform
it belongs to and [Context]. It is intended to use all the provided arguments
to effectively set uniform value.

**Example 1** - setting floating-point value kept in JavaScript `time` variable:

```javascript
(gl, loc) => gl.uniform1f(loc, time)
```

:information_source: Note: the last argument of type [Context] is often not used and can be
omitted in declaration, like in the example above.


**Example 2** - setting resolution:

```javascript
(gl, loc, ctx) => gl.uniform2f(loc, ctx.width, ctx.height)
```

See [WebGLRenderingContext.uniform] specification for details.


**Example 3** - setting other shader's output as input texture:

```javascript
(gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA)
```

See [Context: buffers](#context-buffers)


**Example 4** - setting texture:

```javascript
(gl, loc, ctx) => gl.texture(loc, webCamTexture)
```

Where `webCamTexture` is an instance of [WebGLTexture].


### Config: onAfterFrame

The `onAfterFrame` function is called after processing all the shaders.


### Config: onError

The `onError` function is called in case of any [Error] which occurs while handling
the [shadeWebBackground.shade(config)](#shaderwebbackgroundshadeconfig) call. It
be called with the [Error] and the [canvas][HTMLCanvasElement] as arguments.


## Context

An object with the following attributes:

| attribute                                                     | type                                                         | description                      |
| ------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------- |
| [gl](#context-gl)                                             | [WebGLRenderingContext]                                      | handle for WebGL calls           |
| [canvas](#context-canvas)                                     | [HTMLCanvasElement]                                          | the canvas being shaded          |
| [width](#context-width)                                       | number                                                       | device pixel width               |
| [height](#context-height)                                     | number                                                       | device pixel height              |
| [cssPixelRatio](#context-csspixelratio)                       | number                                                       | device pixel / CSS pixel         |
| [cssWidth](#context-csswidth)                                 | number                                                       | width in CSS pixels              |
| [cssHeight](#context-cssheight)                               | number                                                       | height in CSS pixels             |
| [isOverShader](#context-isovershader)                         | function(number, number): boolean                            | checks if mouse is over shader   |
| [toShaderX](#context-toshaderx)                               | function(number): number                                     | CSS x coordinate to shader x .   |
| [toShaderY](#context-toshadery)                               | function(number): number                                     | CSS y coordinate to shader y     |
| [buffers](#context-buffers)                                   | Object                                                       | buffers of offscreen shaders     |
| [texture](#context-texture)                                   | function([WebGLUniformLocation], ([WebGLTexture]\|[Buffer])) | binds texture as a uniform       |
| [initHalfFloatRGBATexture](#context-inithalffloatrgbatexture) | function(number, number)                                     | init floating-point RGBA texture |

:information_source: Note: this object is passed as an argument to many functions and it is
also returned by the [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig) call.


### Context: gl

The [WebGLRenderingContext].


### Context: canvas

The HTML canvas element associated with this context.


### Context: width

The "pixel" width of the canvas,
might differ from the [cssWidth](#context-csswidth).

Typically used together with the [height](#context-height) attribute.


### Context: height

The "pixel" height of the canvas,
might differ from the [cssHeight](#context-cssheight).

Example usage:

```javascript
shaderWebBackground.shade({
  shaders: {
    image: {
      uniforms: {
        iResolution: (gl, loc, ctx) => gl.uniform2f(loc, ctx.width, ctx.height)        
      }
    }
  }
});
```


### Context: cssPixelRatio

The ratio of "CSS pixels" comparing to real "pixels", might be necessary for some
calculations, for example simulation of background scrolling,
possibly with [parallax scrolling](https://en.wikipedia.org/wiki/Parallax_scrolling):

```javascript
shaderWebBackground.shade({
  onBeforeFrame: (ctx) => {
    ctx.iVerticalShift = window.scrollY * ctx.cssPixelRatio;
  },
  shaders {
    scrollableBackground: {
      uniforms: {
        iVerticalShift: (gl, loc, ctx) => gl.uniform1f(loc, ctx.iVerticalShift)
      }
    }
  }
});
```


### Context: cssWidth

The width of the canvas as reported by the browser,
might differ from the pixel [width](#context-width).


### Context: cssHeight

The height of the canvas as reported by the browser,
might differ from the pixel [height](#context-height).


### Context: isOverShader

A helper function to tell if provided coordinates are within the rectangle
of shader canvas. Not very useful for full screen shaders, but might
be handy for smaller canvases.


### Context: toShaderX

Translates horizontal CSS coordinate (e.g. mouse pointer position) to corresponding pixel coordinate
of this shader.

See [Context: toShaderY](#context-toshadery)


### Context: toShaderY

Translates vertical CSS coordinate (e.g. mouse pointer position) to corresponding pixel coordinate
of this shader.

:warning: Note: shader rectangle coordinate `(0, 0)` is located in the bottom-left
corner, so the Y-axis is reversed. Actual coordinate passed to the shader
in `gl_FragCoord` is actually in the middle of the pixel, therefore in case of
a background shader covering the whole browser window the bottom-left corner
pixel will receive values `(.5, .5)`. The `getCoordinate[X|Y]` functions account
for this as well.

See [Context: toShaderX](#context-toshaderx)


### Context: buffers

An object representing offscreen buffers of all the shaders except for the last
one in the rendering pipeline. The attribute names match the shader names, except
for the last shader which is rendering to screen not to a buffer.


#### Buffer object

It's a placeholder object referencing the offscreen double buffer of a shader.

See [Shader uniforms](#shader-uniforms) section to check how it is being used.


### Context: texture

A function to bind uniforms of type `sampler2D`.


### Context: initHalfFloatRGBATexture

A function to initialize a texture where each pixel RGBA values have
floating-point precision. It takes `width` and `height` as parameters.


Example usage:

```javascript
shaderWebBackground.shade({
  shaders: {
    feedback: {
      texture: (gl, ctx) => {
        ctx.initHalfFloatRGBATexture(ctx.width, ctx.height);
        // standard WebGL texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);        
      }
    }
  }
});
```

## shaderWebBackground.Error

A base class to indicate problems with the
the [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig) call.

See [Config: onError](#config-onerror) and [README: Handling errors](README.md#handling-errors).


## shaderWebBackground.ConfigError

Extends [shaderWebBackground.Error](#shaderwebbackgrounderror) to indicate misconfiguration of
the [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig) call.

See [Config: onError](#config-onerror) and [README: Handling errors](README.md#handling-errors).


## shaderWebBackground.GlError

Extends [shaderWebBackground.Error](#shaderwebbackgrounderror) to indicate that
the [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig) call cannot be satisfied
due to lack of WebGL capabilities of the browser (might be a hardware limitation).

See [Config: onError](#config-onerror) and [README: Handling errors](README.md#handling-errors).

[Config]:  #config
[Context]: #context
[Buffer]:  #buffer-object

[Error]:                         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[HTMLCanvasElement]:             https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
[WebGLRenderingContext]:         https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
[WebGLUniformLocation]:          https://developer.mozilla.org/en-US/docs/Web/API/WebGLUniformLocation
[WebGLTexture]:                  https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture
[WebGLRenderingContext.uniform]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
