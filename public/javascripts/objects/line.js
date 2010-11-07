var Line = Class.create(Renderable, {
  initialize: function($super, pointA, pointB) {
    this.a = pointA;
    this.b = pointB;
    
    $super();
  },
  
  setStart: function(a) { this.set(a, this.b); },
  setEnd: function(b) { this.set(this.a, b); },
  set: function(pointA, pointB) {
    this.a = pointA;
    this.b = pointB;
    this.rebuildAll();
  },
  
  init: function(vertices, colors, textureCoords) {
    this.draw_mode = GL_LINES;
    var a = this.a, b = this.b;
    if (a.elements) a = a.elements;
    if (b.elements) b = b.elements;

    vertices.push(a[0], a[1], a[2]);
    vertices.push(b[0], b[1], b[2]);
    
    colors.push(1,0,0,1);
    colors.push(0,1,0,0);
      
    textureCoords.push(0, 0);
    textureCoords.push(1, 1);
  }
});
