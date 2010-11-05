var Sphere = Class.create(Renderable, {
  /* options is either a radius (which will default to 30 stacks and 30 slices), or
     an object with stacks, slices and a radius.
     
     stacks - the number of horizontal divisions, like lines of latitude.
     slices - the number of vertical divisions, like lines of longitude.
     radius - one half the distance from one side to the other of this sphere.
     
     In general, fewer stacks and slices means better improvement but lower image quality.
   */
  initialize: function($super, options) {
    if (typeof(options) == "number") options = { radius: options, stacks: 30, slices: 30 };
    this.radius = options.radius;
    this.stacks = options.stacks;
    this.slices = options.slices;
    $super();
    
    
    /* what's wrong with this?
    
    var default_options = { stacks: 30, slices: 30 };
    if (typeof(options) == "number") options = { radius:options };
    if (arguments.length > 1) options.position = arguments[1];
    
    this.radius = options.radius || default_options.radius;
    this.stacks = options.stacks || default_options.stacks;
    this.slices = options.slices || default_options.slices;
    $super();
    if (options.position) this.orientation.setPosition(options.position);
    
     */
  },
  
  init: function(vertices, colors, textureCoords, normals, indices) {
    var self = this;
    
    var slices = this.slices, stacks = this.stacks;
    var slice, stack;
    for (slice = 0; slice <= slices; slice++) {
      var theta = slice * Math.PI / slices;
      var sinth = Math.sin(theta);
      var costh = Math.cos(theta);
    
      for (stack = 0; stack <= stacks; stack++) {
        var phi = stack * 2 * Math.PI / stacks;
        var sinph = Math.sin(phi);
        var cosph = Math.cos(phi);
      
        var x = cosph * sinth;
        var y = costh;
        var z = sinph * sinth;
        var u = 1 - (stack / stacks);
        var v = 1 - (slice / slices);
      
        normals.push(x);
        normals.push(y);
        normals.push(z);
        textureCoords.push(u);
        textureCoords.push(v);
        vertices.push(self.radius * x);
        vertices.push(self.radius * y);
        vertices.push(self.radius * z);
        colors.push(1);
        colors.push(1);
        colors.push(1);
        colors.push(1);
      }
    }
  
    for (slice = 0; slice < slices; slice++) {
      for (stack = 0; stack < stacks; stack++) {
        var first = (slice * (stacks + 1)) + stack;
        var second = first + stacks + 1;
        indices.push(first);
        indices.push(second);
        indices.push(first+1);
        indices.push(second);
        indices.push(second+1);
        indices.push(first+1);
      }
    }
  }
});
