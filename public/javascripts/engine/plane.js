var Plane = Class.create({
  initialize: function(points) {
    if (arguments.length == 3) points = [arguments[0], arguments[1], arguments[2]];
    if (points) this.set(points);
  },
  
  set: function(points) {
    if (arguments.length == 3) points = [arguments[0], arguments[1], arguments[2]];
    this.normal = (points[1].minus(points[0])).cross(points[2].minus(points[0])).normalize();
    this.point = points[1];
    this.d = -(this.normal.innerProduct(this.point));
  },
  
  setCoefficients: function(a, b, c, d) {
    var len = Math.sqrt(a*a+b*b+c*c);
    this.normal[0] = a/len;
    this.normal[1] = b/len;
    this.normal[2] = c/len;
    this.d = d/len;
  },
  
  distance: function(point)
  {
    var x, y, z;
    if (arguments.length == 3) { x = arguments[0]; y = arguments[1]; z = arguments[2]; }
    else { x = point[0]; y = point[1]; z = point[2]; }
    // same as ax + by + cz + d
    return this.d + this.normal.innerProduct(x, y, z);
  },
  
  whereis: function(point)
  {
    if (arguments.length == 3) points = [arguments[0], arguments[1], arguments[2]];
    var d = this.distance(point);
    if (d > 0) return Plane.FRONT;
    if (d < 0) return Plane.BACK;
    return Plane.INTERSECT;
  }
});

Plane.FRONT     = 1;
Plane.BACK      = 2;
Plane.INTERSECT = 3;
