# shader-web-background
Displays GLSL fragment shaders as a website background. Supports WebGL 1 and 2, Shadertoy shaders,
pixel feedback loops on offscreen floating point textures.

Project website (demo): https://xemantic.github.io/shader-web-background

## Features

## How to use it in your projects?

Follow these steps:

### 1. Add library to your website

There are several ways to do it.

#### a) Embedded minified library code to the source of your website

If you want your shaders to start rendering before any other resources are loaded,
then go for this method. Just take the contents of
[dist/shader-web-background.min.js](dist/shader-web-background.min.js) file and put it as
`<script>` in the `<head>` of your HTML file.

See [src/test/html/minimal-embedded.html](src/test/html/minimal-embedded.html) for reference. 

#### b) Reference the minified library

#### c) Reference the sources directly

#### d) Copy the library into your project

Just copy the contents of [dist/](dist) folder to your project and add
this fragment in the `<head>` of your HTML.

```
<script src=""/>
</script>
```

### 2. Add your fragment shaders

You will need at least one fragment shader defined like this:

```
<script type="x-shader/x-fragment" id="image">
  #ifdef GL_ES
  precision highp float;
  #endif

  void main() {
    // ...
  }
</script>
``` 

Put it in the `<head>` of your HTML. The the `type` should be `x-shader/x-fragment`.
The `id` attribute is arbitrary, 
 
Note: Remember to give unique `id` to each of your shaders if you are
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

Note: if you will forget to declare a uniform, or make a type, then specific exception
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
  onFrameComplete: () => {},       // the function called on completing the frame
  shaders: {
    shader1 {
      uniforms: {
        uniform1: (gl, loc, ctx) => {},
        // ...
        uniformN: (gl, loc, ctx) => {}
      }
    }
    // ...
    shaderN {
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

#### shaders

Many shaders can be defined by name under `shaders` config attribute. All together they
will establish rendering pipeline processed in sequence. The last of defined shaders will
render to screen.   

The `onFrameComplete` function is invoked when scheduling of the rendering of the whole
animation frame is finished. It can be used to increment frame counters, etc. 
  

#### Configuration errors

Several validations are being performed on supplied configuration
to avoid common problems which are usually hard to debug otherwise.
The library checks if

* shaders are defined at all
* shader `<script>` elements have unique `id` attributes
* shaders specified in configuration have names matching these defined `id`s
* shaders compile


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
    #ifdef GL_ES
    precision highp float;
    #endif
    
    uniform vec2 R;
    uniform float T;
    uniform int F;
    
    #define iResolution R
    #define iTime T
    #define iFrame T
    
    
    // -- Paste your Shadertoy code here:
    // ...
    // -- End of Shadertoy code
    
    
    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
</script>
```

You should put the `<script type="x-shader/x-fragment" id="...">` in the `<head>` of your HTML
document. The `id` attribute is required but can have any value.

Also take a look at [src/test/html/shadertoy-default.html](src/test/html/shadertoy-default.html)


### What to do with Shadertoy "Common" tab?

There is no automated solution for that. You will have to copy the `Common` part of the shader
multiple times, possibly just above the other Shadertoy code.


### How can I handle "Multipass" Shadertoy shaders?

You can define multitude `<script type="x-shader/x-fragment" id="...">` tags in the head of your HTML document. They will
be processed in sequence. Each of them, except for the last one, will render to offscreen
frame buffer. Each of these shader **script** elements needs to have
a unique id attribute, which will be used to wire them together.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Multipass Shadertoy shader</title>
  <script type="x-shader/x-fragment" id="BufferA">
    #ifdef GL_ES
    precision highp float;
    #endif
    
    uniform sampler2D iChannel0;

    // ... the code of BufferA tab with the uniforms and wrapping as above
  </script>
  <script type="x-shader/x-fragment" id="Image">
    #ifdef GL_ES
    precision highp float;
    #endif
    
    uniform sampler2D iChannel0;

    // ... the code of BufferA tab with the uniforms and wrapping as above
  </script>
  <script>
    // ... your prefer method of loading shader-web-background as described above
  </script>
  <script>
    shaderWebBackground.shadeOnLoad({
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
Shadertoy tabs. They must match the names of properties defined in the parent `shaders` property
of the configuration object which is supplied to `shaderWebBackground.shadeOnLoad`.

Shadertoy is binding textures under
`iChannel`*n* uniforms. In the example above additional specified `uniform sampler2D iChannel0`
code needs texture uniform binding. The `ctx.texture(loc, texture)` will do the trick.
In case of creating feedback-loop shader, to avoid reading and writing to the same texture,
we have to differentiate between `in` texture and `out` texture associated with each offscreen
buffer. Each 

Usually you want to define the texture uniform 

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
 
## TODO

 * fix iOS retina resolution uniforms, like it is done in glslCanvas
 * add metadata, like open graph tags, to index.html
 * create project social media graphics
 * create project favicons
