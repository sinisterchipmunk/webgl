var mvMatrixStack = [];
var mvMatrix;
var pMatrix;
var gl;
var currentlyPressedKeys = Object();
var activeShaderName = null;
var activeShader = null;

function initGL(canvas) {
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.canvas = canvas;
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
  checkGLError();
}

function checkGLError()
{
  var error = gl.getError();
  if (error != gl.NO_ERROR)
  {
    var str = "GL error: "+error;
    var err = new Error(str);
    var stack = err.stack.split("\n");
    stack.shift();
    alert(err+"\n\n"+stack.join("\n"));
    throw err;
  }
}

function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v, a, b) {
  if (typeof(v) == "number") v = [v, a, b];
  var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}

function setMatrix(m) {
  mvMatrix = m;
}

function perspective(fovy, aspect, znear, zfar) {
  pMatrix = makePerspective(fovy, aspect, znear, zfar);
}

function setMatrixUniforms() {
  if (!activeShader) useShader(activeShaderName);

  //if (activeShader.pMatrixUniform)
  {
    gl.uniformMatrix4fv(activeShader.pMatrixUniform, false, new Float32Array(pMatrix.flatten()));
    checkGLError();
  }

  //if (activeShader.mvMatrixUniform)
  {
    gl.uniformMatrix4fv(activeShader.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));
    checkGLError();
  }
}

function useShader(name) {
  if (name.getCompiledProgram) name = name.getCompiledProgram();
  if ((name != activeShaderName && name != activeShader) || !activeShader)
  {
    checkGLError();
    disableShaderAttribs();
    if (typeof(name) == "string")
    {
      if (shaders[name] == null) throw new Error("Shader named '"+name+"' was not found");
      activeShaderName = name;
      activeShader = shaders[name];
      gl.useProgram(activeShader);
      checkGLError();
    }
    else
    {
      activeShaderName = null;
      activeShader = name;
      gl.useProgram(name);
      checkGLError();
    }
    
    enableShaderAttribs();
  }
  return activeShader;
}

function enableShaderAttribs()
{
  if (activeShader && activeShader.attributes)
    for (var i = 0; i < activeShader.attributes.length; i++)
      gl.enableVertexAttribArray(activeShader[activeShader.attributes[i]]);
  checkGLError();
}

function disableShaderAttribs()
{
  disableAllAttributes();
}

function mvPushMatrix(m) {
  if (!mvMatrix) loadIdentity();
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw new Error("Invalid popMatrix!");
  }
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(ang, v, a, b) {
  if (typeof(v) == "number")
    v = [v, a, b];
  var arad = ang * Math.PI / 180.0;
  var m = Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}
