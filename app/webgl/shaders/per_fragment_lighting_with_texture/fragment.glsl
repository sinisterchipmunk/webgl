#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec4 vTransformedNormal;
varying vec4 vPosition;

uniform bool uUseLighting;
uniform bool uUseTextures;

uniform vec3 uAmbientColor;

uniform vec3 uPointLightLocation;
uniform vec3 uPointLightColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

uniform sampler2D uSampler;

void main(void) {
  vec3 lightWeighting;
  if (!uUseLighting) {
    lightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    vec3 lightDirection = normalize(uPointLightLocation - vPosition.xyz);
    //vec4 transformedNormal = nMatrix * vec4(aVertexNormal, 1.0);

    float directionalLightWeighting = max(dot(vTransformedNormal.xyz, uLightingDirection), 0.0);
    float pointLightWeighting = max(dot(normalize(vTransformedNormal.xyz), lightDirection), 0.0);
    lightWeighting = uAmbientColor +
                     uDirectionalColor * directionalLightWeighting +
                     uPointLightColor * pointLightWeighting;
  }

  vec4 fragmentColor;
  // useTextures is not yet implemented
  //if (uUseTextures) {
    fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
  //} else {
  //  fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
  //}
  gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);
}
