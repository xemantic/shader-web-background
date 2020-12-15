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

package com.xemantic.web.shader.background

import com.google.javascript.jscomp.CommandLineRunner
import com.google.javascript.jscomp.CompilerOptions

fun main(vararg args: String) {

  class ShaderWebBackgroundCompiler : CommandLineRunner(args) {
    override fun createOptions(): CompilerOptions {
      val options = super.createOptions()
      options.lineLengthThreshold = 80
      return options
    }
  }

  val runner = ShaderWebBackgroundCompiler()
  if (runner.shouldRunCompiler()) {
    runner.run()
  }

  if (runner.hasErrors()) {
    System.exit(-1)
  }

}
