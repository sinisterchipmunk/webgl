after_initialize(function() {
  var shader = new Shader();
  shader.fragment.source = "#ifdef GL_ES\n" +
                           "precision highp float;\n" +
                           "#endif\n" +
                           
                           "void main(void) {\n" +
                           "  gl_FragColor = vec4(1,0,0,1);\n" +
                           "}";
  shader.vertex.source = "attribute vec3 aVertexPosition;\n" +
                          
                         "uniform mat4 matrixMV;\n" +
                         "uniform mat4 matrixP;\n" +
                          
                         "void main(void) {\n" +
                         "  gl_Position = matrixP * matrixMV * vec4(aVertexPosition, 1.0);\n" +
                         "}";
  shader.uniform('matrixMV');
  shader.uniform('matrixP');
  
  var matr = new Matrix.I(4);
  shader.setMatrixMV('uniformMatrix4fv', function() { return matr.flatten(); });

  assert_defined(shader.setMatrixMV);
  assert_defined(shader.getMatrixMV);
  assert_defined(shader.setMatrixP);
  assert_defined(shader.getMatrixP);
  assert_equal([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], shader.getMatrixMV());
  
  // test matrix changes
  matr.elements[0][0] = 0;
  assert_equal([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], shader.getMatrixMV());
  
  // test delete program
  shader.dispose();
  assert_false(shader.isCompiled());
  
  // test recompile program after delete
  shader.getCompiledProgram();
  assert(shader.isCompiled());
  
  // test attributes
  shader.setAttribute('aVertexPosition', function() { return [1,1,1]; });
  assert_equal([1,1,1], shader.getAttribute('aVertexPosition'));
});
