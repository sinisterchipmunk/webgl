var JSON3D = Class.create(Renderable, {
  initialize: function($super, object3d)
  {
    this.object3d = object3d;
    $super();
  },
  
  init: function(vertices, colors, textureCoords, normals, indices) {
    var i;

    for (i = 0; i < this.object3d.vertices.length; i++) vertices[i] = this.object3d.vertices[i];
    for (i = 0; i < this.object3d.indices.length; i++) indices[i] = this.object3d.indices[i];

    if (this.object3d.textureCoords)
      for (i = 0; i < this.object3d.normals.length; i++)
        normals[i] = this.object3d.normals[i];

    if (this.object3d.textureCoords)
      for (i = 0; i < this.object3d.textureCoords.length; i++)
        textureCoords[i] = this.object3d.textureCoords[i];
  }
});

JSON3D.load = function(filename, success) {
  new Ajax.Request(filename, {
    onSuccess: function(response) {
      logger.attempt("JSON3D.load-success", function() {
        if (response.responseJSON == null) throw new Error("Could not parse a JSON object from the response text:\n\n"+response.responseText);
        var json = response.responseJSON;
        for (var i in json)
          success(new JSON3D(json[i]));
      });
    },
    evalJSON: true,
    method: 'get'
  });
};
