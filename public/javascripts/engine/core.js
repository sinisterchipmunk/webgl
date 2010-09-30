var FILL = 0;
var WIREFRAME = 1;
var RENDER_PICK = 2;

var MAX_VERTEX_ATTRIBS = null;
var after_initialize_callbacks = new Array();

var shaders = {};
var mouse = {};

function after_initialize(func) { after_initialize_callbacks.push(func); }

function initializationComplete() {
  useShader('color_without_texture');
  for (var i = 0; i < after_initialize_callbacks.length; i++) after_initialize_callbacks[i](gl);
}

after_initialize(function(gl) {
  MAX_VERTEX_ATTRIBS = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  checkGLError();
});

function disableAllAttributes() {
  for (var i = 0; i < MAX_VERTEX_ATTRIBS; i++)
    gl.disableVertexAttribArray(i);
  checkGLError();
}

function encodeToColor(number) {
  var g = (parseInt(number / 256));
  var r = (number % 256);
  // b and a are reserved
  
  // r and g together allow for 65536 indices
  // b is used as a key
  // if this isn't enough (!), perhaps (b / 16) could be used to allow 16*65536 indices.
  // a could cause problems with picking because it's done with readPixels() and so it can't be used here
  
  return [r, g, 255, 255];
}

function decodeFromColor(color) {
  var r = color[0], g = color[1];
  // b and a are reserved, see #encodeToColor
  
  var number = (g * 256) + r;
  return number;
}


try{
  Float32Array;
}catch(ex){
  Float32Array = WebGLFloatArray;
  Uint8Array = WebGLUnsignedByteArray;
}
//const TYPED_ARRAY_FLOAT = Float32Array;
//const TYPED_ARRAY_BYTE = Uint8Array;


/* Temporarily sets the shader, and resets it when finished.
   
   Ex:
    pushShader(function() { useShader(aNewShader); do some stuff });
    // activeShader == previous shader
    
    pushShader(aNewShader, function() { do some stuff });
    // activeShader == previous shader
*/
function pushShader(newShader, func)
{
  // "push"
  var oldShader = activeShader;
  if (typeof(newShader) == "function") { func = newShader; }
  else useShader(newShader);
  
  // callback
  func();
  
  // "pop"
  useShader(oldShader);
}
