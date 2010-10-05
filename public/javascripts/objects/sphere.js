var Sphere = Class.create(Renderable, {
  initialize: function($super, radius) {
    this.radius = radius;
    $super();
  },
  
  init: function(vertices, colors, textureCoords, normals, indices) {
    var self = this;
    
    var slices = 30, stacks = 30;
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
