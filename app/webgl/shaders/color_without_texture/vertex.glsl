attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;

varying vec4 vColor;

void main(void) {
  gl_Position = pMatrix * mvMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}
