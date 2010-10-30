var WebGLContext = function() {

  function disableShaderAttributes(self) {
    for (var i = 0; i < GL_MAX_VERTEX_ATTRIBS; i++)
      self.gl.disableVertexAttribArray(i);
    self.checkError();
  }

  return Class.create({
    /*
      The first argument is the canvas or ID of the canvas from which the WebGL context will be extracted.
      
      The second argument is an object whose property names are the names of the shaders which will be used,
      and whose property values are instances of Shader(). This is not an explicitly required argument, but
      other objects will expect at least a minimal set of shaders before they can be rendered.
      
      render_func is optional and will be passed to #startRendering.
    */
    initialize: function(element_or_name, shaders, render_func)
    {
      this.id = ++WebGLContext.identifier;
      this.canvas = $(element_or_name);
      if (!this.canvas) throw new Error("Could not find canvas '"+element_or_name+"'");
      try {
        this.gl = this.canvas.getContext("experimental-webgl");
        this.gl.context = this;
        this.gl.canvas = this.canvas;
        this.gl.viewportWidth = this.canvas.width;
        this.gl.viewportHeight = this.canvas.height;
      }
      catch(e) { }
      if (!this.gl) throw new Error("WebGL could not be initialized!");

      WebGLContext.mostRecent = this;
      //this.frame_count = 0;
      this.renderInterval = null;
      this.shaders = shaders || [];
      this.world = new World(this);
      
      if (shaders) for (var i in shaders) { shaders[i].context = this; }
      
      logger.info("WebGL context created for "+this.canvas.id);
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clearDepth(1.0);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);
      this.checkError();
      
      this.startRendering(render_func);
    },
    
    createShader: function(name) {
      var shader = new Shader();
      shader.context = this;
      if (name) shaders[name] = shader;
      return shader;
    },
    
    checkError: function() {
      if (typeof(RELEASE) != "undefined" && RELEASE) return;
      var error = this.gl.getError();
      if (error != this.gl.NO_ERROR)
      {
        var str = "GL error in "+this.canvas.id+": "+error;
        var err = new Error(str);
        var message = err;
        if (err.stack)
        {
          var stack = err.stack.split("\n");
          stack.shift();
          message += "\n\n"+stack.join("\n");
        }
        if (logger) logger.error(message);
        else alert(message);
        throw err;
      }
    },

    isRendering: function() { return this.renderInterval != null; },
    
    /* Sets the render interval. If already rendering, the current one will be cleared and a new one will be set.
       Takes an optional render_func parameter, which will be called as part of the render process. If omitted and
       a render function already exists, the current one will be used. Note that the render_func argument is
       assigned to this.render, so you can also just replace that function. It's usually unnecessary to call
       #startRendering directly.
       
       If no render function exists and none is supplied, it is simply delegated to this.world.render().
       
       This WebGLContext is passed as an argument to the render_func.
     */
    startRendering: function(render_func) {
      var self = this;
      if (self.isRendering()) self.stopRendering();
      self.render = render_func || self.render || function() { self.world.render(); };
      
      self.renderInterval = setInterval(function() {
        logger.attempt(self.canvas.id+":render", function() {
          if (self.renderBlocking) return;
          try {
            self.useShader('color_without_texture');
          
            //self.frame_count += 1;
    
            self.gl.viewport(0, 0, self.gl.viewportWidth, self.gl.viewportHeight);
            self.gl.clear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
            perspective(45, self.gl.viewportWidth / self.gl.viewportHeight, 0.1, 200.0);
            loadIdentity();
      
            if (self.render) self.render(self);
            
            self.checkError();
          } catch(e) {
            self.renderBlocking = true;
            throw e;
          }
        });
      }, WebGLContext.render_interval);
    },
    stopRendering: function() {
      if (this.isRendering()) clearInterval(this.renderInterval);
      this.renderInterval = null;
    },
    
    /* Forces use of a particular Shader until further notice. Note that #pushShader is preferred over this. */
    useShader: function(name) {
      var context = this;
      var gl = context.gl;
      var shaders = context.shaders;
    
      if (!name) throw new Error("No shader or shader name given!");
      if (name.context && name.context != this) throw new Error("Tried to use a shader from a different context!");
      if (name.getCompiledProgram) name = name.getCompiledProgram();
      if ((name != this.activeShaderName && name != this.activeShader) || !this.activeShader)
      {
        this.checkError();
        disableShaderAttributes(this);
        this.checkError();
        if (typeof(name) == "string")
        {
          if (shaders[name] == null) throw new Error("Shader named '"+name+"' was not found");
          //if (shaders[name].isDisposed()) throw new Error("Shader named '"+name+"' has been disposed!");
          this.activeShaderName = name;
          this.activeShader = shaders[name];
          if (this.activeShader.context)
            gl.useProgram(this.activeShader.getCompiledProgram());
          else
            gl.useProgram(this.activeShader);
          this.checkError();
        }
        else
        {
          this.activeShaderName = null;
          this.activeShader = name;
          gl.useProgram(name);
          this.checkError();
        }
      }
      return this.activeShader;
    },
    
    
    /* Temporarily sets the shader, and resets it when finished.
       
       Ex:
        pushShader(function() { useShader(aNewShader); do some stuff });
        // activeShader == previous shader
        
        pushShader(aNewShader, function() { do some stuff });
        // activeShader == previous shader
    */
    pushShader: function(newShader, func)
    {
      // "push"
      var oldShader = this.activeShader;
      if (typeof(newShader) == "function") { func = newShader; }
      else this.useShader(newShader);

      // callback
      func();

      // "pop"
      this.useShader(oldShader);
    }
  });
}();

/* Target number of milliseconds to wait before rendering the next frame. 1000 divided by this number equals frames per
   second. */
WebGLContext.render_interval = 15;

/* internal use - used to set a unique value to context.id */
WebGLContext.identifier = 0;

(function() {
  var i;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('id', "temporary internal use");
  canvas.style.display = "block";
  var body = document.getElementsByTagName("body")[0], temporaryBody = false;
  if (!body)
  {
    temporaryBody = true;
    body = document.createElement('body');
    document.getElementsByTagName("html")[0].appendChild(body);
  }
  document.getElementsByTagName("body")[0].appendChild(canvas);
//  alert(document.root);
//  document.root.appendChild(canvas);
  var context = new WebGLContext(canvas);
  context.stopRendering();
  
  /* define the GL enums globally so we don't need a context to reference them */
  window.GL_UNSIGNED_BYTE = context.gl.UNSIGNED_BYTE;
  window.GL_FLOAT = context.gl.FLOAT;
  window.GL_TEXTURE_2D = context.gl.TEXTURE_2D;
  window.GL_FRAGMENT_SHADER = context.gl.FRAGMENT_SHADER;
  window.GL_VERTEX_SHADER = context.gl.VERTEX_SHADER;
  window.GL_COLOR_BUFFER_BIT = context.gl.COLOR_BUFFER_BIT;
  window.GL_DEPTH_BUFFER_BIT = context.gl.DEPTH_BUFFER_BIT;
  window.GL_TRIANGLE_STRIP = context.gl.TRIANGLE_STRIP;
  window.GL_TRIANGLES = context.gl.TRIANGLES;
  window.GL_LINE_STRIP = context.gl.LINE_STRIP;
  window.GL_LINES = context.gl.LINES;
  window.GL_ELEMENT_ARRAY_BUFFER = context.gl.ELEMENT_ARRAY_BUFFER;
  window.GL_TEXTURE0 = context.gl.TEXTURE0;
  window.GL_UNSIGNED_SHORT = context.gl.UNSIGNED_SHORT;
  window.GL_RGB = context.gl.RGB;
  window.GL_RGBA = context.gl.RGBA;
  window.GL_TEXTURE_MAG_FILTER = context.gl.TEXTURE_MAG_FILTER;
  window.GL_LINEAR = context.gl.LINEAR;
  window.GL_LINEAR_MIPMAP_NEAREST = context.gl.LINEAR_MIPMAP_NEAREST;
  window.GL_TEXTURE_MIN_FILTER = context.gl.TEXTURE_MIN_FILTER;
  window.GL_ARRAY_BUFFER = context.gl.ARRAY_BUFFER;
  window.GL_STATIC_DRAW = context.gl.STATIC_DRAW;
  window.GL_STREAM_DRAW = context.gl.STREAM_DRAW;
  window.GL_MAX_VERTEX_ATTRIBS = context.gl.getParameter(context.gl.MAX_VERTEX_ATTRIBS);
  window.GL_RENDERBUFFER = context.gl.RENDERBUFFER;
  window.GL_FRAMEBUFFER = context.gl.FRAMEBUFFER;
  window.GL_DEPTH_COMPONENT = context.gl.DEPTH_COMPONENT || context.gl.DEPTH_COMPONENT16;
  window.GL_DEPTH_COMPONENT16 = context.gl.DEPTH_COMPONENT16;
  window.GL_BLEND = context.gl.BLEND;
  window.GL_TEXTURES = [];
  for (i = 0; i < 32; i++) window.GL_TEXTURES[i] = context.gl["TEXTURE"+i];
  
  if (temporaryBody)
    $(body).remove();
})();
