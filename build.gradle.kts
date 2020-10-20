plugins {
  java
}

dependencies {
  runtimeOnly("com.google.javascript:closure-compiler:v20201006")
}

repositories {
  jcenter()
}

task("minify", JavaExec::class) {
  group = "minify"
  main = "com.google.javascript.jscomp.CommandLineRunner"
  args = listOf(
      "--compilation_level", "ADVANCED",
      "--js", "shader-web-background.js",
      "--js_output_file", "shader-web-background.min.js"
  )
  classpath = sourceSets["main"].runtimeClasspath
}
