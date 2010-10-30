function World(context)
{
  var self = this;
  self.objects = {};
  self.camera = new Camera();
  self.context = context;
  self.frame_count = 0;
  
  /* buffers for picking */
  after_initialize(function() {
    self.framePickBuffer = self.context.gl.createFramebuffer();
    self.context.checkError();
    self.renderPickBuffer = self.context.gl.createRenderbuffer();
    self.context.checkError();
    self.pickTexture = self.context.gl.createTexture();
    self.context.checkError();
    self.context.gl.bindTexture(GL_TEXTURE_2D, self.pickTexture);
    self.context.checkError();

    //TODO update when null is accepted
    try {
        self.context.gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGB, self.context.gl.viewportWidth, self.context.gl.viewportHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, null);
      self.context.checkError();
    } catch (e) {
        var tex = new Uint8Array(3);
        self.context.gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGB, self.context.gl.viewportWidth, self.context.gl.viewportHeight, 0, GL_RGB, GL_UNSIGNED_BYTE, tex);
      self.context.checkError();
    }
    
    self.context.gl.bindFramebuffer(GL_FRAMEBUFFER, self.framePickBuffer);
    self.context.checkError();
    self.context.gl.bindRenderbuffer(GL_RENDERBUFFER, self.renderPickBuffer);
    self.context.checkError();
    self.context.gl.renderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, self.context.gl.viewportWidth, self.context.gl.viewportHeight);
    self.context.checkError();
    self.context.gl.bindRenderbuffer(GL_RENDERBUFFER, null);
    self.context.checkError();
    
    self.context.gl.framebufferTexture2D(GL_FRAMEBUFFER, self.context.gl.COLOR_ATTACHMENT0, GL_TEXTURE_2D, self.pickTexture, 0);
    self.context.checkError();
    self.context.gl.framebufferRenderbuffer(GL_FRAMEBUFFER, self.context.gl.DEPTH_ATTACHMENT, GL_RENDERBUFFER, self.renderPickBuffer);
    self.context.checkError();
    self.context.gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    self.context.checkError();
  });
}

World.prototype = {
  render: function(mode) {
    mvPushMatrix();
      this.frame_count++;
      var time = new Date();
      if (!this.render_time) this.render_time = time;
      if (this.render_time <= (time - 1000))
      {
        this.framerate = this.frame_count;
        this.render_time = time;
        this.frame_count = 0;
      }
      
      this.camera.look(this.context.gl);
      if (this.scene) this.scene.render(this.context, mode);
      this.renderObjects(mode);
    mvPopMatrix();
  },
  
  renderObjects: function(mode) {
    for (var i in this.objects)
      if (this.objects[i])
        this.objects[i].render(this.context, mode);
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
    // we want to read the pixel at x, y -- so we really need a rectangle from x-1,y-1 with witdth and height equal to 1
    x -= 1;
    y -= 1;
    
    var self = this;
    y = self.context.gl.viewportHeight - y;
    //render for picking
    self.context.gl.bindFramebuffer(GL_FRAMEBUFFER, this.framePickBuffer);
    self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);
    self.context.gl.clear(self.context.gl.COLOR_BUFFER_BIT | self.context.gl.DEPTH_BUFFER_BIT);
    self.context.gl.disable(self.context.gl.BLEND);

    this.render(RENDER_PICK);

    var data;               // 0, 0, w, h
    /* I don't think the browsers use this old method any more. Uncomment if I'm wrong. */
    /*
    try {
      data = self.context.gl.readPixels(x, y, 1, 1, GL_RGBA, GL_UNSIGNED_BYTE);
      self.context.checkError();
    }
    catch(e) { }               //x-2, y+2
    if (!data) {
    */
      data = new Uint8Array(4); // w * h * 4
      self.context.gl.readPixels(x, y, 1, 1, GL_RGBA, GL_UNSIGNED_BYTE, data);
      self.context.checkError();
    //}
    if(data.data) data=data.data;
    
    var index = null;
    if (data[2] > 0) index = decodeFromColor(data); // check the 'blue' key (2)
    self.context.gl.bindFramebuffer(GL_FRAMEBUFFER, null);
    self.context.checkError();
    self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);
    self.context.checkError();

    self.context.gl.enable(self.context.gl.BLEND);
    self.context.checkError();

    return index;
  },
  
  pick: function(x, y) {
    var index = this.pickIndex(x, y);
    
    if (index != null)
      return this.objects[index];
    return null;
  }
};
