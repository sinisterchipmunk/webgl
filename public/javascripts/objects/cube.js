var Cube = (function() {
  function buildSides(self, size) {
    var w, h, d;
    if (typeof(size) == "number") w = h = d = size;
    else { w = size[0]; h = size[1]; d = size[2]; }
    
    self.sides = {};

    self.sides.left = new Quad(d, h);
    self.sides.left.orientation.orient([-1,0,0], [0,1,0], [0,0,-1], [-w/2,0,0]);

    self.sides.right = new Quad(d, h);
    self.sides.right.orientation.orient([1,0,0], [0,1,0], [0,0,1], [w/2,0,0]);

    self.sides.front = new Quad(w, h);
    self.sides.front.orientation.orient([0,0,1], [0,1,0], [-1,0,0], [0,0,d/2]);

    self.sides.back = new Quad(w, h);
    self.sides.back.orientation.orient([0,0,-1], [0,1,0], [1,0,0], [0,0,-d/2]);

    self.sides.top = new Quad(w, d);
    self.sides.top.orientation.orient([0,1,0], [0,0,1], [1,0,0], [0,h/2,0]);

    self.sides.bottom = new Quad(w, d);
    self.sides.bottom.orientation.orient([0,-1,0], [0,0,-1], [1,0,0], [0,-h/2,0]);
  }
  
  return Class.create(Renderable, {
    getCorners: function() {
      var corners = [];
      for (var side in this.sides)
      {
        var verts = this.sides[side].getWorldSpaceVertices();
        for (var i = 0; i < verts.length; i++)
          corners.push(this.transformVertex(verts[i]));
      }
      return corners;
    },
    
    initialize: function($super, size, position)
    {
      if (!position) position = [0,0,0];
      
      $super();
      buildSides(this, size);
      this.orientation.setPosition(position);
    },
    
    draw: function(options)
    { // pass the buck!
      for (var side in this.sides)
        this.sides[side].render(options);  
    },

    update: null // what's there to update?
  });
})();
