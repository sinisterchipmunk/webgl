function World(context)
{
  var self = this;
  self.objects = {};
  self.camera = new Camera();
  self.context = context;
  self.frame_count = 0;
  self.particle_systems = new ParticleManager();
  
  /* buffers for picking */
  after_initialize(function() {
    self.framePickBuffer = self.context.createFramebuffer();
    self.renderPickBuffer = self.context.createRenderbuffer();
    self.pickTexture = self.context.createTexture();
    self.context.bindTexture(GL_TEXTURE_2D, self.pickTexture);

    //TODO update when null is accepted
    try {
      self.context.texImage2D(GL_TEXTURE_2D, 0, GL_RGB, self.context.gl.viewportWidth, self.context.gl.viewportHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, null);
    } catch (e) {
      var tex = new Uint8Array(3);
      self.context.texImage2D(GL_TEXTURE_2D, 0, GL_RGB, self.context.gl.viewportWidth, self.context.gl.viewportHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, tex);
    }
    
    self.context.bindFramebuffer(GL_FRAMEBUFFER, self.framePickBuffer);
    self.context.bindRenderbuffer(GL_RENDERBUFFER, self.renderPickBuffer);
    self.context.renderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, self.context.gl.viewportWidth, self.context.gl.viewportHeight);
    self.context.bindRenderbuffer(GL_RENDERBUFFER, null);
    
    self.context.framebufferTexture2D(GL_FRAMEBUFFER, self.context.gl.COLOR_ATTACHMENT0, GL_TEXTURE_2D, self.pickTexture, 0);
    self.context.framebufferRenderbuffer(GL_FRAMEBUFFER, self.context.gl.DEPTH_ATTACHMENT, GL_RENDERBUFFER, self.renderPickBuffer);
    self.context.bindFramebuffer(GL_FRAMEBUFFER, null);
  });
}

World.prototype = {
  // Converts screen coordinates into a ray segment with one point at the NEAR plane and the other
  // at the FAR plane relative to the camera's current matrices.
  unproject: function(x, y, z) { return this.camera.unproject(this.context, x, y, z); },
  
  render: function(mode) {
    mvPushMatrix();
      if (mode != RENDER_PICK) {
        this.frame_count++;
        var time = new Date();
        if (!this.render_time) this.render_time = time;
        if (this.render_time <= (time - 1000))
        {
          this.framerate = this.frame_count;
          this.render_time = time;
          this.frame_count = 0;
        }
      }
      
      this.camera.look(this.context.gl);
      if (mode != RENDER_PICK)
      {
        if (this.scene)
          this.scene.render({context:this.context, mode:mode});
        this.particle_systems.render({context:this.context, mode:mode});
      }
      this.renderObjects(mode);
    mvPopMatrix();
  },
  
  each_object: function(func) {
    for (var i in this.objects)
      func(this.objects[i]);
  },
  
  renderObjects: function(mode) {
    for (var i in this.objects)
      if (this.objects[i])
        this.objects[i].render({context:this.context, mode:mode});
  },
  
  addObject: function(object) {
    var self = this;
    object.orientation.callbacks.position_changed = function(newPosition, oldPosition) {
      if (self.scene) self.scene.updateObjectPosition(self, object, newPosition, oldPosition);
    };
    this.objects[object.object_id] = object;
    // finally, explicitly fire the callback to ensure the object is in the right place
    var position = object.orientation.getPosition();
    object.orientation.callbacks.position_changed(position, position);
  },
  
  removeObject: function(object) {
    object.orientation.callbacks.position_changed = null;
    this.objects[object.object_id] = null;
  },
  
  pickIndex: function(x, y) {
    var r = this.pickRectIndices(x, y, 1, 1);
    if (r) return r[0];
  },
  
  pick: function(x, y) {
    var index = this.pickIndex(x, y);
    
    if (index != null)
      return this.objects[index];
    return null;
  },
  
  pickRect: function(x, y, w, h) {
    var indices = this.pickRectIndices(x, y, w, h);
    if (indices) {
      for (var i = 0; i < indices.length; i++)
        indices[i] = this.objects[indices[i]];
    }
    return indices;
  },
  
  pickRectIndices: function(x, y, w, h) {
    // we want to read the pixel at x, y -- so we really need a rectangle from x-1,y-1 with witdth and height equal to 1
    x -= 1;
    y -= 1;
    
    var self = this;
    //render for picking
    self.context.bindFramebuffer(GL_FRAMEBUFFER, this.framePickBuffer);
    self.context.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);
    self.context.clear(self.context.gl.COLOR_BUFFER_BIT | self.context.gl.DEPTH_BUFFER_BIT);
    self.context.disable(GL_BLEND);

    this.render(RENDER_PICK);

    var data;               // 0, 0, w, h
    /* I don't think the browsers use this old method any more. Uncomment if I'm wrong. */
    /*
    try {
      data = self.context.readPixels(x, y, 1, 1, GL_RGBA, GL_UNSIGNED_BYTE);
    }
    catch(e) { }               //x-2, y+2
    if (!data) {
    */
      data = new Uint8Array(w*h*4); // w * h * 4
      self.context.readPixels(x, y, w, h, GL_RGBA, GL_UNSIGNED_BYTE, data);
    //}
    if(data.data) data=data.data;
    
    var indices = null, index, i;
    for (i = 2; i < data.length; i += 4) {
      if (data[i] > 0) // check the 'blue' key (2)
      {
        index = decodeFromColor(data[i-2], data[i-1], data[i], data[i+1]);
        if (index)
        {
          if (!indices) indices = {};
          indices[index] = index;
        }
      }
    }
    self.context.bindFramebuffer(GL_FRAMEBUFFER, null);
    self.context.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);

    self.context.enable(GL_BLEND);
    
    if (indices) {
      var ind = [];
      for (i in indices) ind.push(indices[i]);
      return ind;
    }
    return indices;
  }
};
