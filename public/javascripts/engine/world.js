function World()
{
  var self = this;
  self.objects = [];
  self.camera = new Camera();
  
  /* buffers for picking */
  after_initialize(function(gl) {
    self.framePickBuffer = gl.createFramebuffer();
    self.renderPickBuffer = gl.createRenderbuffer();
    self.pickTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, self.pickTexture);

    //TODO update when null is accepted
    try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    } catch (e) {
        var tex = new Uint8Array(3);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, tex);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, self.framePickBuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, self.renderPickBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT, 1, 1);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.pickTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, self.renderPickBuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  });
}

World.prototype = {
  render: function(mode) {
    mvPushMatrix();
      this.camera.look(gl);
      this.renderObjects(mode);
    mvPopMatrix();
  },
  
  renderObjects: function(mode) {
    for (var i = 0; i < this.objects.length; i++)
      this.objects[i].render(mode);
  },
  
  addObject: function(object) {
    object.rebuildPickShader(this.objects.length);
    this.objects.push(object);
  },
  
  pick: function(x, y) {
    var debug = $("debug");
    
    // compensate for firefox; TODO see if this is necessary for chrome / safari
    x -= 2;
    y -= 3;

    // TODO - don't hard code these
    var near = 0.0001, far = 150;
    var cpMatrix = this.camera.getProjectionMatrix(), cmvMatrix = this.camera.getMatrix();
    if (!cpMatrix || !cmvMatrix) return null;
    
    //get eye space coords
    xcoord =  -( ( ( 2 * x ) / gl.viewportWidth ) - 1 ) / cpMatrix.e(1,1);
    ycoord =   ( ( ( 2 * y ) / gl.viewportHeight) - 1 ) / cpMatrix.e(2,2);
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framePickBuffer);
    gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);
    //gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);

    //setMatrixUniforms();
    this.renderObjects(RENDER_PICK);

    var data;               // 0, 0, w, h
    try { data = gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE); }
    catch(e) { }               //x-2, y+2
    if (!data) {
      data = new Uint8Array(4); // w * h * 4
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    if(data.data) data=data.data;
    
    if (debug) debug.update(debug.innerHTML+"<br/>"+
                        "mask data: ["+data[0]+","+data[1]+","+data[2]+"]<br/>"+
                        "viewport size: "+gl.viewportWidth+"x"+gl.viewportHeight);
    var index = decodeFromColor(data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);

    //revert the view matrix
    mvMatrix=origmatrix;	
    pMatrix=origpmatrix;
    gl.enable(gl.BLEND);
      checkGLError();
    
    if (data[2] > 0) // check the 'blue' key
    {
      if (debug) debug.update(debug.innerHTML+"<br/>Found object: "+this.objects[index]+" (index "+index+")");
      return this.objects[index];
    }
    return null;
  }
};
