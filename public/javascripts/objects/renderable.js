var Renderable = function() {
  // helpers
  function setColorCoords(self, count, color)
  {
    var colors = [];
    for (var i = 0; i < count; i++)
      for (var j = 0; j < 4; j++)
        colors.push(color[j]);
    return colors;
  }

  function getPickShader(self, context) {
    if (!context) throw new Error("no context given!");
    if (self.pickShader) return self.pickShader;
    var color  = encodeToColor(self.object_id);
    self.pickShader = context.createShader();
    self.pickShader.vertex.source = "attribute vec3 aVertexPosition;\n" +
                               "uniform mat4 mvMatrix;\n" +
                               "uniform mat4 pMatrix;\n" +
                               "void main(void) {\n" +
                               "  gl_Position = pMatrix * mvMatrix * vec4(aVertexPosition, 1.0);\n" +
                               "}";
    
    self.pickShader.fragment.source = "#ifdef GL_ES\n" +
                                 "precision highp float;\n" +
                                 "#endif\n" +
                                 "void main(void) {\n" +
                                 "  gl_FragColor = vec4("+color[0]/255+","+color[1]/255+","+color[2]/255+","+color[3]/255+");\n" +
                                 "}";
    self.pickShader.compile();
    
    return self.pickShader;
  }
  
  function disposeBuffer(self, name, context)
  {
    var buf = self["get"+name](context);
    if (buf) {
      context.gl.deleteBuffer(buf);
      self["set"+name](context, null);
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
      //self.shader = self.shader || "color_without_texture";
      self.built = {};
      self.orientation = new Camera();
      self.buffers = {};
      self.pickShader = false;
      self.textures = [];
    },
    
    addTexture: function(tex, options) {
      this.setTexture(this.textures.length, tex, options);
    },
    
    setTexture: function(index, tex, options) {
      //self.originalTextureCoords = null;
      if (index == 0) this.texture = tex;
      if (index >= 32) throw new Error("WebGL does not support more than 32 texture bindings at once");
      this.textures[index] = tex;
    },
    
    getGLBuffer: function(context, name) {
      if (!context) throw new Error("No context given!");
      if (!name) throw new Error("No name given!");
      if (this.buffers[context.id]) return this.buffers[context.id][name];
      else return (this.buffers[context.id] = {})[name];
    },
    
    setGLBuffer: function(context, name, buf) {
      if (!context) throw new Error("No context given!");
      if (!name) throw new Error("No name given!");
      if (typeof(buf) == "undefined") throw new Error("No buffer given!");
      if (!this.buffers[context.id]) this.buffers[context.id] = {};
      this.buffers[context.id][name] = buf;
    },
    
    getGLVertexBuffer:        function(context) { return this.getGLBuffer(context, 'vertices');      },
    getGLColorBuffer:         function(context) { return this.getGLBuffer(context, 'colors');        },
    getGLIndexBuffer:         function(context) { return this.getGLBuffer(context, 'indices');       },
    getGLNormalBuffer:        function(context) { return this.getGLBuffer(context, 'normals');       },
    getGLTextureCoordsBuffer: function(context) { return this.getGLBuffer(context, 'textureCoords'); },
    
    setGLVertexBuffer:        function(context, buf) { this.setGLBuffer(context, 'vertices',      buf); },
    setGLColorBuffer:         function(context, buf) { this.setGLBuffer(context, 'colors',        buf); },
    setGLIndexBuffer:         function(context, buf) { this.setGLBuffer(context, 'indices',       buf); },
    setGLNormalBuffer:        function(context, buf) { this.setGLBuffer(context, 'normals',       buf); },
    setGLTextureCoordsBuffer: function(context, buf) { this.setGLBuffer(context, 'textureCoords', buf); },
    
    rebuildPickShader: function(context, index) {
      if (!context) throw new Error("No context given!");
      this.object_id = typeof(index) == "undefined" || index == null ? this.object_id : index;
      if (this.pickShader) this.pickShader.dispose();
      this.pickShader = false;
      return getPickShader(this, context);
    },
    
    setColor: function(color) {
      if (color.length == 4) { this.color = color; this.colors = []; }
      else if (arguments.length == 4) { this.setColor([arguments[0], arguments[1], arguments[2], arguments[3]]); return; }
      else this.colors = color;
      this.built = {}; // schedule a rebuild since we don't have a context right now
    },
    
    isBuiltFor: function(context) {
      if (!context) throw new Error("No context given!");
      return (this.built && this.built[context.id]);
    },
    
    render: function(context, mode) {
      var self = this;
      if (self.texture && self.texture != self.textures[0]) self.setTexture(0, self.texture);
      logger.attempt('Renderable#render', function() {
        if (!self.isBuiltFor(context)) { self.rebuild(context); }
        var vertexBuffer  = self.getGLVertexBuffer(context),        indexBuffer  = self.getGLIndexBuffer(context),
            textureBuffer = self.getGLTextureCoordsBuffer(context), normalBuffer = self.getGLNormalBuffer(context),
            colorBuffer   = self.getGLColorBuffer(context);
        
        mode = mode || FILL;
        mvPushMatrix();
          applyObjectSpaceMatrixTransformations(self);
        
          var shader = (mode == RENDER_PICK ? getPickShader(self, context) : self.shader);
          shader = shader || (self.texture && 'color_with_texture' || 'color_without_texture');
          if (typeof(shader) == "string") shader = context.shaders[shader];
          else if (shader.context != context)
            throw new Error("Tried to render an object using a shader from a different context than the current one! (Try using the name of the shader instead)");
  
          shader.setAttribute('aVertexPosition', vertexBuffer);
          if (indexBuffer)   context.gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, indexBuffer);
          if (textureBuffer) shader.setAttribute('aTextureCoord', textureBuffer);
          if (normalBuffer)  shader.setAttribute('aVertexNormal', normalBuffer);
          if (colorBuffer)   shader.setAttribute('aVertexColor', colorBuffer);
          if (self.texture)
          {
            context.gl.activeTexture(GL_TEXTURE0);
            if (self.texture.bind) self.texture.bind(context);
            else context.gl.bindTexture(GL_TEXTURE_2D, self.texture);
            shader.uniform('uSampler', 'uniform1i').value = 0;
          }
          shader.bind(function() {
            var enum = self.DRAW_MODE;
            if (mode == WIREFRAME) enum = GL_LINE_STRIP;
            
            if (indexBuffer)
            {
              context.gl.drawElements(enum, indexBuffer.numItems, GL_UNSIGNED_SHORT, 0);
              context.checkError();
            }
            else
            {
              context.gl.drawArrays(enum, 0, vertexBuffer.numItems);
              context.checkError();
            }
          });
            
          mvPopMatrix();
        context.checkError();
      });
    },
    
    dispose: function(context) {
      var self = this;
      logger.attempt("Renderable#dispose", function() {
        if (!context) throw new Error("No context given!");
        self.built[context.id] = false;
        disposeBuffer(self, 'GLVertexBuffer', context);
        disposeBuffer(self, 'GLColorBuffer', context);
        disposeBuffer(self, 'GLTextureCoordsBuffer', context);
        disposeBuffer(self, 'GLIndexBuffer', context);
        disposeBuffer(self, 'GLNormalBuffer', context);
        self.originalTextureCoords = null;
        if (self.pickShader) { self.pickShader.dispose(); self.pickShader = false; }
      });
    },
    
    // forces this object to be rebuilt for every context.
    invalidate: function() {
      for (var id in this.built) {
        if (this.built[id])
          this.dispose(this.built[id]);
      }
    },
    
    rebuild: function(context) {
      var self = this;
      logger.attempt("Renderable#rebuild", function() {
        self.dispose(context);
        var gl = context.gl;
        self.DRAW_MODE = GL_TRIANGLES;
        self.built[context.id] = context;
  
        var vertices = [], colors = [], textureCoords = [], normals = [], indices = [];
        if (self.init) self.init(vertices, colors, textureCoords, normals, indices);
        if (self.color) // something has already set the color
        {
          colors = setColorCoords(self, vertices.length / 3, self.color);
        }
        else if (colors.length == 0) // color isn't set, and user didn't set any during init()
        {
          if (!self.getGLColorBuffer(context)) // and none are already set
          {
            colors = setColorCoords(self, vertices.length / 3, [1,1,1,1]);
          }
          else ; // color isn't explicitly set, but color vertices exist, so use them.
        }
        
        var buffer;
        if (vertices.length > 0)
        {
          buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
          buffer.itemSize = 3;
          buffer.numItems = vertices.length / 3;
          self.setGLVertexBuffer(context, buffer);
        }
        
        if (colors.length > 0)
        {
          buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
          buffer.itemSize = 4;
          buffer.numItems = colors.length / 4;
          self.setGLColorBuffer(context, buffer);
        }
        
        if (textureCoords.length > 0)
        {
          buffer = gl.createBuffer();
          self.originalTextureCoords = textureCoords;
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
          buffer.itemSize = 2;
          buffer.numItems = textureCoords.length / 2;
          self.setGLTextureCoordsBuffer(context, buffer);
        }
        
        if (indices.length > 0)
        {
          buffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STREAM_DRAW);
          buffer.itemSize = 1;
          buffer.numItems = indices.length;
          self.setGLIndexBuffer(context, buffer);
        }
        
        if (normals.length > 0)
        {
          buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
          buffer.itemSize = 3;
          buffer.numItems = normals.length / 3;
          self.setGLNormalBuffer(context, buffer);
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
      });
    }
  });
}();

Renderable.all = [];
Renderable.update_interval = 30;
