function Renderable(init_func, update_func)
{
  var self = this;
  self.object_id = Renderable.all.length;
  Renderable.all.push(self);
  
  self.update = update_func;
  self.init = init_func; 
  self.orientation = new Camera();
  var vertexBuffer = null, textureBuffer = null, colorBuffer = null, indexBuffer = null, normalBuffer = null;
  var pickShader, updateInterval = null;
  
  var vertices = [], colors = [], textureCoords = [], normals = [], indices = [];
  
  function setColorCoords(count, color)
  {
    colors = [];
    for (var i = 0; i < count; i++)
      for (var j = 0; j < 4; j++)
        colors.push(color[j]);
  }
  
  /* private function for generating this object's pick shader. */
  function getPickShader() {
    if (pickShader) return pickShader;
    var color = encodeToColor(self.object_id);
    pickShader = new Shader();
    pickShader.vertex.source =   "attribute vec3 aVertexPosition;\n" +
                                 "uniform mat4 uMVMatrix;\n" +
                                 "uniform mat4 uPMatrix;\n" +
                                 "void main(void) {\n" +
                                 "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
                                 "}";
    
    pickShader.fragment.source = "#ifdef GL_ES\n" +
                                 "precision highp float;\n" +
                                 "#endif\n" +
                                 "void main(void) {\n" +
                                 "  gl_FragColor = vec4("+color[0]/255+","+color[1]/255+","+color[2]/255+","+color[3]/255+");\n" +
                                 "}";
    
    pickShader.setUniformValue('uMVMatrix', function() { return new Float32Array(mvMatrix.flatten()); });
    pickShader.setUniformValue('uPMatrix',  function() { return new Float32Array(pMatrix.flatten());  });
    
    return pickShader;
  }
  
  self.rebuildPickShader = function(index)
  {
    self.object_id = typeof(index) == "undefined" || typeof(index) == "null" ? self.object_id : index;
    if (pickShader) pickShader.dispose();
    pickShader = false;
    return getPickShader();
  };
  
  self.setColor  = function(color) {
    if (color.length == 4)
    {
      var numColors;
      if (colors.length == 0) // user didn't set color indices, so we should rebuild them here
        numColors = vertices.length / 3;
      else
        numColors = colors.length / 4;

      setColorCoords(numColors, color);
    }
    else if (arguments.length == 4) { this.setColor([arguments[0], arguments[1], arguments[2], arguments[3]]); return; }
    else colors = color;
    this.rebuild();
  };
  
  this.render = function(mode) {
    if (!vertexBuffer || !gl) return;
    mode = mode || FILL;
    
    mvPushMatrix();
      multMatrix(self.orientation.getMatrix());
  
      var shader = (mode == RENDER_PICK ? getPickShader() : self.shader) || activeShader;
      shader.setAttribute('aVertexPosition', vertexBuffer);
      if (indexBuffer)   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      if (textureBuffer) shader.setAttribute('aTextureCoord', textureBuffer);
      if (normalBuffer)  shader.setAttribute('aVertexNormal', normalBuffer);
      if (colorBuffer)   shader.setAttribute('aVertexColor', colorBuffer);
      if (self.texture)
      {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        shader.uniform('uSampler', 'uniform1i').value = 0;
      }
      shader.bind(function() {
        var enum = gl.TRIANGLES;
        if (mode == WIREFRAME) enum = gl.LINE_STRIP;
        
        if (indexBuffer) gl.drawElements(enum, indices.length, gl.UNSIGNED_SHORT, 0);
        else gl.drawArrays(enum, 0, vertexBuffer.numItems);
        checkGLError();
      });
        
      mvPopMatrix();
    checkGLError();
  };
  
  this.dispose = function() {
    if (gl)
    {
      if (vertexBuffer)  gl.deleteBuffer(vertexBuffer);
      if (colorBuffer)   gl.deleteBuffer(colorBuffer);
      if (textureBuffer) gl.deleteBuffer(textureBuffer);
      if (indexBuffer)   gl.deleteBuffer(indexBuffer);
      if (normalBuffer)  gl.deleteBuffer(normalBuffer);
      if (pickShader)    pickShader.dispose();
      vertices = [];
      colors = [];
      textureCoords = [];
      normals = [];
      indices = [];
    }
  };
  
  this.rebuild = function() {
    if (vertexBuffer) self.dispose();
    
    if (self.init) self.init(vertices, colors, textureCoords, normals, indices);
    
    if (colors.length == 0) setColorCoords(vertices.length / 3, [1,1,1,1]);
    
    if (vertices.length > 0)
    {
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      vertexBuffer.itemSize = 3;
      vertexBuffer.numItems = vertices.length / 3;
    }
    
    if (colors.length > 0)
    {
      colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      colorBuffer.itemSize = 4;
      colorBuffer.numItems = colors.length / 4;
    }
    
    if (textureCoords.length > 0)
    {
      textureBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
      textureBuffer.itemSize = 2;
      textureBuffer.numItems = textureCoords.length / 2;
    }
    
    if (indices.length > 0)
    {
      indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STREAM_DRAW);
      indexBuffer.itemSize = 1;
      indexBuffer.numItems = indices.length;
    }
    
    if (normals.length > 0)
    {
      normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
      normalBuffer.itemSize = 3;
      normalBuffer.numItems = normals.length / 3;
    }
    
    if (updateInterval) clearInterval(updateInterval);
    setInterval(function() { if (self.update) self.update(); }, Renderable.update_interval);
  };
  
  if (gl) self.rebuild();
  else after_initialize(self.rebuild);
}

Renderable.prototype = {
  
};

Renderable.all = [];
Renderable.update_interval = 30;
