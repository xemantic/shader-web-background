# shader-web-background

_Displays GLSL fragment shaders as a website background. Supports Shadertoy shaders,
multipass - ping-pong offscreen buffers, feedback loops, floating point textures.
Either with WebGL 1 or 2, will try to run wherever it's technically possible._

**Website/Demo:** :fireworks: https://xemantic.github.io/shader-web-background :fireworks:

I ([xemantic](https://xemantic.com/)) designed this library to use complex
fragment shaders as part of my web design and development process. This is the tool
which finally lets me embrace the web browser as a creative coding environment. If you
are familiar with GLSL, then it might help you publish your work on the web.
If you are coming from a web development background, then you might want to
learn a bit more about shaders first, for example from
[The Book of Shaders](https://thebookofshaders.com/). The simple code examples of this
documentation should be self-explanatory.


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
- [Configuring shading](#configuring-shading)
  - [Adding shader uniforms](#adding-shader-uniforms)
  - [Complex config example](#complex-config-example)
    - [Handling errors](#handling-errors)
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
    }
    #shader-web-background.fallback {
      display: none;
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
then go for this method. Just take the contents of

https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js

and put it as `<script>` in the `<head>` of your HTML file.

See also this example, you can use it as a template:

https://xemantic.github.io/shader-web-background/demo/minimal.html

See [minimal demo](https://xemantic.github.io/shader-web-background/demo/minimal.html) for reference. 


#### Option B - Reference the minified library

Add this code to the `<head>` of your HTML:

```html
<script src="https://xemantic.github.io/shader-web-background/dist/shader-web-background.min.js"></script>
```


#### Option C - Download distribution

In the future I will publish `shader-web-background` to npm. For now you can just
download the latest minified distribution together with source map.


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
  }
  #shader-web-background.fallback {
    display: none;
  }
</style>
```
The `.shader-web-background-fallback` CSS class is applied to HTML document root.

The `.fallback` CSS is applied to the canvas rendering the shader.
The default shader attached as the whole page background canvas will
have id `shader-web-background` therefore `#shader-web-background.fallback` CSS
selector will match it. 

:information_source: On some of the browser it is enough to provide a fallback
background for the canvas element. However fot the sake of compatibility it's
better to apply fallback style to the HTML document root, while hiding the created
canvas. It is also possible to alter the default error handler, see
[Handling errors](#handling-errors) section for details.

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

Most likely you want to pass more information to your shaders. For example if
you defined a uniform in the `image` shader:

```glsl
uniform float iTime;
```

then you also need to provide corresponding configuration:

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
be invoked before rendering each shader frame.

:information_source: Check documentation of the
[performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
which returns number of milliseconds since the page started. Dividing it by `1000` will
result in floating point value measured in seconds.

:warning: During development check the console often. If you will forget to configure
a uniform declared in the shader, then exception will be thrown (See
[error-no-configuration-of-shader-uniform](src/test/html/errors/error-no-configuration-of-shader-uniform.html)
test case). Also if you configure a uniform which does not exist in the shader, 
then a warning will pop up on console (see
[error-unnecessary-uniform-configured](src/test/html/errors/error-unnecessary-uniform-configured.html) 
test case).


### Complex config example

Here is a comprehensive example of a [configuration object](API.md#config) with
comments. It is using [Shadertoy] conventions for naming buffers and uniforms
but keep in mind that the naming is arbitrary and might be adjusted to the needs
of your project.

```javascript

// mouse coordinates taken from from the mousemove event
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
  // although it is called after first onResize
  onInit: (ctx) => {
    // so we can get access to actual dimensions and center the mouse
    // representation even before any "mousemove" event occurs
    mouseX = ctx.cssWidth / 2.
    mouseY = ctx.cssHeight / 2.
    ctx.iFrame = 0;
  },
  onResize: (width, height, ctx) => {
    // for convenience you can store your attributes on context
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
        // uniform value calculated in place, you can ommit ctx arg if not needed
        iTime: (gl, loc) => gl.uniform1f(loc, performance.now() / 1000),
        iFrame: (gl, loc) => gl.uniform1i(loc, ctx.iFrame),
        // uniform value taken from the context, see onResize above
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
        // initializing floating point texture in custom way for WebGL 1 and 2        
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
  onError: (canvas, error) => {
    canvas.remove();
    console.error(error);
    document.documentElement.classList.add("my-fallback");
  }
});
```

The API is intended to be self explanatory, in case of any 
doubts please check the next API chapter.



#### Handling errors

Several validations are being performed on supplied configuration to avoid common problems
which are usually hard to debug otherwise. The
[src/test/html/errors/](src/test/html/errors) folder contains all the error test cases.
These test cases can be also accessed directly on project GitHub page:

https://xemantic.github.io/shader-web-background/src/test/html/errors/


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

 * [dist/shader-web-background.min.js](dist/shader-web-background.min.js)
 * [dist/shader-web-background.min.js.map](dist/shader-web-background.min.js.map)


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
 * open [index.html](index.html) and scroll to `<section id="projects-using-shader-web-background">`
 * add your project to the list
 * create pull-request

Or send me a link with description.

## Tools and dependencies

* gradle as a build system
* WebGL for OpenGL based rendering
* Google Closure Compiler for verifying JavaScript and minimizing it
* highligh.js for presenting code in demo folder

## TODO

 * remove h1 on iphone as an alternative to real fullscreen
 * provide example with multiple canvases
 * parallax scrolling demo
 * implement fullscreen according to: https://developers.google.com/web/fundamentals/native-hardware/fullscreen
 * add support for DeviceOrientationEvent.alpha - heading

[Shadertoy]: https://www.shadertoy.com/
