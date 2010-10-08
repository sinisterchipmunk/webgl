var JSON3D = Class.create(Renderable, {
  initialize: function($super, object3d)
  {
    this.object3d = object3d;
    $super();
  },
  
  init: function(vertices, colors, textureCoords, normals, indices) {
    var i;
    for (i = 0; i < this.object3d.vertices.length; i++) vertices[i] = this.object3d.vertices[i];
    for (i = 0; i < this.object3d.textureCoords.length; i++) textureCoords[i] = this.object3d.textureCoords[i];
    for (i = 0; i < this.object3d.normals.length; i++) normals[i] = this.object3d.normals[i];
    for (i = 0; i < this.object3d.indices.length; i++) indices[i] = this.object3d.indices[i];
  }
});

JSON3D.load = function(filename, success) {
  new Ajax.Request(filename, {
    onSuccess: function(response) {
      success(new JSON3D(response.responseJSON));
    },
    evalJSON: true,
    method: 'get'
  });
};
