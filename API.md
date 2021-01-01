# shader-web-background API

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig)
- [Config](#config)
  - [Config: shaders](#config-shaders)
    - [Shader object](#shader-object)
      - [Uniform setter](#uniform-setter)
  - [Config: canvas](#config-canvas)
  - [Config: onInit](#config-oninit)
  - [Config: onResize](#config-onresize)
  - [Config: onBeforeFrame](#config-onbeforeframe)
  - [Config: onAfterFrame](#config-onafterframe)
  - [Config: onError](#config-onerror)
- [Context](#context)
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
providing a [configuration](#config) object and returns a [context](#context) object.

The processing of configuration and shader compilation will start immediately,
however the animation frames will be requested only when the page is loaded.

This function might throw [shaderWebBackground.Error](#shaderwebbackgrounderror)s of type:

* [shaderWebBackground.ConfigError](#shaderwebbackgroundconfigerror)
* [shaderWebBackground.GlError](#shaderwebbackgroundglerror)


## Config

An object with the following attributes:

| attribute                              | type (`=`- optional)                               | description                           |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| [canvas](#config-canvas)               | [HTMLCanvasElement]                                | canvas to render to                   |
| [onInit](#config-oninit)               | function([Context](#context)=)                     | called before first run               |
| [onResize](#config-onresize)           | function(number, number, [Context](#context)=)     | called when the canvas is resized     |
| [onBeforeFrame](#config-onbeforeframe) | function([Context](#context)=)                     | called before each frame              |
| [shaders](#config-shaders)             | Object (attribute=shader)                          | definition of shaders                 |
| [onAfterFrame](#config-onafterframe)   | function([Context](#context))                      | called when the frame is complete     |
| [onError](#config-onerror)             | function([HTMLCanvasElement], [Context](#context)) | called when shading cannot be started |

All the attributes are optional except for the [shaders](#config-shaders). Their order is arbitrary,
but here they are sorted by their "lifecycle" in rendering pipeline.


### Config: shaders

The `shaders` is the only required attribute of the config object. It's value should
be an object, where each attribute name represents one shader, therefore multiple
shaders can be defined in sequence. All together they will establish a rendering pipeline.

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
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA), // latest output
        iChannel1: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferB)  // previous frame of self
      }
    },
    Image: {
      uniforms: {
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA), // latest output
        iChannel1: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferB)  // latest output
      }
    }
  }
});
```

:information_source: Note: shader names are arbitrary. The last shader will render to screen,
the previous ones to offscreen buffers.

#### Shader object




processed in sequence called `Multipass` in Shadertoy
nomenclature. The last of defined shaders will render to screen. The output of previous
shaders, including feedback loop of the previous frame rendered by the same shader,
can be easily passed to uniforms, here is an example using Shadertoy naming conventions:

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
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA), // latest output
        iChannel1: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferB)  // previous frame of self
      }
    },
    Image: {
      uniforms: {
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA), // latest output
        iChannel1: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferB)  // latest output
      }
    }
  }
});
```

The `iChannelN` uniforms are defined in GLSL as follows:

```glsl
uniform sampler2D iChannelN;
```

The uniform setter function `(gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferX)`
is the same as the one used for providing other uniforms, but in this case optional
3rd parameter `ctx` is provided. The `ctx.texture()` call can take either `WebGLTexture`
instance or the instance of `shader-web-background` internal context from which proper
input or output texture of a buffer will be selected. The buffers can be
accessed through `ctx.buffers` object. Names of the attributes in this object will
match the names of attributes defined in `shaders` config attribute, except for the
last shader which is not offscreen and cannot be accessed as a texture.

##### Uniform setter

The uniform setter function example:

```
(
  gl,     // the WebGLContext instance
  loc,    // the WebGLUniformLocation instace assigned with this uniform 
  ctx     // the context object
) => {}
```

The `gl` and the `loc` parameters are WebGL specific which allows performing low level
operation. In most cases it will be very simple uniform setting which can be
used idiomatically:

```javascript
(gl, loc) => gl.uniform1f(loc, uniformValue)
```

See the full specification here:
https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform

The `loc` `WebGLUniformLocation` instance is provided according to the uniform
location taken from compiled shader program.

The optional `ctx` parameter represents internal context of the library and will have
the following structure:

```javascript
{
  buffers: {
    BufferA: buffer_a,
    // ...
    BufferN: buffer_n,
  },
  texture: (loc, textureOrBuffer) => {}
}
```

The `buffer_n` instances are used just as references to be possibly passed to the
`texture` function. If we are injecting a buffer to the shader of the same buffer,
the previous texture generated by this shader will be used. Otherwise the most recent
generated output texture will be used.

Another valid argument type to be passed to the `texture` function is an instance
of `WebGLTexture`. It can represent for example a frame taken from the webcam input.


### Config: canvas

If `canvas` attribute is not specified, the default one covering the whole viewport behind other
DOM elements will be created.

### Config: onInit

### Config: onResize

The `onResize` function is invoked with `with` and `height` parameters indicating actual
screen dimensions of the canvas after browser window is resized. It will be also
called when the shading is started with the `shaderWebBackground.shade(config)` call.

### Config: onBeforeFrame

### Config: onAfterFrame

The `onAfterFrame` function is invoked when scheduling of the rendering of the whole
animation frame is finished. It can be used to increment frame counters, etc.

### Config: onError



## Context

An object with the following attributes:

| attribute                                                     | type                                                       | description                               | 
| ------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------- | 
| [canvas](#context-canvas)                                     | [HTMLCanvasElement]                                        | the canvas being shaded | 
| [width](#context-width)                                       | number                                                     | device pixel width            | 
| [height](#context-height)                                     | number                                                     | device pixel height            | 
| [cssPixelRatio](#context-csspixelratio)                       | number                                                     | device pixel / CSS pixel            |    
| [cssWidth](#context-csswidth)                                 | number                                                     | width in CSS pixels            |    
| [cssHeight](#context-cssheight)                               | number                                                     | height in CSS pixels            |    
| [isOverShader](#context-isovershader)                         | function(number, number): boolean                          | checks if             |    
| [toShaderX](#context-toshaderx)                               | function(number): number                                   | CSS x coordinate to shader x .            |    
| [toShaderY](#context-toshadery)                               | function(number): number                                   | CSS y coordinate to shader y             |    
| [buffers](#context-buffers)                                   | Object                                                     | buffers of offscreen shaders            |    
| [texture](#context-texture)                                   | function([WebGLUniformLocation], ([WebGLTexture]\|Buffer)) |             |    
| [initHalfFloatRGBATexture](#context-inithalffloatrgbatexture) | function(number, number)                                   | init floating point RGBA texture of given size |            |    

:information_source: Note: the `context` object is passed as an argument to many functions and it is
also returned by the [shaderWebBackground.shade(config)](#shaderwebbackgroundshadeconfig) call.

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

Translates horizontal CSS coordinate to respective pixel coordinate of a given
shader.


### Context: toShaderY

Translates horizontal CSS coordinate to respective pixel coordinate of a given
shader.

:warning: Note: shader rectangle coordinate `(0, 0)` is located in the bottom-left
corner, so the Y-axis is reversed. Actual coordinate passed to the shader
in `gl_FragCoord` is actually in the middle of the pixel, therefore in case of
a background shader covering the whole browser window the bottom-left corner
pixel will receive values `(.5, .5)`. The `getCoordinate[X|Y]` functions account
for this as well.


### Context: buffers

And object representing offscreen buffers of all the shaders except for the last
one in the rendering pipeline. The attribute names match the shader names.


### Context: texture

A function to bind uniforms of type `sampler2D`.


### Context: initHalfFloatRGBATexture

A function to initialize a texture where each pixel RGBA values have
floating point precision. It takes `width` and `height` as parameters.


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


[HTMLCanvasElement]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement
[WebGLUniformLocation]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLUniformLocation
[WebGLTexture]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture

