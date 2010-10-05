attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 texture0coords;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;
uniform mat4 nMatrix;

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

void main(void) {
  vPosition = mvMatrix * vec4(aVertexPosition, 1.0);
  gl_Position = pMatrix * vPosition;
  vTextureCoord = texture0coords;
  vTransformedNormal = nMatrix * vec4(aVertexNormal, 1.0);
}
