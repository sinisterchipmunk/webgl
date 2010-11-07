var Point = Class.create(Renderable, {
  initialize: function($super, position) {
    var options;
    if (arguments.length == 4) position = [arguments[1], arguments[2], arguments[3]]; // arg[0] is $super
    if (position.position) { options = position; position = position.position; }
    
    $super();
    if (position) this.orientation.setPosition(position);
  },
  
  update: null,
  
  init: function(vertices) {
    this.draw_mode = GL_POINTS;
    vertices.push(0,0,0);
  }
});
