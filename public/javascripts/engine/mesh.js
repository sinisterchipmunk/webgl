var Mesh = function() {
  // helpers
  function setColorCoords(self, count, color)
  {
    var colors = [];
    for (var i = 0; i < count; i++)
      for (var j = 0; j < 4; j++)
        colors.push(color[j]);
    return colors;
  }

  function buildTexture(self, context, descriptor) {
    var coords = [];
    for (var i = 0; i < self.originalTextureCoords.length; i += 2)
      coords.push(self.originalTextureCoords[i]*descriptor.scaleX, self.originalTextureCoords[i+1]*descriptor.scaleY);

    if (coords.length != 0)
    {
      descriptor.buffers[context.id] = new TextureCoordsBuffer(coords);
      descriptor.buffers[context.id].valid = true;
    }
  }
  
  function disposeBuffer(self, name, context)
  {
    var buf = self["get"+name]();
    if (buf) {
      if (buf.dispose) buf.dispose();
      // since there's a Buffer object now, this next should never happen - but it's not hurting...
      else context.deleteBuffer(buf);
      self["set"+name](null);
    }
  }
  
  // class
  return Class.create({
    initialize: function(init_func)
    {
      var self = this;
      self.after_render_queue = [];
      
      if (init_func) self.init = init_func;
      
      self.built = {};
      self.buffers = {};
      self.textures = [];
      self.textureBuildQueue = [];
    },
    
    getDefaultShader: function() {
      if (this.texture) return "color_with_texture";
      else return "color_without_texture";
    },
    
    addTexture: function(tex, options) {
      if (!options && tex.texture) { options = tex; tex = tex.texture; }
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
      
      logger.attempt("Mesh#setTexture", function() {
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
    
    getVertexBuffer:        function() { return this.buffers.vertices; },
    getColorBuffer:         function() { return this.buffers.colors;   },
    getIndexBuffer:         function() { return this.buffers.indices;  },
    getNormalBuffer:        function() { return this.buffers.normals;  },
    
    setVertexBuffer:        function(buf) { this.buffers.vertices = buf; },
    setColorBuffer:         function(buf) { this.buffers.colors   = buf; },
    setIndexBuffer:         function(buf) { this.buffers.indices  = buf; },
    setNormalBuffer:        function(buf) { this.buffers.normals  = buf; },
    
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
    
    rebuildAll: function() { this.invalidate(); },
    
    bottom: function() {
      var normal = -this.orientation.getUp();
      return normal.times(this.lowest_point);
    },
    
    lowest: function() { return this.lowest_point; },
    
    render: function(options) {
      var context = options.context, shader = options.shader, mode = options.mode || FILL;
      
      var self = this;
      logger.attempt('Mesh#render', function() {
        if (!context) throw new Error("Cannot render without a context!");
        
        // make sure everything's up to date.
        if (self.texture && self.texture != self.textures[0]) self.setTexture(0, self.texture);
        if (!self.isBuiltFor(context))
          self.rebuild(context);
        
        // get the active shader
        if (typeof(shader) == "string") shader = context.shaders[shader];
        
        options.context = context;
        options.shader = shader;
        options.mode = mode;
        self.draw(options);
            
        for (var i = self.after_render_queue.length-1; i >= 0; i--)
          self.after_render_queue.pop()();
      });
    },
    
    /* just draws the object, ignoring whether the buffers are initialized, object transformations, etc.
       use this to override what happens when rendering while preserving things like orientation.
     */
    draw: function(options) {
      var context = options.context, shader = options.shader, mode = options.mode;
      var self = this;

      if (!shader) throw new Error("Cannot render without a shader!");
      if (typeof(shader) != "object") throw new Error("Shader was expected to be an object, but is: "+JSON.stringify(shader));
      if (!shader.getCompiledProgram) throw new Error("Shader is not dynamic!");
      if (!shader.context) throw new Error("Shader has no context!");
      if (shader.context != context) throw new Error("Tried to render an object using a shader from a different context than the current one! (Try using the name of the shader instead)");
      
      // get the related buffers.
      var vertexBuffer = self.getVertexBuffer(), indexBuffer = self.getIndexBuffer(),
          normalBuffer = self.getNormalBuffer(), colorBuffer = self.getColorBuffer();
              
      // set the shader attributes
      shader.setAttribute('aVertexPosition', vertexBuffer);
      if (indexBuffer)   indexBuffer.bind(context);
      if (normalBuffer)  shader.setAttribute('aVertexNormal', normalBuffer);
      if (colorBuffer)   shader.setAttribute('aVertexColor', colorBuffer);
        
      for (var i = 0; i < self.textures.length; i++) {
        var descriptor = self.textures[i];
        if (descriptor)
        {
          if (!descriptor.buffers[context.id] || !descriptor.buffers[context.id].valid)
            buildTexture(self, context, descriptor);
              
          context.activeTexture(GL_TEXTURES[i]);
          descriptor.texture.bind(context);

          shader.uniform("texture"+i, "uniform1i").value = i;
          shader.setAttribute("texture"+i+"coords", descriptor.buffers[context.id]);
        }
      }
        
      // bind the shader, apply the attributes, and draw the object.
      shader.bind(function() {
        var dmode = options.draw_mode || self.DRAW_MODE;
        if (mode == WIREFRAME) dmode = GL_LINE_STRIP;
            
        if (indexBuffer)
        {
          context.drawElements(dmode, indexBuffer.numItems, GL_UNSIGNED_SHORT, 0);
        }
        else if (vertexBuffer)
        {
          context.drawArrays(dmode, 0, vertexBuffer.numItems);
        }
      });
    },
    
    dispose: function(context) {
      var self = this;
      logger.attempt("Mesh#dispose", function() {
        if (!context) throw new Error("No context given!");
        if (!self.built[context.id]) return; // nothing to dispose
        
        self.built[context.id] = false;
        disposeBuffer(self, 'VertexBuffer', context);
        disposeBuffer(self, 'ColorBuffer',  context);
        disposeBuffer(self, 'IndexBuffer',  context);
        disposeBuffer(self, 'NormalBuffer', context);
        self.buffers = {};
        self.originalTextureCoords = null;
        for (var i = 0; i < self.textures.length; i++)
          for (var bufname in self.textures[i].buffers)
            if (self.textures[i].buffers[bufname])
            {
              self.textures[i].buffers[bufname].dispose();
              self.textures[i].buffers[bufname].valid = false;
            }
      });
    },
    
    // forces this object to be rebuilt for every context.
    invalidate: function() {
      for (var id in this.built) {
        if (this.built[id])
          this.dispose(this.built[id]);
      }
    },
    
    after_render: function(func) {
      this.after_render_queue.push(func);
    },
    
    rebuild: function(context) {
      var self = this;
      logger.attempt("Mesh#rebuild", function() {
        if (!context) throw new Error("Can't rebuild without a context!");
        self.dispose(context);
        var gl = context.gl;
        self.DRAW_MODE = self.DRAW_MODE || GL_TRIANGLES;
        self.built[context.id] = context;
  
        var vertices = [], colors = [], textureCoords = [], normals = [], indices = [];
        if (self.init) self.init(vertices, colors, textureCoords, normals, indices);

        if (self.color) // something has already set the color
          colors = setColorCoords(self, vertices.length / 3, self.color);
        else if (colors.length == 0) // color isn't set, and user didn't set any during init()
        {
          if (!self.getColorBuffer()) // and none are already set
            colors = setColorCoords(self, vertices.length / 3, [1,1,1,1]);
          else ; // color isn't explicitly set, but color vertices exist, so use them.
        }
        
        if (vertices.length > 0)
        {
          self.setVertexBuffer(new VertexBuffer(vertices));
          var i;
          var minx = null, maxx = null, miny = null, maxy = null, minz = null, maxz = null;
          
          for (i = 0; i < vertices.length; i += 3)
            if (minx == null || vertices[i] < minx) minx = vertices[i];
            else if (maxx == null || vertices[i] > maxx) maxx = vertices[i];
          for (i = 1; i < vertices.length; i += 3) {
            if (miny == null || vertices[i] < miny) miny = vertices[i];
            else if (maxy == null || vertices[i] > maxy) maxy = vertices[i];
            if (typeof(self.lowest_point) == "undefined" || vertices[i] < self.lowest_point)
              self.lowest_point = vertices[i];
          }
          for (i = 2; i < vertices.length; i += 3)
            if (minz == null || vertices[i] < minz) minz = vertices[i];
            else if (maxz == null || vertices[i] > maxz) maxz = vertices[i];
          self.size_x = maxx - minx;
          self.size_y = maxy - miny;
          self.size_z = maxz - minz;
        }
        if (colors.length > 0)        self.setColorBuffer(new ColorBuffer(colors));
        if (indices.length > 0)       self.setIndexBuffer(new ElementArrayBuffer(indices));
        if (normals.length > 0)       self.setNormalBuffer(new NormalBuffer(normals));

        self.originalTextureCoords = textureCoords;
        
        // After the object has been built, we need to iterate through any textures that may have been registered
        // with it, and rebuild those too.
        for (var i = 0; i < self.textures.length; i++)
          if (self.textures[i])
            self.setTexture(i, self.textures[i].texture, self.textures[i]);
      });
    }
  });
}();
