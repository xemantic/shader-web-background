# shader-web-background

_Displays GLSL fragment shaders as a website background. Supports Shadertoy shaders,
multipass - ping-pong offscreen buffers, feedback loops, floating-point textures.
Either with WebGL 1 or 2, will try to run wherever it's technically possible._

**Website/Demo:** :fireworks: https://xemantic.github.io/shader-web-background :sparkler:

:grey_question::rainbow::angel::construction_worker: To ask questions go to [xemantic discord server](https://discord.gg/vQktqqN2Vn) :coffee::tea::strawberry::space_invader:

![shader-web-background logo](https://xemantic.github.io/shader-web-background/media/shader-web-backgroung.jpg)

I designed this library to use complex fragment shaders as part of my web design and development
process. This is the tool which finally lets me embrace the web browser as a creative coding
environment. If you are familiar with GLSL, then it might help you publish your work on
web as well. If you are coming from a web development background,
then you might want to learn a bit more about shaders first, for example from
[The Book of Shaders](https://thebookofshaders.com/). I hope that examples presented
in this documentation are self-explanatory. If you find it useful, then

[:heart: Sponsor xemantic on GitHub](https://github.com/sponsors/xemantic) or
![Buy me a tea](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20tea&emoji=🍵&slug=kazik&button_colour=BD5FFF&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00)
https://www.buymeacoffee.com/kazik


_Kazik (morisil) Pogoda_

https://xemantic.com/

---


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Features](#features)
- [Adding shader-web-background to your projects](#adding-shader-web-background-to-your-projects)
  - [Step 1 - Add library to your project](#step-1---add-library-to-your-project)
    - [Option A - Embedded minified library directly in HTML](#option-a---embedded-minified-library-directly-in-html)
    - [Option B - Reference the minified library](#option-b---reference-the-minified-library)
    - [Option C - Download distribution](#option-c---download-distribution)
  - [Step 2 - Add your fragment shaders](#step-2---add-your-fragment-shaders)
  - [Step 3 - Start shading](#step-3---start-shading)
  - [Step 4 - Specify fallback styles](#step-4---specify-fallback-styles)
- [shader-web-background API](#shader-web-background-api)
- [Configuring shading](#configuring-shading)
  - [Adding shader uniforms](#adding-shader-uniforms)
    - [About uniforms](#about-uniforms)
    - [Textures as uniforms](#textures-as-uniforms)
  - [Initializing shader texture](#initializing-shader-texture)
  - [Complex config example](#complex-config-example)
  - [Handling errors](#handling-errors)
- [Shader GLSL version](#shader-glsl-version)
- [Adding mouse support](#adding-mouse-support)
- [Adding textures](#adding-textures)
- [Shadertoy support](#shadertoy-support)
  - [What to do with Shadertoy "Common" tab?](#what-to-do-with-shadertoy-common-tab)
  - [What to do with `texture` function?](#what-to-do-with-texture-function)
  - [Handling Shadertoy texture parameters](#handling-shadertoy-texture-parameters)
  - [How to handle "Multipass" Shadertoy shaders?](#how-to-handle-multipass-shadertoy-shaders)
- [Own vertex shader](#own-vertex-shader)
- [General tips](#general-tips)
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
* **convenience**: straightforward [API](API.md), specific errors will inform you about mistakes
  which are otherwise hard to debug.
* **minimal footprint**: transpiled from JavaScript to JavaScript with
  [Google Closure Compiler].
* **pixel feedback loops**: preserving movement in time on offscreen buffers with floating–point precision.
* **[Shadertoy support](#shadertoy-support)**: including multipass shaders
* **cross browser / cross device**: on Chrome, Safari, Firefox or Edge, either with WebGL 1 or 2,
  on Linux, Windows, Mac, iPhone or Samsung phone — it will use optimal strategy to squeeze out what's possible from the browser and the hardware.

## Adding shader-web-background to your projects

**TL;DR:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Minimal shader</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <script src="https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js"></script>
  <script type="x-shader/x-fragment" id="image">
    precision highp float;

    uniform float iTime;

    void main() {
      gl_FragColor = vec4(
        mod(gl_FragCoord.x / 256., 1.),
        mod((gl_FragCoord.x + gl_FragCoord.y - iTime * 40.) / 256. , 1.),
        mod(gl_FragCoord.y / 256., 1.),
        1.
      );
    }
  </script>
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
  <style>
    .shader-web-background-fallback {
      background: url("https://placekitten.com/666/666");
      background-position: center;
      background-size: cover;
      background-attachment: fixed;
    }
  </style>
</head>
<body>
  <h1>shader-web-background minimal example</h1>
</body>
</html>
```

:information_source: If you prefer to learn by example, here is the list of demos displayed
with their highlighted source code:

https://xemantic.github.io/shader-web-background/#demo

There are several ways of adjusting this library to your needs:


### Step 1 - Add library to your project

#### Option A - Embedded minified library directly in HTML

If you want your shaders to start rendering before any other resources are loaded,
then go for this method. Just take the contents of:

https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js

and put it as `<script>` in the `<head>` of your HTML file.

See [minimal demo](demo/minimal.html) for reference
([live version](https://xemantic.github.io/shader-web-background/demo/minimal.html)). 


#### Option B - Reference the minified library

Add this code to the `<head>` of your HTML:

```html
<script src="https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js"></script>
```


#### Option C - Download distribution

In the future I will publish `shader-web-background` to npm. For now you can just
download the latest minified distribution together with source map and sources.


### Step 2 - Add your fragment shaders

You will need at least one fragment shader defined like this:

```html
<script type="x-shader/x-fragment" id="image">
  precision highp float;

  void main() {
    // ...
  }
</script>
``` 

Put it in the `<head>` of your HTML. The `type` should be `x-shader/x-fragment` and
the `id` attribute is arbitrary. 

:warning: Note: Remember to give unique `id` to each of your shaders if you are
defining more of them.

### Step 3 - Start shading

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
shader source `id` attribute. 


### Step 4 - Specify fallback styles

:information_source: This step is not necessary, however adding it will improve
the experience for the small amount of users who still cannot
run shaders on their devices.

Define fallback CSS style, for example a static screenshot of your shader frame: 

```html
<style>
  .shader-web-background-fallback {
    background: url("https://placekitten.com/666/666");
    background-position: center;
    background-size: cover;
    background-attachment: fixed;    
  }
</style>
```
The `shader-web-background-fallback` CSS class is applied to HTML document root and
the canvas.

:warning: Note that in case of any errors the default canvas will not be attached
to HTML document at all. In case of shading a canvas which is already attached
to HTML, it might be tempting to provide a fallback canvas background based on the
`shader-web-background-fallback` CSS class, however it might not work on some browsers.
Custom error handler might be needed for cross compatibility.

See [Handling errors](#handling-errors) section for details.


## shader-web-background API

See the full [shader-web-background API](API.md) 


## Configuring shading

The [configuration object](API.md#config) passed to the
[shaderWebBackground.shade(config)](API.md#shaderwebbackgroundshadeconfig)
call in the example above will result in a minimal rendering pipeline consisting of one fragment
shader named `image`. A new static
`<canvas id="shader-web-background">` element covering the whole viewport
will be added to the page with `z-index: -9999`, to be displayed behind other page elements.

:information_source: Note: the default `<canvas>` element will be attached to document
`<body>` only when the whole DOM tree is constructed. Also the actual rendering
of shader frames will not happen until the page is fully loaded, even though shaders
are compiled immediately.


### Adding shader uniforms

#### About uniforms

Uniforms provide shaders with the input from the world outside GPU.
Describing this mechanism is out of scope of this documentation.
I decided not to build abstraction over this part of WebGL, because it is
already quite concise. See [WebGLRenderingContext.uniform] documentation.

Let's assume that you want to provide your shader with a time value measured
in seconds since the moment the page was loaded. First define a uniform in the
`image` shader:

```glsl
uniform float iTime;
```

The `iTime` name is arbitrary, but it should match with what you
specify in the configuration:

```javascript
shaderWebBackground.shade({
  shaders: {
    image: {
      uniforms: {
        iTime: (gl, loc) => gl.uniform1f(loc, performance.now() / 1000)
      }
    }
  }
});
```

The `(gl, loc) => gl.uniform1f(loc, performance.now() / 1000)` function will
be invoked before rendering each shader frame. If you are not familiar with
[JavaScript arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions),
it's an equivalent of:

```javascript
function(gl, loc) {
  gl.uniform1f(loc, performance.now() / 1000)
}
```

:information_source: Check documentation of the standard JavaScript [performance.now()]
function which returns the number of milliseconds since the page was loaded.
Dividing it by `1000` will result in floating-point value measured in seconds.

:warning: During development check the console often. If you will forget to configure
a uniform declared in the shader, then exception will be thrown (See
[error-no-configuration-of-shader-uniform](src/test/html/errors/error-no-configuration-of-shader-uniform.html)
test case). Also if you configure a uniform which does not exist in the shader, 
then a warning will pop up on console (see
[error-unnecessary-uniform-configured](src/test/html/errors/error-unnecessary-uniform-configured.html) 
test case).

Summary: you can use this mechanism to adapt any API as an input of your shaders.
Check project [demos](https://xemantic.github.io/shader-web-background/#demo) for
examples how to integrate input like:

* mouse (fullscreen augmentation of the pointer)
* scrolling position (parallax scrolling effect)
* device orientation (fullscreen reaction to device tilting)
* externally computed coefficients controlling the animation

#### Textures as uniforms

The declaration of "texture" uniform uses `sampler2D` type:

```glsl
uniform sampler2D iWebCam;
```

:information_source: The uniform name is arbitrary. For example [Shadertoy] is
binding textures under name `iChannel0`, `iChannel1`, etc. and this is the convention
used mostly in this documentation.

Such a uniform can be set with:

```javascript
shaderWebBackground.shade({
  onInit: (ctx) => {
    ctx.iWebCam = initializeTexture(ctx.gl);
  },
  shaders: {
    image: {
      uniforms: {
        iWebCam: (gl, loc, ctx) => ctx.texture(loc, ctx.iWebCam);
      }
    }
  }
});
```

:information_source: the _texture_ passed as a second argument
to [ctx.texture](API.md#context-texture) can be either an instance of [WebGLTexture] or
a reference to the buffer of another shader in the pipeline. Check 
[Complex config example](#complex-config-example) section and
[API - Context: buffers](API.md#context-buffers).

See [Adding textures](#adding-textures) section for details on how to load a texture from
an image.


### Initializing shader texture

All the shaders, except for the last one in the pipeline, will have associated textures to
render to. By default these textures are initialized as RGBA `HALF_FLOAT` (16bit) floating-point
with linear interpolation and are clamped to the edge. The texture initialization can be
customized. See [API - Shader: texture](API.md#shader-texture) documentation for details. 

:warning: Note: the default settings will work on all the platforms while customization
can easily break the compatibility, especially on older iOS devices. Consult the API
for remedies.


### Complex config example

Here is a comprehensive example of a [configuration object](API.md#config) with
comments. It is using [Shadertoy] conventions for naming buffers and uniforms
but keep in mind that the naming is arbitrary and might be adjusted to the needs
of your project.

```javascript
// mouse coordinates taken from from the mousemove event expressed in "CSS pixels"
var mouseX;
var mouseY;

document.addEventListener("mousemove", (event) => {
   mouseX = event.clientX;
   mouseY = event.clientY;
});

shaderWebBackground.shade({
  // supplied canvas to use for shading
  canvas: document.getElementById("my-canvas"),
  // called only once before the first run
  onInit: (ctx) => {
    // we can center the mouse even before any "mousemove" event occurs
    // note, we are 
    mouseX = ctx.cssWidth / 2;
    mouseY = ctx.cssHeight / 2;
    // for convenience you can store your attributes on context
    ctx.iFrame = 0;
  },
  onResize: (width, height, ctx) => {
    ctx.iMinDimension = Math.min(width, height);
  },                 
  onBeforeFrame: (ctx) => {
    ctx.shaderMouseX = ctx.toShaderX(mouseX);
    ctx.shaderMouseY = ctx.toShaderY(mouseY);
  },
  shaders: {
    // the first buffer to be rendered in the pipeline
    BufferA: {
      // uniform setters, attribute names should match with those defined in the shader
      uniforms: {
        // uniform value calculated in place
        iTime: (gl, loc) => gl.uniform1f(loc, performance.now() / 1000),
        // uniform values taken from context
        iFrame: (gl, loc) => gl.uniform1i(loc, ctx.iFrame),
        iMinDimension: (gl, loc, ctx) => gl.uniform1f(loc, ctx.iMinDimension),
        iResolution: (gl, loc, ctx) => gl.uniform2f(loc, ctx.width, ctx.height),
        iMouse: (gl, loc, ctx) => gl.uniform2f(loc, ctx.shaderMouseX, ctx.shaderMouseY),        
        // inputing the previous output of itself - feedback loop 
        iChannel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA)
        // ... more uniforms
      }
    },
    // ... more shaders
    BufferD: {
      // optional custom initializer of buffer's texture                   
      texture: (gl, ctx) => {
        // initializing floating-point texture in custom way for WebGL 1 and 2        
        ctx.initHalfFloatRGBATexture(ctx.width, ctx.height);
        // standard WebGL texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);        
      },    
      uniforms: {
        iChanel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferA)
        // ... more uniforms
      }
    },
    // the last shader will render to screen
    Image: {
      uniforms: {
        iChanel0: (gl, loc, ctx) => ctx.texture(loc, ctx.buffers.BufferD)
        // ... more uniforms
      }
    }    
  },
  onAfterFrame: (ctx) => {
    ctx.iFrame++;
  },
  // custom error handler
  onError: (error, canvas) => {
    canvas.remove();
    console.error(error);
    document.documentElement.classList.add("my-fallback");
  }
});
```

The API is intended to be self explanatory. Check [API specification](API.md) for details.
There are several shaders defined in the example above. They will be processed in sequence
called `Multipass` in [Shadertoy] nomenclature. The last of defined shaders will render to screen.
The output of previous shaders, including feedback loop of the previous frame rendered by the same
shader, can be easily passed to uniforms.


### Handling errors

Several validations are being performed on supplied configuration to avoid common problems
which are usually hard to debug otherwise. The [src/test/html/errors/](src/test/html/errors)
folder contains all the error test cases which can be also checked on
the
[live demo of error handling](https://xemantic.github.io/shader-web-background/src/test/html/errors/).

All the errors and warnings will be visible on console.

See:

 * [API - Config: onError](API.md#config-onerror)
 * [API - shaderWebBackground.ConfigError](API.md#shaderwebbackgroundconfigerror)
 * [API - shaderWebBackground.GlError](API.md#shaderwebbackgroundglerror)


## Shader GLSL version

:warning: This library relays on WebGL 1 as a common denominator, therefore even if it will use
WebGL 2 whenever it is supported in runtime, the shader code should be still compatible with
[GLSL ES 1.00](https://www.khronos.org/registry/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf)


## Adding mouse support

```javascript
// mouse coordinates taken from from the mousemove event
var mouseX;
var mouseY;

document.addEventListener("mousemove", (event) => {
   mouseX = event.clientX;
   mouseY = event.clientY;
});

// mouse coordinates relative to the shader, you can also store them on the context
var shaderMouseX;
var shaderMouseY;

shaderWebBackground.shade({
  onInit: (ctx) => {
    // screen center
    mouseX = ctx.cssWidth / 2;
    mouseY = ctx.cssHeight / 2;
  },
  onBeforeFrame: (ctx) => {
    shaderMouseX = ctx.toShaderX(mouseX);
    shaderMouseY = ctx.toShaderY(mouseY);
  },
  shaders: {
    image: {
      uniforms: {
        iMouse: (gl, loc) => gl.uniform2f(loc, shaderMouseX, shaderMouseY)
      }
    }
  }
});
```

:information_source: Note: initial mouse coordinates are provided in `onInit` function
because the first `mousemove` event can happen long after the shader is started. Shader
coordinates start at the bottom-left corner of the canvas and are aligned with the middle
of the pixel - `(0.5, 0.5)`.

API reference:

 * [Context: cssWidth](API.md#context-csswidth)
 * [Context: cssHeight](API.md#context-cssheight)
 * [Context: toShaderX](API.md#context-toshaderx)
 * [Context: toShaderY](API.md#context-toshadery)

Demos:

 * [mouse](https://xemantic.github.io/shader-web-background/demo/mouse.html)
 * [mouse normalized](https://xemantic.github.io/shader-web-background/demo/mouse-normalized.html)

## Adding textures

:warning: Working with textures locally will be limited by the same security mechanisms which
prevent them from being loaded from a different domain
([explanation](https://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html)). For
local testing you might want to start local HTTP server. E.g.: `python -m http.server 8000` if
it doesn't work on your latest ubuntu than run `sudo apt install python-is-python3` first.

See [texture: Blue Marble to Flat Earth mapping](https://xemantic.github.io/shader-web-background/demo/texture-blue-marble-to-flat-earth.html)
demo

Textures can be set in the same way buffers are set as uniforms, but first we need to load them.
For example by defining custom Promise which can be reused:

```javascript
const loadImage = (src) => new Promise((resolve, reject) => {
  let img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => {
    reject(new Error("Failed to load image from: " + src));
  }
  img.src = src;
});
```

The `onInit` function is quite a convenient place for calling `loadPicture`:

```javascript
shaderWebBackground.shade({
  onInit: (ctx) => {
    loadImage("texture.jpg")
      .then(image => {
        const gl = ctx.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
        ctx.iTexture = texture;
      });
  },
  shaders: {
    image: {
      uniforms: {
        iTexture:    (gl, loc, ctx) => ctx.texture(loc, ctx.iTexture)
      }
    }
  }
});
```


## Shadertoy support

This library can utilize [Shadertoy] code with minimal effort - a simple shader wrapping:

```html
<script type="x-shader/x-fragment" id="Image">
  precision highp float;

  uniform vec2  iResolution;
  uniform float iTime;
  // ... other needed uniforms
 
  // -- Paste your Shadertoy code here:
  // ...
  // -- End of Shadertoy code
    
    
  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
</script>
```

The `id` attribute of the `<script>` is set to reflect [Shadertoy] tab called `Image`.
Most shaders will use at least these 2 uniforms, and it's easy to provide their
values in the configuration:

```javascript
shaderWebBackground.shade({
  shaders: {
    Image: {
      uniforms: {
        iResolution: (gl, loc, ctx) => gl.uniform2f(loc, ctx.width, ctx.height),
        iTime:       (gl, loc) => gl.uniform1f(loc, performance.now() / 1000),
      }
    }
  }
});
```

Shadertoy demos:

 * [minimal shadertoy demo](https://xemantic.github.io/shader-web-background/demo/shadertoy-default.html).
 * [Warping - procedural 2 by Inigo Quilez](https://xemantic.github.io/shader-web-background/demo/shadertoy-warping-procedural-2.html)
 * [Reaction Diffusion - 2 Pass by Shane](https://xemantic.github.io/shader-web-background/demo/shadertoy-reaction-diffusion-2-pass.html)


### What to do with Shadertoy "Common" tab?

There is no automated solution for that. You will have to copy the `Common` part directly
into your shaders, just above the other [Shadertoy] code.


### What to do with `texture` function?

In [Shadertoy] textures are accessed with the `texture` function while in WebGL 1 it is 
`texture2D`. Here is a simple workaround to be added before the original code:

```glsl
#define texture texture2D
```


### Handling Shadertoy texture parameters

In [Shadertoy] each "Channel" binding a texture can have separate sampler parameters
like interpolation or wrapping. This functionality cannot be easily ported to WebGL 1,
but most shaders relaying on these features can be adjusted with code-based workarounds.
For example if the texture is supposed to be repeated, then something like this might be
a functional replacement of the `texture` function in a given shader:

```glsl
vec4 repeatedTexture(in sampler2D channel, in vec2 uv) {
  return texture2D(channel, mod(uv, 1.));
}
```

:warning: Mipmaps are not supported.

See also [API - Shader: texture](API.md#shader-texture).


### How to handle "Multipass" Shadertoy shaders?

You can name your shaders according to [Shadertoy] buffer names:

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

    // ... the code of Image tab with the uniforms and wrapping as above
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

## Own vertex shader

It's possible to alter default vertex shader for each fragment shader by providing
the following script in the `<head>`:

```javascript
<script type="x-shader/x-vertex" id="shaderIdVertex">
  attribute vec2 V;
  varying vec2 uv;

  void main(){
    gl_Position=vec4(V,0,1);
  }
</script>
<script type="x-shader/x-fragment" id="shaderId">
  // ...
  varying vec2 uv;
  // ...
</script>
```

:information_source: Note: the script `type` is set to `x-shader/x-vertex` and the
`id` attribute is prepended with `Vertex` suffix. The vertex attribute should be named
`V`.

:information_source: Note: `varying vec2 uv` can be specified to be shared between vertex
and fragment shaders (not added by default).


## General tips

* set the html background color to the dominant color of your shader to avoid flickering
  on page load


## Building

```console
git clone https://github.com/xemantic/shader-web-background.git
cd shader-web-background
./gradlew compileJs
```

It will trigger Google Closure Compiler which will check sources using type information
and transpile them into minified JavaScript files:

 * [dist/shader-web-background.min.js](dist/shader-web-background.min.js)
 * [dist/shader-web-background.min.js.map](dist/shader-web-background.min.js.map)


## Contributing

### Code conventions

This project has been developed using
[IntelliJ IDEA](https://www.jetbrains.com/idea/) with
[google-java-format](https://plugins.jetbrains.com/plugin/8527-google-java-format)
plugin enabled. The most noticeable element of this style are 2 spaces
instead of 4 for rendering tabs. 


### Adding your project to the list of project using this library

Either:

 * fork this repo
 * open [index.html](index.html) and scroll to `<section id="projects-using-shader-web-background">`
 * add your project to the list
 * create pull-request

Or [send me](https://xemantic.com/) a link with description.


## Tools and dependencies

 * [gradle](https://gradle.org/) as a build system
 * [Kotlin](https://kotlinlang.org/) for scripting the build
 * [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
   for [OpenGL](https://www.opengl.org/) based rendering
 * [Google Closure Compiler] for verifying JavaScript and minimizing it
 * [highlight.js](https://highlightjs.org/) (minimal modification - 
   [GLSL in HTML script support](lib/highlight/LOCAL_CHANGES.md)) for presenting the code in demo
   folder
 * [screenfull.js](https://github.com/sindresorhus/screenfull.js/) for cross-browser fullscreen
   support in library demo
 * [NoSleep.js](https://richtr.github.io/NoSleep.js/) for preventing sleep and screen dimming
   in fullscreen mode demo
 * [BrowserStack](https://www.browserstack.com/) for testing the library on variety of
   physical mobile and tablet devices


## TODO

 * remove h1 on iphone as an alternative to real fullscreen
 * add an option to install as a home app on android and iOS


[Shadertoy]:                     https://www.shadertoy.com/
[performance.now()]:             https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
[Google Closure Compiler]:       https://github.com/google/closure-compiler
[WebGLTexture]:                  https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture
[WebGLRenderingContext.uniform]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/uniform
