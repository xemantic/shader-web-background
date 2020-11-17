# shader-web-background
Displays GLSL fragment shaders as a website background. Supports webgl1 and 2, shadertoy shaders,
pixel feedback loops on offscreen floating point textures.

Project website: https://xemantic.github.io/shader-web-background

## Features

## Usage

### 1. Add library to your website

#### a) Embedded minified `shader-web-background` code to the source of your website

If you want your shaders to start rendering background before any other resources are loaded,
then go for this method. Just take the contents of
[dist/shader-web-background.min.js](dist/shader-web-background.min.js) file and put it as
`<script>` in the `<head>` of your HTML file.

See [src/test/html/minimal-embedded.html](src/test/html/minimal-embedded.html) for reference. 

#### b) Reference `shader-web-background` minified library

#### c) Reference `shader-web-background` sources 

### 2. 

### 3. Adding own uniforms

There is no standard support for mouse movement and it is by design.
Adding mouse tracking is relatively simple with own uniform setters. Check the `Custom Uniforms`
section below.

## Setting uniforms

### Default uniforms

In order to keep the code as minimal as possible, all the default uniforms are supplied as
single capital letters:

* `R` - Resolution
* `D` - MinDimension


### Custom uniforms

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

You should put the `<script>` in the `<head>` of your HTML document. The `id` attribute is required
but can have any value.

Also take a look at [src/test/html/shadertoy-default.html](src/test/html/shadertoy-default.html)


### What to do with Shadertoy "Common" tab?

There is no automated solution for that. You will have to copy the `Common` part of the shader
multiple times, possibly just above the other Shadertoy code.

### How can I handle "Multipass" Shadertoy shaders?

You can define multitude `<script>` tags in the head of your HTML document. They will
be processed in sequence. Each of them, except for the last one, will render to offscreen
frame buffer. Each `<script>` needs to have unique id, which will be used to wire them
together.

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
 
# TODO

 * add metadata, like open graph tags, to index.html
 * create project social media graphics
 * create project favicons
