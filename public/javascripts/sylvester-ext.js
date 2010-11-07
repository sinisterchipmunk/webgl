/*
  sets the matrix to look according to the given vectors. If callback is given,
  it will be called only if the set values are different from the current ones.
  Callbacks are fired after the matrix is updated, not before.
 */
Matrix.prototype.setLookAt = function(position, view, up, side, callback) {
  view = view.normalize();
  side = view.cross(up).normalize();
  up   = side.cross(view).normalize();
  
  var changed = false;
  var e = this.elements;
  
  function check_set(row, col, newval) {
    if (e[row][col] != newval) { changed = true; e[row][col] = newval; }
  }
  
  check_set(0, 0,  side[0]);
  check_set(1, 0,    up[0]);
  check_set(2, 0, -view[0]);
  check_set(3, 0,       0 );

  check_set(0, 1,  side[1]);
  check_set(1, 1,    up[1]);
  check_set(2, 1, -view[1]);
  check_set(3, 1,       0 );

  check_set(0, 2,  side[2]);
  check_set(1, 2,    up[2]);
  check_set(2, 2, -view[2]);
  check_set(3, 2,       0 );

  check_set(0, 3,  -(side.dot(position)));
  check_set(1, 3,  -(  up.dot(position)));
  check_set(2, 3,   (view.dot(position)));
  check_set(3, 3,      1.0);
  
  if (changed) callback();
};

Matrix.prototype.setTranslateTo = function(position, callback) {
  /* TODO dry this up */
  var changed = false;
  var e = this.elements;
  
  function check_set(row, col, newval) {
    if (e[row][col] != newval) { changed = true; e[row][col] = newval; }
  }

  for (var i = 0; i < 3; i++)
    check_set(i, 3, -position[0] * this.elements[i][0] +
                    -position[1] * this.elements[i][1] +
                    -position[2] * this.elements[i][2]);
  
  if (changed && callback) callback();
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