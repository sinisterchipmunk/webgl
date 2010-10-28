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
    self.renderPickBuffer = self.context.gl.createRenderbuffer();
    self.pickTexture = self.context.gl.createTexture();
    self.context.gl.bindTexture(self.context.gl.TEXTURE_2D, self.pickTexture);

    //TODO update when null is accepted
    try {
        self.context.gl.texImage2D(self.context.gl.TEXTURE_2D, 0, self.context.gl.RGB, self.context.gl.viewportWidth, self.context.gl.viewportHeight, 0, self.context.gl.RGB, self.context.gl.UNSIGNED_BYTE, null);
    } catch (e) {
        var tex = new Uint8Array(3);
        self.context.gl.texImage2D(self.context.gl.TEXTURE_2D, 0, self.context.gl.RGB, self.context.gl.viewportWidth, self.context.gl.viewportHeight, 0, self.context.gl.RGB, self.context.gl.UNSIGNED_BYTE, tex);
    }
    
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, self.framePickBuffer);
    self.context.gl.bindRenderbuffer(self.context.gl.RENDERBUFFER, self.renderPickBuffer);
    self.context.gl.renderbufferStorage(self.context.gl.RENDERBUFFER, self.context.gl.DEPTH_COMPONENT, self.context.gl.viewportWidth, self.context.gl.viewportHeight);
    self.context.gl.bindRenderbuffer(self.context.gl.RENDERBUFFER, null);
    
    self.context.gl.framebufferTexture2D(self.context.gl.FRAMEBUFFER, self.context.gl.COLOR_ATTACHMENT0, self.context.gl.TEXTURE_2D, self.pickTexture, 0);
    self.context.gl.framebufferRenderbuffer(self.context.gl.FRAMEBUFFER, self.context.gl.DEPTH_ATTACHMENT, self.context.gl.RENDERBUFFER, self.renderPickBuffer);
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, null);
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
      this.renderObjects(mode);
    mvPopMatrix();
  },
  
  renderObjects: function(mode) {
    for (var i in this.objects)
      if (this.objects[i])
        this.objects[i].render(this.context, mode);
  },
  
  addObject: function(object) {
    this.objects[object.object_id] = object;
  },
  
  removeObject: function(object) {
    this.objects[object.object_id] = null;
  },
  
  pickIndex: function(x, y) {
    // we want to read the pixel at x, y -- so we really need a rectangle from x-1,y-1 with witdth and height equal to 1
    x -= 1;
    y -= 1;
    
    var self = this;
    y = self.context.gl.viewportHeight - y;
    //render for picking
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, this.framePickBuffer);
    self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);
    self.context.gl.clear(self.context.gl.COLOR_BUFFER_BIT | self.context.gl.DEPTH_BUFFER_BIT);
    self.context.gl.disable(self.context.gl.BLEND);

    this.render(RENDER_PICK);

    var data;               // 0, 0, w, h
    try { data = self.context.gl.readPixels(x, y, 1, 1, self.context.gl.RGBA, self.context.gl.UNSIGNED_BYTE); }
    catch(e) { }               //x-2, y+2
    if (!data) {                  
      data = new Uint8Array(4); // w * h * 4
      self.context.gl.readPixels(x, y, 1, 1, self.context.gl.RGBA, self.context.gl.UNSIGNED_BYTE, data);
    }
    if(data.data) data=data.data;
    
    var index = null;
    if (data[2] > 0) index = decodeFromColor(data); // check the 'blue' key (2)
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, null);
    self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);

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
