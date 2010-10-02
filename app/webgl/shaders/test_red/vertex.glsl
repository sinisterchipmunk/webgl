attribute vec3 aVertexPosition;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;

void main(void) {
  gl_Position = pMatrix * mvMatrix * vec4(aVertexPosition, 1.0);
}
