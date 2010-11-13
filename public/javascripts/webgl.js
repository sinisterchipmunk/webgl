var mvMatrixStack = [];
var pMatrixStack = [];
var mvMatrix;
var pMatrix;
var currentlyPressedKeys = Object();

document.onkeydown = function(event) {
  currentlyPressedKeys[event.keyCode] = true;
};

document.onkeyup = function(event) {
  currentlyPressedKeys[event.keyCode] = false;
};

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

function setPMatrix(m) {
  pMatrix = m;
}

function perspective(fovy, aspect, znear, zfar) {
  pMatrix = makePerspective(fovy, aspect, znear, zfar);
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

function pPushMatrix(m) {
  if (!pMatrix) throw new Error("No projection matrix!");
  if (m) {
    pMatrixStack.push(m.dup());
    pMatrix = m.dup();
  }
  else
    pMatrixStack.push(pMatrix.dup());
}

function pPopMatrix() {
  if (pMatrixStack.length == 0)
    throw new Error("Invalid pPopMatrix!");
  pMatrix = pMatrixStack.pop();
  return pMatrix;
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw new Error("Invalid mvPopMatrix!");
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
