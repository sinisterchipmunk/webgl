/*
  Code adapted from:
    http://www.crownandcutlass.com/features/technicaldetails/frustum.html
 */
var Frustum = (function() {
  var RIGHT = 0, LEFT = 1, BOTTOM = 2, TOP = 3, FAR = 4, NEAR = 5;
  var OUTSIDE = 0, INTERSECT = 1, INSIDE = 2;
  
  function extractFrustum(self)
  {
    
    
    
//    var clip = pMatrix.multiply(mvMatrix).flatten();
//    var t;
//    
//    function plane(side, a, b, c, d)
//    {
//      t = Math.sqrt(a*a+b*b+c*c);
//      self.planes[side] = self.planes[side] || {};
//      self.planes[side][0] = a / t;
//      self.planes[side][1] = b / t;
//      self.planes[side][2] = c / t;
//      self.planes[side][3] = d / t;
//    }
//    
//    plane(RIGHT,  clip[ 3]-clip[ 0], clip[ 7]-clip[ 4], clip[11]-clip[ 8], clip[15]-clip[12]);
//    plane(LEFT,   clip[ 3]+clip[ 0], clip[ 7]+clip[ 4], clip[11]+clip[ 8], clip[15]+clip[12]);
//    plane(BOTTOM, clip[ 3]+clip[ 1], clip[ 7]+clip[ 5], clip[11]+clip[ 9], clip[15]+clip[13]);
//    plane(TOP,    clip[ 3]-clip[ 1], clip[ 7]-clip[ 5], clip[11]-clip[ 9], clip[15]-clip[13]);
//    plane(FAR,    clip[ 3]-clip[ 2], clip[ 7]-clip[ 6], clip[11]-clip[10], clip[15]-clip[14]);
//    plane(NEAR,   clip[ 3]+clip[ 2], clip[ 7]+clip[ 6], clip[11]+clip[10], clip[15]+clip[14]);
//    
//    if (!self.a) {
//      logger.info(self.planes.toSource());
//      self.a = 1;
//    }
  }
  
  return Class.create({
    initialize: function(modelview, projection) {
      this.planes = [];
      this.setMatrices(modelview, projection);
      var self = this;
      setInterval(function() { if (self.mv && self.p) extractFrustum(self); }, 15);
    },
    
    update: function() { },//if (this.mv && this.p) extractFrustum(this); },
    setModelviewMatrix: function(mv) { this.setMatrices(mv, this.p); },
    setProjectionMatrix: function(p) { this.setMatrices(this.mv, p); },
    
    setMatrices: function(mv, p) {
      this.mv = mv;
      this.p  = p;
      this.update();
    },
    
    point: function(point) {
      if (!this.mv || !this.p) { logger.info("no matrix"); return true; }
      var frustum = this.planes;
//      if (!frustum[0]) 
        extractFrustum(this);
      
      var p;

      for( p = 0; p < 6; p++ )
        if(frustum[p].distance(point) <= 0 )
           return false;
      return true;
      
//      if (arguments.length == 3) point = arguments;
//      for (var p in this.planes)
//      {
//        if (!this.xa)
//        {
//          logger.info(this.planes.toSource());
//          logger.info(point.toSource());
//          this.xa = 1;
//        }
////        logger.info(p);
//        if (distance(this.planes[p], point) <= 0)
//          return false;
//      }
//      return true;
    },
    
    sphere: function(center, radius)
    {
      if (!this.mv || !this.p) return INSIDE;
      if (arguments.length == 4) { radius = arguments.pop(); center = arguments; }
      var p, d, result = INSIDE;
      for (p in this.planes)
      {
        d = distance(this.planes[p], center);
        if (d <= -radius) return OUTSIDE;
        if (d <= radius) result = INTERSECT;
      }
      return result;
    },
    
    cube: function(corners) {
      if (!this.mv || !this.p) return INSIDE;
      if (arguments.length > 1) corners = arguments;
      var p, c, c2 = 0, i, num_corners = corners.length, plane;
      for (p in this.planes)
      {
        plane = this.planes[p];
        c = 0;
        for (i = 0; i < num_corners; i++)
          if (distance(plane, corners[i]) > 0)
            c++;
        if (c == 0) return OUTSIDE;
        if (c == num_corners) c2++;
      }
      
      return (c2 == 6) ? INSIDE : INTERSECT;
    }
  });
})();
