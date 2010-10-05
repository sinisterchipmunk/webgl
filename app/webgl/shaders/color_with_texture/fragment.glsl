#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec4 vColor;
uniform sampler2D texture0;

void main(void) {
  vec4 texColor = texture2D(texture0, vec2(vTextureCoord.s, vTextureCoord.t));
  gl_FragColor = vColor * texColor;
}
