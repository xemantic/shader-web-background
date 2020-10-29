val closureCompilerVersion = "v20201006"

plugins {
  java
}

dependencies {
  runtimeOnly("com.google.javascript:closure-compiler:$closureCompilerVersion")
}

repositories {
  jcenter()
}

task("compileJs", JavaExec::class) {
  group = "js"
  main = "com.google.javascript.jscomp.CommandLineRunner"
  args = listOf(
      "--compilation_level", "ADVANCED",
      "--js", "src/main/js/*.js",
      "--js_output_file", "dist/shader-web-background.min.js",
      "--create_source_map", "dist/shader-web-background.min.js.map",
      "--output_wrapper", "const shaderWebBackground={};(function(){%output%})()\n//# sourceMappingURL=shader-web-background.min.js.map"
  )
  classpath = sourceSets["main"].runtimeClasspath
}
