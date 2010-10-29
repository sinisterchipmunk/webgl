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
    if (self.pickShader && self.pickShader[context.id]) return self.pickShader[context.id];
    if (!self.pickShader) self.pickShader = {};
    self.pickShader[context.id] = new Renderable.PickShader(context, self.object_id).shader;
    
    return self.pickShader[context.id];
  }
  
  function buildTexture(self, context, descriptor) {
    var coords = [];
    for (var i = 0; i < self.originalTextureCoords.length; i += 2)
      coords.push(self.originalTextureCoords[i]*descriptor.scaleX, self.originalTextureCoords[i+1]*descriptor.scaleY);

    if (coords.length != 0)
      descriptor.buffers[context.id] = new TextureCoordsBuffer(context, coords);
  }
  
  function disposeBuffer(self, name, context)
  {
    var buf = self["get"+name](context);
    if (buf) {
      if (buf.dispose) buf.dispose();
      // since there's a Buffer object now, this next should never happen - but it's not hurting...
      else context.gl.deleteBuffer(buf);
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
      self.object_id = ++Renderable.identifier;
      Renderable.all.push(self);
      
      if (init_func) self.init = init_func;
      if (update_func) self.update = update_func;
      
      self.built = {};
      self.orientation = new Camera();
      self.buffers = {};
      self.pickShader = false;
      self.textures = [];
      self.textureBuildQueue = [];
    },
    
    addTexture: function(tex, options) {
      this.setTexture(this.textures.length, tex, options);
    },
    
    /*
     valid options include: 
       scale  - how many times this texture will be tiled over the object. Defaults to 1.
       scaleX - just like scale, but is only applied horizontally.
       scaleY - just like scale, but is only applied vertically.
    */
    setTexture: function(index, tex, options) {
      var self = this, j;
      options = options || {};
      var context = options.context;
      
      logger.attempt("Renderable#setTexture", function() {
        if (index < 0)   throw new Error("Invalid texture index: "+index);
        if (index >= 32) throw new Error("WebGL does not support more than 32 texture bindings at once");
        
        self.originalTextureCoords = self.originalTextureCoords || [];
        
        var descriptor = self.textures[index] || {buffers:{}};
        self.textures[index] = descriptor;
        
        // initialize unspecified options
        descriptor.scale  = options.scale  || descriptor.scale  || 1;
        descriptor.scaleX = options.scaleX || descriptor.scaleX || descriptor.scale;
        descriptor.scaleY = options.scaleY || descriptor.scaleY || descriptor.scale;
                
        // set the new texture object
        if (typeof(tex) == "string") descriptor.texture = new Texture(tex);
        else
          if (tex.bind) descriptor.texture = tex;
          else throw new Error("Expected texture to be a String (filename) or Texture().");
        if (index == 0)  self.texture = descriptor;
        
        
        // free the GL buffers or they won't be rebuilt
        for (var bufname in descriptor.buffers) {
          var buffer = descriptor.buffers[bufname];
                    
          // clear the corresponding JS buffer so we can replace its contents
          buffer.js.clear();

          // fill it with the new data. Its GL counterpart will get rebuilt during the first render.
          for (j = 0; j < self.originalTextureCoords.length; j += 2)
            buffer.js.push(self.originalTextureCoords[j]*descriptor.scaleX,
                           self.originalTextureCoords[j]*descriptor.scaleY);
          
          // refresh the buffer so the JS data makes its way into GL.
          buffer.refresh();
        }
      });
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
    
    setGLVertexBuffer:        function(context, buf) { this.setGLBuffer(context, 'vertices',      buf); },
    setGLColorBuffer:         function(context, buf) { this.setGLBuffer(context, 'colors',        buf); },
    setGLIndexBuffer:         function(context, buf) { this.setGLBuffer(context, 'indices',       buf); },
    setGLNormalBuffer:        function(context, buf) { this.setGLBuffer(context, 'normals',       buf); },
    
    rebuildPickShader: function(context, index) {
      if (!context) throw new Error("No context given!");
      this.object_id = typeof(index) == "undefined" || index == null ? this.object_id : index;
      if (this.pickShader && this.pickShader[context.id]) this.pickShader[context.id].dispose();
      this.pickShader[context.id] = false;
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
      logger.attempt('Renderable#render', function() {
        // make sure everything's up to date.
        if (self.texture && self.texture != self.textures[0]) self.setTexture(0, self.texture);
        if (!self.isBuiltFor(context))                        self.rebuild(context);
        
        
        // get the related buffers.
        var vertexBuffer  = self.getGLVertexBuffer(context),        indexBuffer  = self.getGLIndexBuffer(context),
            normalBuffer = self.getGLNormalBuffer(context),         colorBuffer   = self.getGLColorBuffer(context);
        
        mode = mode || FILL;
        mvPushMatrix();
          applyObjectSpaceMatrixTransformations(self);
        
          // get the active shader
          var shader = (mode == RENDER_PICK ? getPickShader(self, context) : self.shader);
          shader = shader || (self.texture && 'color_with_texture' || 'color_without_texture');

          if (typeof(shader) == "string") shader = context.shaders[shader];
          else if (shader.context != context)
            throw new Error("Tried to render an object using a shader from a different context than the current one! (Try using the name of the shader instead)");
  
          // set the shader attributes
          shader.setAttribute('aVertexPosition', vertexBuffer);
          if (indexBuffer)   indexBuffer.bind();
          if (normalBuffer)  shader.setAttribute('aVertexNormal', normalBuffer);
          if (colorBuffer)   shader.setAttribute('aVertexColor', colorBuffer);
        
          for (var i = 0; i < self.textures.length; i++) {
            var descriptor = self.textures[i];
            if (descriptor)
            {
              if (!descriptor.buffers[context.id])
                buildTexture(self, context, descriptor);
              
              context.gl.activeTexture(GL_TEXTURES[i]);
              if (!descriptor.texture || !descriptor.texture.bind) alert(descriptor.texture.toSource());
              descriptor.texture.bind(context);
              shader.uniform("texture"+i, "uniform1i").value = i;
              shader.setAttribute("texture"+i+"coords", descriptor.buffers[context.id]);
            }
          }
        
          // bind the shader, apply the attributes, and draw the object.
          shader.bind(function() {
            var dmode = self.DRAW_MODE;
            if (mode == WIREFRAME) dmode = GL_LINE_STRIP;
            
            if (indexBuffer)
            {
              context.gl.drawElements(dmode, indexBuffer.numItems, GL_UNSIGNED_SHORT, 0);
              context.checkError();
            }
            else if (vertexBuffer)
            {
              context.gl.drawArrays(dmode, 0, vertexBuffer.numItems);
              context.checkError();
            }
          });
            
        mvPopMatrix();
//        context.checkError();
      });
    },
    
    dispose: function(context) {
      var self = this;
      logger.attempt("Renderable#dispose", function() {
        if (!context) throw new Error("No context given!");
        self.built[context.id] = false;
        disposeBuffer(self, 'GLVertexBuffer', context);
        disposeBuffer(self, 'GLColorBuffer', context);
        disposeBuffer(self, 'GLIndexBuffer', context);
        disposeBuffer(self, 'GLNormalBuffer', context);
        self.originalTextureCoords = null;
        if (self.pickShader && self.pickShader[context.id]) { self.pickShader[context.id].dispose(); self.pickShader[context.id] = false; }
        for (var i = 0; i < self.textures.length; i++)
          for (var bufname in self.textures[i].buffers)
            if (self.textures[i].buffers[bufname])
              self.textures[i].buffers[bufname].dispose();
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
        if (!context) throw new Error("Can't render without a context!");
        self.dispose(context);
        var gl = context.gl;
        self.DRAW_MODE = self.DRAW_MODE || GL_TRIANGLES;
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
        
        if (vertices.length > 0)      self.setGLVertexBuffer(context, new VertexBuffer(context, vertices));
        if (colors.length > 0)        self.setGLColorBuffer(context,  new ColorBuffer(context, colors));
        if (indices.length > 0)       self.setGLIndexBuffer(context,  new ElementArrayBuffer(context, indices));
        if (normals.length > 0)       self.setGLNormalBuffer(context, new NormalBuffer(context, normals));
        self.originalTextureCoords = textureCoords;
        
        // After the object has been built, we need to iterate through any textures that may have been registered
        // with it, and rebuild those too.
        for (var i = 0; i < self.textures.length; i++)
          if (self.textures[i])
            self.setTexture(i, self.textures[i].texture, self.textures[i]);
        
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
Renderable.identifier = 0;

Renderable.PickShader = Class.create({
  initialize:function(context, object_id)
  {
    if (!context) throw new Error("No context given!");
    if (!object_id) throw new Error("No object ID given!");
    
    var color  = encodeToColor(object_id);
    this.shader = context.createShader();
    this.shader.vertex.source = "attribute vec3 aVertexPosition;\n" +
                               "uniform mat4 mvMatrix;\n" +
                               "uniform mat4 pMatrix;\n" +
                               "void main(void) {\n" +
                               "  gl_Position = pMatrix * mvMatrix * vec4(aVertexPosition, 1.0);\n" +
                               "}";
    
    this.shader.fragment.source = "#ifdef GL_ES\n" +
                                 "precision highp float;\n" +
                                 "#endif\n" +
                                 "void main(void) {\n" +
                                 "  gl_FragColor = vec4("+color[0]/255+","+color[1]/255+","+color[2]/255+","+color[3]/255+");\n" +
                                 "}";
    this.shader.compile();
  }
});