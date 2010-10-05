function World(context)
{
  var self = this;
  self.objects = {};
  self.camera = new Camera();
  self.context = context;
  
  /* buffers for picking */
  after_initialize(function() {
    self.framePickBuffer = self.context.gl.createFramebuffer();
    self.renderPickBuffer = self.context.gl.createRenderbuffer();
    self.pickTexture = self.context.gl.createTexture();
    self.context.gl.bindTexture(self.context.gl.TEXTURE_2D, self.pickTexture);

    //TODO update when null is accepted
    try {
        self.context.gl.texImage2D(self.context.gl.TEXTURE_2D, 0, self.context.gl.RGB, 1, 1, 0, self.context.gl.RGB, self.context.gl.UNSIGNED_BYTE, null);
    } catch (e) {
        var tex = new Uint8Array(3);
        self.context.gl.texImage2D(self.context.gl.TEXTURE_2D, 0, self.context.gl.RGB, 1, 1, 0, self.context.gl.RGB, self.context.gl.UNSIGNED_BYTE, tex);
    }
    
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, self.framePickBuffer);
    self.context.gl.bindRenderbuffer(self.context.gl.RENDERBUFFER, self.renderPickBuffer);
    self.context.gl.renderbufferStorage(self.context.gl.RENDERBUFFER, self.context.gl.DEPTH_COMPONENT, 1, 1);
    self.context.gl.bindRenderbuffer(self.context.gl.RENDERBUFFER, null);
    
    self.context.gl.framebufferTexture2D(self.context.gl.FRAMEBUFFER, self.context.gl.COLOR_ATTACHMENT0, self.context.gl.TEXTURE_2D, self.pickTexture, 0);
    self.context.gl.framebufferRenderbuffer(self.context.gl.FRAMEBUFFER, self.context.gl.DEPTH_ATTACHMENT, self.context.gl.RENDERBUFFER, self.renderPickBuffer);
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, null);
  });
}

World.prototype = {
  render: function(mode) {
    mvPushMatrix();
      this.camera.look(this.context.gl);
      this.renderObjects(mode);
    mvPopMatrix();
  },
  
  renderObjects: function(mode) {
    for (var i in this.objects)
      this.objects[i].render(this.context, mode);
  },
  
  addObject: function(object) {
    this.objects[object.object_id] = object;
  },
  
  pick: function(x, y) {
    var debug = $("debug");
    var self = this;
    
    // compensate for firefox; TODO see if this is necessary for chrome / safari
    x -= 2;
    y -= 3;

    // TODO - don't hard code these
    var near = 0.0001, far = 150;
    var cpMatrix = this.camera.getProjectionMatrix(), cmvMatrix = this.camera.getMatrix();
    if (!cpMatrix || !cmvMatrix) return null;
    
    //get eye space coords
    xcoord =  -( ( ( 2 * x ) / self.context.gl.viewportWidth ) - 1 ) / cpMatrix.e(1,1);
    ycoord =   ( ( ( 2 * y ) / self.context.gl.viewportHeight) - 1 ) / cpMatrix.e(2,2);
    zcoord =  1;
    
    var coord=$V([xcoord,ycoord,zcoord,0]);
    coord=cmvMatrix.inverse().x(coord);
    var cameraPos=this.camera.getPosition();
    var zvec=$V([coord.e(1,1),coord.e(2,1),coord.e(3,1)]).toUnitVector();
    var xvec=$V([0,0,1]).cross(zvec).toUnitVector();
    var yvec=zvec.cross(xvec).toUnitVector();		
    var origmatrix=mvMatrix;	
    var origpmatrix=pMatrix;
    
    mvMatrix=$M([[xvec.e(1), yvec.e(1), zvec.e(1), cameraPos[0]],
                 [xvec.e(2), yvec.e(2), zvec.e(2), cameraPos[1]],
                 [xvec.e(3), yvec.e(3), zvec.e(3), cameraPos[2]],
                 [0, 0, 0, 1]]).inverse();
    pMatrix=makeOrtho(-0.0001,0.0001,-0.0001,0.0001,near,far);
    //render for picking
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, this.framePickBuffer);
    self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);
    //self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);
    self.context.gl.clear(self.context.gl.COLOR_BUFFER_BIT | self.context.gl.DEPTH_BUFFER_BIT);
    self.context.gl.disable(self.context.gl.BLEND);

    //setMatrixUniforms();
    this.renderObjects(RENDER_PICK);

    var data;               // 0, 0, w, h
    try { data = self.context.gl.readPixels(0, 0, 1, 1, self.context.gl.RGBA, self.context.gl.UNSIGNED_BYTE); }
    catch(e) { }               //x-2, y+2
    if (!data) {
      data = new Uint8Array(4); // w * h * 4
      self.context.gl.readPixels(0, 0, 1, 1, self.context.gl.RGBA, self.context.gl.UNSIGNED_BYTE, data);
    }
    if(data.data) data=data.data;
    
    if (debug) debug.update(debug.innerHTML+"<br/>"+
                        "mask data: ["+data[0]+","+data[1]+","+data[2]+"]<br/>"+
                        "viewport size: "+self.context.gl.viewportWidth+"x"+self.context.gl.viewportHeight);
    var index = decodeFromColor(data);
    self.context.gl.bindFramebuffer(self.context.gl.FRAMEBUFFER, null);
    self.context.gl.viewport(0,0,self.context.gl.viewportWidth,self.context.gl.viewportHeight);

    //revert the view matrix
    mvMatrix=origmatrix;	
    pMatrix=origpmatrix;
    self.context.gl.enable(self.context.gl.BLEND);
      self.context.checkError();
    
    if (data[2] > 0) // check the 'blue' key
    {
      if (debug) debug.update(debug.innerHTML+"<br/>Found object: "+this.objects[index]+" (index "+index+")");
      return this.objects[index];
    }
    return null;
  }
};
