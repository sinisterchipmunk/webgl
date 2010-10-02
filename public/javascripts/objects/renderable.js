var Renderable = function() {
  // helpers
  function setColorCoords(self, count, color)
  {
    self.colors = [];
    for (var i = 0; i < count; i++)
      for (var j = 0; j < 4; j++)
        self.colors.push(color[j]);
  }

  function getPickShader(self) {
    if (self.pickShader) return self.pickShader;
    var color  = encodeToColor(self.object_id);
    self.pickShader = new Shader();
    self.pickShader.vertex.source = "attribute vec3 aVertexPosition;\n" +
                                    "uniform mat4 uMVMatrix;\n" +
                                    "uniform mat4 uPMatrix;\n" +
                                    "void main(void) {\n" +
                                    "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
                                    "}";
    
    self.pickShader.fragment.source = "#ifdef GL_ES\n" +
                                       "precision highp float;\n" +
                                       "#endif\n" +
                                       "void main(void) {\n" +
                                       "  gl_FragColor = vec4("+color[0]/255+","+color[1]/255+","+color[2]/255+","+color[3]/255+");\n" +
                                       "}";
    
    self.pickShader.setUniformValue('uMVMatrix', function() { return new Float32Array(mvMatrix.flatten()); });
    self.pickShader.setUniformValue('uPMatrix',  function() { return new Float32Array(pMatrix.flatten());  });
    
    return self.pickShader;
  }
  
  function disposeBuffer(self, name)
  {
    var buf = self["get"+name]();
    if (buf) {
      gl.deleteBuffer(buf);
      logger.debug(name);
      logger.debug(self["set"+name]);
      self["set"+name](null);
    }
  }
  
  function applyObjectSpaceMatrixTransformations(self)
  {
    // some setup
    var matr = self.orientation.getMatrix().dup();
    matr.elements[0][3] = matr.elements[1][3] = matr.elements[2][3] = 0;
    var trans = Matrix.Translation($V(self.orientation.getPosition())).multiply(matr);
    
    mvMatrix = mvMatrix.x(trans);
  }
  
  // class
  return Class.create({
    initialize: function(init_func, update_func)
    {
      var self = this;
      self.object_id = Renderable.all.length;
      Renderable.all.push(self);
      
      if (init_func) self.init = init_func;
      if (update_func) self.update = update_func;
      self.orientation = new Camera();
      self.buffers = [];
      self.vertices = [];
      self.colors = [];
      self.textureCoords = [];
      self.normals = [];
      self.indices = [];
      
      if (gl) self.rebuild();
      else after_initialize(function() { self.rebuild(); });
    },
    
    getGLVertexBuffer:        function() { return this.buffers['vertices'];      },
    getGLColorBuffer:         function() { return this.buffers['colors'];        },
    getGLIndexBuffer:         function() { return this.buffers['indices'];       },
    getGLNormalBuffer:        function() { return this.buffers['normals'];       },
    getGLTextureCoordsBuffer: function() { return this.buffers['textureCoords']; },
    
    setGLVertexBuffer:        function(buf) { this.buffers['vertices']      = buf; },
    setGLColorBuffer:         function(buf) { this.buffers['colors']        = buf; },
    setGLIndexBuffer:         function(buf) { this.buffers['indices']       = buf; },
    setGLNormalBuffer:        function(buf) { this.buffers['normals']       = buf; },
    setGLTextureCoordsBuffer: function(buf) { this.buffers['textureCoords'] = buf; },
    
    rebuildPickShader: function(index) {
      this.object_id = typeof(index) == "undefined" || index == null ? this.object_id : index;
      if (this.pickShader) this.pickShader.dispose();
      this.pickShader = false;
      return getPickShader(this);
    },
    
    setColor: function(color) {
      if (color.length == 4) { this.color = color; this.colors = []; }
      else if (arguments.length == 4) { this.setColor([arguments[0], arguments[1], arguments[2], arguments[3]]); return; }
      else this.colors = color;
      this.rebuild();
    },
    
    render: function(mode) {
      var self = this;
      var vertexBuffer = this.getGLVertexBuffer(), indexBuffer = this.getGLIndexBuffer(),
          textureBuffer = this.getGLTextureCoordsBuffer(), normalBuffer = this.getGLNormalBuffer(),
          colorBuffer = this.getGLColorBuffer();
      
      if (!vertexBuffer || !gl) return;
      mode = mode || FILL;
      mvPushMatrix();
        applyObjectSpaceMatrixTransformations(self);
      
        var shader = (mode == RENDER_PICK ? getPickShader(self) : self.shader);
        shader = shader || shaders[activeShaderName] || shaders['color_without_texture'];
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
          var enum = self.DRAW_MODE;
          if (mode == WIREFRAME) enum = gl.LINE_STRIP;
          
          if (indexBuffer) gl.drawElements(enum, self.indices.length, gl.UNSIGNED_SHORT, 0);
          else gl.drawArrays(enum, 0, vertexBuffer.numItems);
          checkGLError();
        });
          
        mvPopMatrix();
      checkGLError();
    },
    
    dispose: function() {
      if (gl)
      {
        disposeBuffer(this, 'GLVertexBuffer');
        disposeBuffer(this, 'GLColorBuffer');
        disposeBuffer(this, 'GLTextureCoordsBuffer');
        disposeBuffer(this, 'GLIndexBuffer');
        disposeBuffer(this, 'GLNormalBuffer');
        if (this.pickShader) this.pickShader.dispose();
        this.vertices      = [];
        this.colors        = [];
        this.textureCoords = [];
        this.normals       = [];
        this.indices       = [];
      }
    },
    
    rebuild: function() {
      var self = this;
      self.DRAW_MODE = gl.TRIANGLES;

      var colors = [];
      if (self.getGLVertexBuffer()) self.dispose();
      if (self.init) self.init(self.vertices, colors, self.textureCoords, self.normals, self.indices);
      if (self.color) // something has already set the color
      {
        setColorCoords(self, self.vertices.length / 3, self.color || [1,1,1,1]);
      }
      else if (colors.length == 0) // color isn't set, and user didn't set any during init()
      {
        if (self.colors.length == 0) // and none are already set
        {
          setColorCoords(self, self.vertices.length / 3, [1,1,1,1]);
        }
        else ; // color isn't explicitly set, but color vertices exist, so use them.
      }
      else self.colors = colors;
      
      var buffer;
      if (self.vertices.length > 0)
      {
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.vertices), gl.STATIC_DRAW);
        buffer.itemSize = 3;
        buffer.numItems = self.vertices.length / 3;
        self.setGLVertexBuffer(buffer);
      }
      
      if (self.colors.length > 0)
      {
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.colors), gl.STATIC_DRAW);
        buffer.itemSize = 4;
        buffer.numItems = self.colors.length / 4;
        self.setGLColorBuffer(buffer);
      }
      
      if (self.textureCoords.length > 0)
      {
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.textureCoords), gl.STATIC_DRAW);
        buffer.itemSize = 2;
        buffer.numItems = self.textureCoords.length / 2;
        self.setGLTextureCoordsBuffer(buffer);
      }
      
      if (self.indices.length > 0)
      {
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(self.indices), gl.STREAM_DRAW);
        buffer.itemSize = 1;
        buffer.numItems = self.indices.length;
        self.setGLIndexBuffer(buffer);
      }
      
      if (self.normals.length > 0)
      {
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(self.normals), gl.STATIC_DRAW);
        buffer.itemSize = 3;
        buffer.numItems = self.normals.length / 3;
        self.setGLNormalBuffer(buffer);
      }
      
      var previousUpdate = new Date();
      if (self.updateInterval) clearInterval(self.updateInterval);
      self.updateInterval = setInterval(function() {
        if (self.update)
        {
          var currentTime = new Date();
          var timechange = currentTime - previousUpdate;
          previousUpdate = currentTime;
          self.update(timechange / 1000);
        }
      }, Renderable.update_interval);
    }
  });
}();

Renderable.all = [];
Renderable.update_interval = 30;
