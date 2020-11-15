val closureCompilerVersion = "v20201102"

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
      "--language_in", "ECMASCRIPT6",
      "--language_out", "ECMASCRIPT6",
      "--output_wrapper", "const shaderWebBackground={};(()=>{%output%})()\n//# sourceMappingURL=shader-web-background.min.js.map",
      "--jscomp_warning=accessControls",
      "--jscomp_warning=checkRegExp",
      "--jscomp_warning=constantProperty",
      "--jscomp_warning=const",
      "--jscomp_warning=deprecatedAnnotations",
      "--jscomp_warning=deprecated",
      "--jscomp_warning=missingProperties",
      "--jscomp_warning=missingReturn",
      "--jscomp_warning=reportUnknownTypes",
      "--jscomp_warning=strictCheckTypes",
      "--jscomp_warning=typeInvalidation",
      "--jscomp_warning=undefinedNames",
      "--jscomp_warning=unusedLocalVariables",
      "--jscomp_warning=unusedPrivateMembers",
      "--jscomp_warning=visibility"
  )
  classpath = sourceSets["main"].runtimeClasspath

  val charset = Charsets.UTF_8
  val libOccurrence =
      "(?s)const shaderWebBackground.*shader-web-background\\.min\\.js\\.map"
          .toRegex()
  val lib = File("dist/shader-web-background.min.js")
      .readText(charset)
  fun transformHtml(html: String, lib: String) =
      html.replaceFirst(libOccurrence, lib)
  fun updateEmbeddedLib(path: String) = File(path).let { file ->
    file.writeText(transformHtml(file.readText(charset), lib), charset)
  }

  doLast {
    updateEmbeddedLib("index.html")
    updateEmbeddedLib("src/test/html/minimal-embedded.html")
  }

}
