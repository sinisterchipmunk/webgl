var Quad = Class.create(Renderable, {
  initialize: function($super, width, height) {
    var self = this;
    $super(
      // init
      function(vertices, colors, textureCoords) {
        self.DRAW_MODE = GL_TRIANGLE_STRIP;

        vertices.push(-width/2, -height/2, 0);
        vertices.push(-width/2,  height/2, 0);
        vertices.push( width/2, -height/2, 0);
        vertices.push( width/2,  height/2, 0);
      
        textureCoords.push(0, 0);
        textureCoords.push(0, 1);
        textureCoords.push(1, 0);
        textureCoords.push(1, 1);
      }
    );
  }
});
