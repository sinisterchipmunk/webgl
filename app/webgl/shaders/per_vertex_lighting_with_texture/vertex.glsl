attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;
uniform mat4 nMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;
uniform vec3 uPointLightLocation;
uniform vec3 uPointLightColor;

uniform bool uUseLighting;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
  vec4 mvPosition = mvMatrix * vec4(aVertexPosition, 1.0);
  gl_Position = pMatrix * mvPosition;
  
  vTextureCoord = aTextureCoord;

  if (!uUseLighting) {
    vLightWeighting = vec3(1.0, 1.0, 1.0);
  } else {
    vec3 pointLightDirection = normalize(uPointLightLocation - mvPosition.xyz);
    vec4 transformedNormal = nMatrix * vec4(aVertexNormal, 1.0);

    float directionalLightWeighting = max(dot(transformedNormal.xyz, uLightingDirection), 0.0);
    float pointLightWeighting       = max(dot(transformedNormal.xyz, pointLightDirection), 0.0);
    vLightWeighting = uAmbientColor + 
                      uDirectionalColor * directionalLightWeighting +
                      uPointLightColor  * pointLightWeighting;
  }
}
