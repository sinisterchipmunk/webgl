Math.EPSILON = Math.EPSILON || 0.000000001;

function checkNaN(vec)
{
  for (var i = 0; i < vec.length; i++)
    if (isNaN(vec[i])) { throw new Error("Index "+i+"<"+vec[i]+"> is NaN in <"+vec+"> (from "+new Error().stack+")!"); }
}

Array.prototype._vectorize = function(other, y, z, w) {
  var result = [], i;
  if (typeof(other) == 'number') {
    if (!y) { other = [other]; }
    else if (!z) { other = [other, y]; }
    else if (!w) { other = [other, y, z]; }
    else { other = [other, y, z, w]; }
  }
  
  if (other.length == 1)
    for (i = 0; i < this.length; i++) result[i] = other[0];
  else if (other.length == this.length)
    for (i = 0; i < this.length; i++) result[i] = other[i];
  else throw new Error("Argument must be a scalar value or a vector of equal dimensions; received "+other.toSource()+" for "+this.toSource());

  return result;
};

Array.prototype.innerProduct = function(other) {
  return (this[0]*other[0] + this[1]*other[1] + this[2]*other[2]);
};

Array.prototype.equals = function(other) {
  if (!other) return false;
  if (other.length != this.length) return false;
  for (var i = 0; i < this.length; i++)
    if (isNaN(this[i]) && !isNaN(other[i])) return false;
    else if (!isNaN(this[i]) && isNaN(other[i])) return false;
    else if (Math.abs(this[i] - other[i]) > Math.EPSILON) return false;
  return true;
};

/* returns a normalized copy of this vector */
Array.prototype.normalize = function() {
  var mag = this.magnitude();
  var x = this[0], y = this[1], z = this[2], a = this[3];
  var result = [];

  if (mag == 0)
  {
    for (var i = 0; i < this.length; i++) result[i] = 0;
    return result;
  }
  
  switch(this.length) {
    case 1: result = [x/mag]; break;
    case 2: result = [x/mag,y/mag]; break;
    case 3: result = [x/mag,y/mag,z/mag]; break;
    case 4: result = [x/mag,y/mag,z/mag,a/mag]; break;
    default: throw new Error("more than 4 dimensions is not supported");
  }
  checkNaN(result);
  return result;
};

/* returns the magnitude of this vector */
Array.prototype.magnitude = function() {
  var x = this[0], y = this[1], z = this[2], a = this[3];
  
  switch(this.length) {
    case 1: return Math.abs(x);
    case 2: return Math.sqrt(x*x+y*y);
    case 3: return Math.sqrt(x*x+y*y+z*z);
    case 4: return Math.sqrt(x*x+y*y+z*z+a*a);
  }
  throw new Error("more than 4 dimensions is not supported");
};

/* returns the cross product between the two vectors. Must be 3-dimensional. */
Array.prototype.cross = function(vec, vy, vz) {
  var x = this[0], y = this[1], z = this[2];
  var vx;
  
  if (typeof(vec) == "object") { vx = vec[0]; vy = vec[1]; vz = vec[2]; }
  else { vx = vec; }
  
  if (this.equals(vec)) throw new Error("Vector <"+this+"> is equal to <"+vec+">; can't compute cross product");
  
  var result = [y*vz - z*vy, z*vx - x*vz, x*vy - y*vx];
  checkNaN(result);
  return result;
};

/* Returns true if the two vectors are orthogonal. */
Array.prototype.isOrthogonalWith = function(other, y, z) {
  return (this.dot(other, y, z) == 0);
};

/* Returns a copy of this vector projected onto the specified one */
Array.prototype.projectOnto = function(other, y, z) {
  other = this._vectorize(other, y, z);
  
  var normal = other.normalize();
  return normal.multiply(this.dot(normal));
};

/* Returns the angle between this vector and another */
Array.prototype.angle = function(other, y, z, w) {
  return Math.acos(this.dot(other, y, z, w));
};

/* Returns the distance between this vector and another */
Array.prototype.distance = function(other, y, z, w) {
  other = this._vectorize(other, y, z, w);
  var result = 0;
  for (var i = 0; i < other.length; i++) {
    var x = other[i]-this[i];
    result += x*x; 
  }
  
  return Math.sqrt(result);
};

/* Scales this vector by the specified scalar or vector amount */
Array.prototype.scale = function(other, y, z, w)
{
  other = this._vectorize(other, y, z, w);
  var result = [];
  for (var i = 0; i < other.length; i++) result[i] = this[i] * other[i];
  return result;
};

Array.prototype.dot = function(other, y, z, w)
{
  other = this._vectorize(other, y, z, w);
  var result = 0;
  for (var i = 0; i < this.length; i++) result += this[i] * other[i];
  checkNaN(result);
  return result;
};

Array.prototype.isNormal = function(other, y, z, w)
{
  return (this.magnitude() - 1 < Math.EPSILON);
};

/* If javascript supported operator overloading, this would be a unary '-' operator. Positive values are made negative
   and vice versa. */
Array.prototype.invert = function()
{
  var result = [];
  for (var i = 0; i < this.length; i++) result[i] = -this[i];
  return result;
};

/* Returns a copy of this vector multiplied with the specified scalar or vector value */
Array.prototype.multiply = function(other, y, z, w) {
  var result = [];
  other = this._vectorize(other, y, z, w);
  for (var i = 0; i < this.length; i++) result[i] = this[i] * other[i];
  return result;
};

/* Returns a copy of this vector added to the specified scalar or vector value */
Array.prototype.add = function(other, y, z, w) {
  var result = [];
  other = this._vectorize(other, y, z, w);
  for (var i = 0; i < this.length; i++) result[i] = this[i] + other[i];
  return result;
};

/* Returns a copy of this vector added to the specified scalar or vector value */
Array.prototype.subtract = function(other, y, z, w) {
  var result = [];
  other = this._vectorize(other, y, z, w);
  for (var i = 0; i < this.length; i++) result[i] = this[i] - other[i];
  return result;
};

/* Returns a copy of this vector divided by the specified scalar or vector value */
Array.prototype.divide = function(other, y, z, w) {
  var result = [];
  other = this._vectorize(other, y, z, w);
  for (var i = 0; i < this.length; i++) result[i] = this[i] / other[i];
  checkNaN(result);
  return result;
};

/* Rotates this vector by the specified amount around the axis of the specified vector.
   For instance, to rotate a view vector upward ("look up"), you'd rotate along the vector
   perpendicular to the view and up vectors:
   
     view.rotate(angle, view.cross(up));
   
   This perpendicular vector is also known as the "right" vector because it is at a right
   angle to the forward (view) and up vectors. If no other transformations have been made,
   the right vector points along the positive X axis. Reversing the arguments and calling
   
     view.rotate(angle, up.cross(view));
     
   points the resultant vector in the opposite direction (left, or along the negative X axis)
   and so effectively rotates in the opposite direction. Also, a negative angle would have
   the same effect.
   
   Returns a new vector representing the rotation. The rotation is not applied to this vector,
   but is rather applied to the return value.
 */
Array.prototype.rotate = function(angle, other, y, z)
{
  if (!angle) { throw new Error("Angle is required in #rotate\n\n"+(new Error().stack)); }
  if (this.length != 3) { throw new Error("Vector must be 3-dimensional"); }
  other = this._vectorize(other, y, z);
  
  // Calculate the sine and cosine of the angle once
  var costheta = Math.cos(angle);
  var sintheta = Math.sin(angle);
  var rx, ry, rz;
  var x = other[0];
  y = other[1];
  z = other[2];

  // Find the new x position of the rotated vector
  rx = (costheta + (1 - costheta) * x * x)     * this[0] +
       ((1 - costheta) * x * y - z * sintheta) * this[1] +
       ((1 - costheta) * x * z + y * sintheta) * this[2];

  // Find the new y position for the new rotated point
  ry = ((1 - costheta) * x * y + z * sintheta) * this[0] +
       (costheta + (1 - costheta) * y * y)     * this[1] +
       ((1 - costheta) * y * z - x * sintheta) * this[2];

  // Find the new z position for the new rotated point
  rz = ((1 - costheta) * x * z - y * sintheta) * this[0] +
       ((1 - costheta) * y * z + x * sintheta) * this[1] +
       (costheta + (1 - costheta) * z * z)     * this[2];

  result = [rx,ry,rz];
  checkNaN(result);
  return result;
};

/* Aliases */
Array.prototype.modulus = Array.prototype.magnitude;
Array.prototype.negate = Array.prototype.invert;
Array.prototype.distanceFrom = Array.prototype.distance;
Array.prototype.sum = Array.prototype.plus = Array.prototype.add;
Array.prototype.difference = Array.prototype.minus = Array.prototype.subtract;
Array.prototype.times = Array.prototype.multiply;
Array.prototype.dividedBy = Array.prototype.divide;
