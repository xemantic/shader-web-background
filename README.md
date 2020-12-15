# shader-web-background

_Displays GLSL fragment shaders as a website background. Supports WebGL 1 and 2, Shadertoy shaders,
multipass, pixel feedback loops on offscreen floating point textures._

**:fireworks:Website:**  https://xemantic.github.io/shader-web-background

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Features](#features)
- [How to use it in your projects?](#how-to-use-it-in-your-projects)
  - [1. Add library to your website](#1-add-library-to-your-website)
    - [a) Embedded minified library code in the source of your website](#a-embedded-minified-library-code-in-the-source-of-your-website)
    - [b) Reference the minified library](#b-reference-the-minified-library)
  - [2. Add your fragment shaders](#2-add-your-fragment-shaders)
  - [3. Start shading](#3-start-shading)
  - [4. Specify fallback (optional)](#4-specify-fallback-optional)
- [How to configure shading?](#how-to-configure-shading)
  - [fallback style](#fallback-style)
  - [Configuring shader uniforms](#configuring-shader-uniforms)
  - [shader-web-background API](#shader-web-background-api)
    - [canvas](#canvas)
    - [fallback](#fallback)
    - [onResize](#onresize)
    - [onFrameComplete](#onframecomplete)
    - [shaders](#shaders)
    - [Uniform setter](#uniform-setter)
    - [Configuration errors](#configuration-errors)
  - [3. Adding own uniforms](#3-adding-own-uniforms)
- [Setting uniforms](#setting-uniforms)
  - [Custom uniforms](#custom-uniforms)
    - [1. Specify uniform in your shader](#1-specify-uniform-in-your-shader)
    - [2. Provide uniform value in JavaScript](#2-provide-uniform-value-in-javascript)
- [Shadertoy compatibility](#shadertoy-compatibility)
  - [What to do with Shadertoy "Common" tab?](#what-to-do-with-shadertoy-common-tab)
  - [What to do with texture function?](#what-to-do-with-texture-function)
  - [How can I handle "Multipass" Shadertoy shaders?](#how-can-i-handle-multipass-shadertoy-shaders)
- [Tips](#tips)
- [Building](#building)
- [Contributing](#contributing)
  - [Code conventions](#code-conventions)
  - [Adding your project to the list of project using this library](#adding-your-project-to-the-list-of-project-using-this-library)
- [Tools and dependencies](#tools-and-dependencies)
- [TODO](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Features

* **simplicity**: it is just rendering canvas background as fragment shader.
* **speed**: designed to be embedded in HTML and start rendering before other page resources
  are downloaded.
* **extensibility**: adding own interaction and controls is trivial.
* **convenience**: straightforward API, specific errors will inform you about mistakes which are
  otherwise hard to debug.
* **minimal footprint**: transpiled from JavaScript to JavaScript with
  [Google Closure Compiler](https://github.com/google/closure-compiler).
* **pixel feedback loops**: preserving movement in time on offscreen buffers with floating–point precision.
* **shadertoy support**: including multipass shaders
* **cross browser / cross device**: on Chrome, Safari, Firefox or Edge, either with WebGL 1 or 2, on Linux, Windows, Mac, iPhone or Samsung phone — it will use optimal strategy to squeeze out what's possible from the browser and the hardware.

## How to use it in your projects?

TL;DR:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Minimal shader</title>
  <script src="https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js"></script>
  <script type="x-shader/x-fragment" id="image">
    precision highp float;

    void main() {
      gl_FragColor = vec4(
        mod(gl_FragCoord.x / 256., 1.),
        mod(gl_FragCoord.x + gl_FragCoord.y / 256., 1.),
        mod(gl_FragCoord.y / 256., 1.),
        1.
      );
    }
  </script>
  <script>
    shaderWebBackground.shade({
      shaders: {
        image: {}
      }
    });
  </script>
</head>
<body>
</body>
</html>
```

:information_source: If you prefer to learn by example, here is the list of demos displayed
with their highlighted source code:

https://xemantic.github.io/shader-web-background/#demo

There are several ways of using this library depending on your needs:


### 1. Add library to your website

#### a) Embedded minified library code in the source of your website

If you want your shaders to start rendering before any other resources are loaded,
then go for this method. Just take the contents of

https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js

and put it as `<script>` in the `<head>` of your HTML file.

See also this example, you can use it as a template:

https://xemantic.github.io/shader-web-background/demo/minimal.html

See [minimal demo](https://xemantic.github.io/shader-web-background/demo/minimal.html) for reference. 


#### b) Reference the minified library

Add this `script` to the `<head>` of your HTML:

```html
<script src="https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js"></script>
```

### 2. Add your fragment shaders

You will need at least one fragment shader defined like this:

```html
<script type="x-shader/x-fragment" id="image">
  precision highp float;

  void main() {
    // ...
  }
</script>
``` 

Put it in the `<head>` of your HTML. The the `type` should be `x-shader/x-fragment`.
The `id` attribute is arbitrary. 

:warning: Note: Remember to give unique `id` to each of your shaders if you are
defining more of them.

### 3. Start shading

```javascript
<script>
shaderWebBackground.shade({
  shaders: {
    image: {}
  }
});
</script>
```

:warning: Note: the shader name `image` should match the one defined as
shader `id` attribute. 

### 4. Specify fallback (optional)

Optional but highly recommended:

```javascript
<script>
shaderWebBackground.shade({
  fallback: true,
  // ...
});
</script>
```

Setting `fallback` will swallow `shaderWebBackground.GlError`s indicating
lack of required WebGL capabilities on the browser. In such a case the
`fallback` class is being added to the `canvas` element and can be use in
CSS for styling;

```css
#shader-web-background.fallback {
  background: url("my-fallback-image.jpg");
}
```

## How to configure shading?

The configuration object passed to the `shaderWebBackground.shade` method in the
example above will establish minimal rendering pipeline consisting of one fragment
shader named `image`. A new static
`<canvas id="shader-web-background">` element covering the whole viewport
will be added to the page.

:warning: Note: the default canvas element will be attached to document `<body>` only when the
whole DOM tree is constructed. Also the actual rendering of shader frames will not
happen until the HTML is fully loaded.

### fallback style

### Configuring shader uniforms

Most likely you want to pass more information to your shaders. For example if
you defined in your `image` shader:

```glsl
uniform vec2 iTime;
```

then it can be set with the following configuration:

```javascript
<script>
shaderWebBackground.shade({
  shaders: {
    image: {
      uniforms: {
        iTime: (gl, loc) => gl.uniform1f(loc, performance.now() / 1000)
      }
    }
  }
});
</script>
```

The `(gl, loc) => gl.uniform1f(loc, performance.now() / 1000)` function will
be invoked before each frame. 

Note: if you will forget to declare a uniform, or make a typo, then specific exception
informing you about it will be thrown. See
[error-no-configuration-of-shader-uniform](src/test/html/errors/error-no-configuration-of-shader-uniform.html)
and
[error-unnecessary-uniform-configured](src/test/html/errors/error-unnecessary-uniform-configured.html) 
test cases.

### shader-web-background API

The detailed API is defined in
[src/main/js/shader-web-background-api.js](src/main/js/shader-web-background-api.js)

Here is the full example of configuration object:

```javascript
{
  canvas:   myCanvas,              // supplied HTMLCanvasElement to use 
  fallback: true,                  // boolean, default: false
  onResize: (widht, height) => {}, // the function called on resizing the window
  onBeforeFrame: () => {},         // the function called before each frame
  onFrameComplete: () => {},       // the function called on completing the frame
  shaders: {
    shader1: {
      uniforms: {
        uniform1: (gl, loc, ctx) => {},
        // ...
        uniformN: (gl, loc, ctx) => {}
      }
    },
    // ...
    shaderN: {
      uniforms: {
        uniform1: (gl, loc, ctx) => {},
        // ...
        uniformN: (gl, loc, ctx) => {}
      }
    }
  }
}
```

#### canvas

If `canvas` is not specified, the default one covering the whole viewport behind other
DOM elements will be created.


#### fallback

If `fallback` is not specified, it will default to `false`, meaning that all the
errors will be thrown, including these indicating lack of required WebGL capabilities.


#### onResize

The `onResize` function is invoked with `with` and `height` parameters indicating actual
screen dimensions of the canvas after browser window is resized. It will be also
called when the shading is started with the `shaderWebBackground.shade(config)` call.
  

#### onFrameComplete

The `onFrameComplete` function is invoked when scheduling of the rendering of the whole
animation frame is finished. It can be used to increment frame counters, etc. 


#### shaders

Many shaders can be defined by name under `shaders` config attribute. All together they
will establish rendering pipeline processed in sequence called `Multipass` in Shadertoy
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
 
#### Uniform setter  

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
 

#### Configuration errors

Several validations are being performed on supplied configuration to avoid common problems
which are usually hard to debug otherwise. The
[src/test/html/errors/](src/test/html/errors) folder contains all the error test cases.
These test cases can be also accessed directly on project GitHub page:

https://xemantic.github.io/shader-web-background/src/test/html/errors/


### 3. Adding own uniforms

There is no standard support for mouse movement and it is by design.
Adding mouse tracking is relatively simple with own uniform setters. Check the `Custom Uniforms`
section below.

## Setting uniforms

### Custom uniforms

Uniforms can be used in shaders to provide some input from the "outside world".
Usually specified once per every frame. Describing this mechanism is out of the
scope of this documentation, however the way they are set here is using WebGL
directly, so you can refer to official uniform documentation.

#### 1. Specify uniform in your shader

For example to add mouse support, add this to your shader:

```glsl
// ...
uniform vec2 iMouse;
// ... 
```

#### 2. Provide uniform value in JavaScript

For example providing mouse coordinates can look like this:

```javascript
var mouseX = window.innerWidth / 2 + .5;
var mouseY = window.innerHeight / 2 + .5;

document.addEventListener("mousemove", (e) => {
   mouseX = e.offsetX - .5;
   mouseY = window.innerHeight - e.offsetY - .5;
});

shaderWebBackground.shadeOnLoad({
  shaders: {
    imageShader: {
      uniforms: {
        iMouse: (gl, loc) => gl.uniform2f(loc, mouseX, mouseY)
      }
    }
  }
});
```

A bit of context:

 * The window dimensions are divided by `2` to provide initial mouse coordinates.
 * We need to fix `mousemove` coordinates shader `gl_FragCoord` point to the middle
   of each pixel: `(0.5, 0.5) (1.5, 0.5)`, etc., therefore we need to "fix" mouse event
   coordinates.  
   // so we need to accommodate for that by removing half.
   // also vertical coordinate needs to be flipped. 

Note: providing mouse coordinates to multiple shaders will require separate `iMouse` entry
for each of them.

## Shadertoy compatibility

The library is designed to utilize Shadertoy code with minimal effort. General wrapping of
the Shadertoy code looks as follows:

```html
<script type="x-shader/x-fragment" id="Image">
  precision highp float;
    
  uniform vec2  iResolution;
  uniform float iTime;
    
  // -- Paste your Shadertoy code here:
  // ...
  // -- End of Shadertoy code
    
    
  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
</script>
```

The `id` attribute of the `<script>` is set to reflect Shadertoy tab called `Image`.
Most shaders will use at least these 2 uniforms, so we have to provide them as well in the
configuration:

```javascript
var canvasWidth;
var canvasHeight;
var time;

shaderWebBackground.shade({
  onResize: (width, height) => {
    canvasWidth = width;
    canvasHeight = height;
  },
  onBeforeFrame: () => {
    time = performance.now() / 1000;
  },
  shaders: {
    Image: {
      uniforms: {
        iResolution: (gl, loc) => gl.uniform2f(loc, canvasWidth, canvasHeight),
        iTime:       (gl, loc) => gl.uniform1f(loc, time),
      }
    }
  }
});
```

### What to do with Shadertoy "Common" tab?

There is no automated solution for that. You will have to copy the `Common` part of the shader
multiple times, possibly just above the other Shadertoy code.

### What to do with texture function?

Something like:

```glsl
#define texture texture2D
```

Should do the trick. If the texture is supposed to be repeated, then something like this
might be more suitable:

```glsl
vec4 repeatedTexture(in sampler2D channel, in vec2 uv) {
  return texture2D(channel, mod(uv, 1.));
}
```

Note: we cannot set the texture repeatable itself due to iOS compatibility issues.


### How can I handle "Multipass" Shadertoy shaders?

You can name your shaders according to Shadertoy buffer names:

* `BufferA`
* `BufferB`
* `BufferC`
* `BufferD`
* `Image`

And then wire them together:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Multipass Shadertoy shader</title>
  <script type="x-shader/x-fragment" id="BufferA">
    precision highp float;
    
    uniform sampler2D iChannel0;

    // ... the code of BufferA tab with the uniforms and wrapping as above
  </script>
  <script type="x-shader/x-fragment" id="Image">
    precision highp float;
    
    uniform sampler2D iChannel0;

    // ... the code of BufferA tab with the uniforms and wrapping as above
  </script>
  <script>
    // ... your prefer method of loading shader-web-background as described above
  </script>
  <script>
    shaderWebBackground.shade({
      shaders: {
        BufferA: {
          uniforms: {
            iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA)
          }
        },
        Image: {
          uniforms: {
            iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA)
          }
        }
      }
    });
  </script>
</head>
<body>
</body>
</html>
```

The `<shader>` element id's are arbitrary, but you might want to name them after names of
Shadertoy tabs. They must match the names configured `shaders`.

Shadertoy is binding textures under
`iChannel`*n* uniforms. In the example above additional specified `uniform sampler2D iChannel0`
code needs texture uniform binding.

## Tips

* set the html background color to the dominant color of your shader to avoid flickering
  on page load

## Building

```shell script
$ git clone https://github.com/xemantic/shader-web-background.git
$ cd shader-web-background
$ ./gradlew compileJs
```

It will trigger Google Closure Compiler which will check sources using type information
and transpile them into minified JavaScript files:

 * [dist/shader-web-background.min.js](docs/dist/shader-web-background.min.js)
 * [dist/shader-web-background.min.js.map](docs/dist/shader-web-background.min.js.map)


## Contributing

### Code conventions

Originally this project was developed using
[IntelliJ IDEA](https://www.jetbrains.com/idea/) with
[google-java-format](https://plugins.jetbrains.com/plugin/8527-google-java-format)
plugin enabled. The most noticeable element of this style are 2 spaces
instead of 4 for rendering tabs. 

### Adding your project to the list of project using this library

Either:
 * fork this repo
 * open [index.html](docs/index.html) and scroll to `<section id="projects-using-shader-web-background">`
 * add your project to the list
 * create pull-request

Or send me a link with description.

## Tools and dependencies

* gradle as a build system
* WebGL for OpenGL based rendering
* Google Closure Compiler for verifying JavaScript and minimizing it
* highligh.js for presenting code in demo folder

## TODO

 * fix iOS retina resolution uniforms, like it is done in glslCanvas
 * provide example with multiple canvases
