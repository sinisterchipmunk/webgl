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
      return this.getWorldSpaceVertices();
    },
    
    initialize: function($super, size, position)
    {
      if (!position) position = [0,0,0];
      
      $super();
      buildSides(this, size);
      this.orientation.setPosition(position);
    },
    
    init: function(vertices, colors, texes, normals, indices)
    {
      // we need to get each quad's vertices, but then transform them by the object's
      // local transformation, which includes the position offset and direction.
      
      var self = this;
      for (var i in this.sides)
      {
        var qverts = [], qcolor = [], qtex = [];
        this.sides[i].init(qverts, qcolor, qtex, [], []);

        // unfortunately quads are rendered in triangle strips; we need to translate that
        // into triangles, because there's no support at this time for ending one triangle
        // strip and beginning another.
        function push(verti) {
          var i1 = verti*3, i2 = verti*3+1, i3 = verti*3+2;
          var vert = self.sides[i].transformVertex([qverts[i1], qverts[i2], qverts[i3]]);
          
          vertices.push(vert[0], vert[1], vert[2]);
          if (qcolor.length != 0) colors.push(qcolor[verti*4], qcolor[verti*4+1], qcolor[verti*4+2], qcolor[verti*4+3]);
          if (qtex.length   != 0) texes. push(-qtex [verti*2], qtex[verti*2+1]);//, qtex  [i3]);
          /* TODO normals and per-face textures */
        }
        push(0); push(1); push(2); // tri1
        push(1); push(2); push(3); // tri2
      }
    },
    
    update: null // what's there to update?
  });
})();
