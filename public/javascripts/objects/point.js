var Point = Class.create(Renderable, {
  initialize: function($super, position) {
    var options;
    if (arguments.length == 4) position = [arguments[1], arguments[2], arguments[3]]; // arg[0] is $super
    if (position.position) { options = position; position = position.position; }
    else options = { size: 0.1 };
    
    this.sphere = new Sphere(options.size);
    $super();
    if (position) this.orientation.setPosition(position);
  },
  
  update: null,
  
  draw: function(options) {
    this.sphere.render(options);
  }
});
