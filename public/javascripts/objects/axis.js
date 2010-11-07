var Axis = Class.create(Renderable, {
  initialize: function($super, camera, offset) {
    $super();
    this.scale = 1;
    if (camera) this.set(camera);
    if (offset) this.offset = offset;
  },
  
  set: function(camera) {
    this.camera = camera;
//    this.rebuildAll();
  },
  
  update: function()
  {
    if (this.camera)
    {
      var pos = this.camera.getPosition();
      var view = pos.plus(this.camera.getView().times(this.scale)),
                 right = pos.plus(this.camera.getRight().times(this.scale)),
                 up = pos.plus(this.camera.getUp().times(this.scale));
      var offset = this.offset || [0,0,0];
      
      var vertices = this.mesh.getVertexBuffer();
      for (var i = 0; i < 3; i++)
      {
        // origins
        vertices.js[0+i] = pos[i]  +offset[i];
        vertices.js[6+i] = pos[i]  +offset[i];
        vertices.js[12+i] = pos[i] +offset[i];
        
        vertices.js[3+i] = right[i]+offset[i]; // x
        vertices.js[9+i] = up[i]   +offset[i]; // y
        vertices.js[15+i]= view[i] +offset[i]; // z
      }
      vertices.refresh();
    }
  },
  
  init: function(vertices, colors, textureCoords) {
    this.draw_mode = GL_LINES;
    // x
    vertices.push(0,0, 0); colors.push(1,0,0,1);
    vertices.push(1,0, 0); colors.push(1,0,0,1);
    // y
    vertices.push(0,0, 0); colors.push(0,1,0,1);
    vertices.push(0,1, 0); colors.push(0,1,0,1);
    // z
    vertices.push(0,0, 0); colors.push(0,0,1,1);
    vertices.push(0,0,-1); colors.push(0,0,1,1);
  }
});
