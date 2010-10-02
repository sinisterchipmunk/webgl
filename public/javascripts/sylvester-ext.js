Matrix.prototype.setLookAt = function(position, view, up, side) {
  // first load identity
  this.elements = Matrix.I(4).elements;

  for (var i = 0; i < 3; i++)
  {
    this.elements[0][i] =  side[i];
    this.elements[1][i] =    up[i];
    this.elements[2][i] = -view[i];
  }
  
  return this.setTranslateTo(position);
};

Matrix.prototype.setTranslateBy = function(position) {
  if (logger)
    logger.warn("Warning: I'm not convinced the implementation of Matrix#setTranslateBy is accurate. Trust, but verify.");
  for (var i = 0; i < 3; i++)
    this.elements[i][3] = -position[0] * this.elements[i][0] +
                          -position[1] * this.elements[i][1] +
                          -position[2] * this.elements[i][2];  
};

Matrix.prototype.setTranslateTo = function(position) {
  this.elements[0][3] = -position[0];
  this.elements[1][3] = -position[1];
  this.elements[2][3] = -position[2];
  
  return this;
};

Matrix.prototype.toQuarternion = function() {
  function _copysign(a, b)
  {
    var sign = b == 0 ? 1 : b / Math.abs(b);
    return a * sign;
  }
  
  function max(a, b) { return (a > b) ? a : b; }
  
  var m = this.elements;

  var qx, qy, qz, qw;
  qw = Math.sqrt( max( 0, 1 + m[0][0] + m[1][1] + m[2][2] ) ) / 2;
  qx = Math.sqrt( max( 0, 1 + m[0][0] - m[1][1] - m[2][2] ) ) / 2;
  qy = Math.sqrt( max( 0, 1 - m[0][0] + m[1][1] - m[2][2] ) ) / 2;
  qz = Math.sqrt( max( 0, 1 - m[0][0] - m[1][1] + m[2][2] ) ) / 2;

  qx = _copysign( qx, m[2][1] - m[1][2] );
  qy = _copysign( qy, m[0][2] - m[2][0] );
  qz = _copysign( qz, m[1][0] - m[0][1] );
  
  return [qx, qy, qz, qw];
};