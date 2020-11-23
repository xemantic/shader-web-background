/*
 * Copyright 2020  Kazimierz Pogoda
 *
 * This file is part of shader-web-background.
 *
 * shader-web-background is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * shader-web-background is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with shader-web-background.  If not, see <https://www.gnu.org/licenses/>.
 */

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
      "--source_map_location_mapping", "src/main/js|../src/main/js",
      "--language_in", "ECMASCRIPT6",
      "--language_out", "ECMASCRIPT6",
      "--output_wrapper",
      "// -- https://xemantic.github.io/shader-web-background/\n"
          + "const shaderWebBackground={};(()=>{%output%})()\n"
          + "//# sourceMappingURL=shader-web-background.min.js.map",
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
      "(?s)// -- https://xemantic\\.github\\.io/shader-web-background/.*shader-web-background\\.min\\.js\\.map\n"
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
