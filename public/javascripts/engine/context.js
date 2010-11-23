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
      this.callbacks = { mouse: { moved: [], dragged:[], pressed:[], released:[], over:[], out:[], clicked:[] }};
      if (!this.canvas) throw new Error("Could not find canvas '"+element_or_name+"'");

      this.registerMouseListeners();

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
      
      if (shaders)
        for (var i in shaders) {
          shaders[i].context = this;
        }
      
      logger.info("WebGL context created for "+this.canvas.id);
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clearDepth(1.0);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.depthFunc(this.gl.LEQUAL);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.checkError();
      
      this.startRendering(render_func);
    },
    
    /* Adds the function to the list of callbacks to fire whenever the mouse is moved. */
    onMouseMove:   function(func) { this.callbacks.mouse.moved.push(func); },
    onMouseDrag:   function(func) { this.callbacks.mouse.dragged.push(func); },
    onMousePress:  function(func) { this.callbacks.mouse.pressed.push(func); },
    onMouseRelease:function(func) { this.callbacks.mouse.released.push(func); },
    onMouseIn:     function(func) { this.callbacks.mouse.over.push(func); },
    onMouseOut:    function(func) { this.callbacks.mouse.out.push(func); },
    onMouseClick:  function(func) { this.callbacks.mouse.clicked.push(func); },
    
    buildShader: function(name) {
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
    
    registerMouseListeners: function() {
      var self = this;
      Event.observe(this.canvas, "mousemove", function(event) {
        event = event || {};
        event.source = this;
        mouse.overCanvas = mouse.canvas = mouse.target = self.canvas;
        mouse.context = self;
        mouse.offsetx = mouse.x;
        mouse.offsety = mouse.y;
        mouse.x = event.clientX - self.canvas.cumulativeOffset()[0];
        mouse.y = event.clientY - self.canvas.cumulativeOffset()[1];
		    mouse.y = self.gl.viewportHeight - mouse.y;
        // add scroll offsets
        if (window.pageXOffset)
        {
          mouse.x += window.pageXOffset;
          mouse.y += window.pageYOffset;
        }
        else
        {
          mouse.x += document.body.scrollLeft;
          mouse.y += document.body.scrollTop;
        }
        if (mouse.offsetx)
          mouse.diffx = mouse.x - mouse.offsetx;
        if (mouse.offsety)
          mouse.diffy = mouse.y - mouse.offsety;
        
        if (mouse.down == null)
          for (var i = 0; i < self.callbacks.mouse.moved.length; i++)
            self.callbacks.mouse.moved[i](event);
        else
          for (var i = 0; i < self.callbacks.mouse.dragged.length; i++)
            self.callbacks.mouse.dragged[i](event);
      });
      
      Event.observe(this.canvas, "mouseover", function(event) {
        event = event || {};
        event.source = this;
        for (var i = 0; i < self.callbacks.mouse.over.length; i++)
          self.callbacks.mouse.over[i](event);
      });
      
      Event.observe(this.canvas, "mouseout", function(event) {
        event = event || {};
        event.source = this;
        for (var i = 0; i < self.callbacks.mouse.out.length; i++)
          self.callbacks.mouse.out[i](event);
      });
      
      Event.observe(this.canvas, "click", function(event) {
        event = event || {};
        event.source = this;
        for (var i = 0; i < self.callbacks.mouse.clicked.length; i++)
          self.callbacks.mouse.clicked[i](event);
      });
      
      Event.observe(this.canvas, "mousedown", function(event) {
        event = event || {};
        event.source = this;
        var button = event.which;
        
        mouse.down = mouse.down || {count:0,down:{}};
        button = mouse.down["button"+button] = {at:[mouse.x,mouse.y]};

        for (var i = 0; i < self.callbacks.mouse.pressed.length; i++)
          self.callbacks.mouse.pressed[i](event);
      });
      
      Event.observe(this.canvas, "mouseup", function(event) {
        event = event || {};
        event.source = this;
        mouse.down.count--;
        if (mouse.down.count <= 0)
          mouse.down = null;

        for (var i = 0; i < self.callbacks.mouse.released.length; i++)
          self.callbacks.mouse.released[i](event);
      });
    },
    
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
      
      function render() {
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
        self.renderInterval = setTimeout(render, WebGLContext.render_interval)
      }
      
      self.renderInterval = setTimeout(render, WebGLContext.render_interval);
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
  
  var context = new WebGLContext(canvas);
  context.stopRendering(); // we don't need or want to draw stuff
  
  /* add methods to Context prototype to auto check for errors. */
  for (var method_name in context.gl)
  {
    if (typeof(context.gl[method_name]) == "function")
    {
      var args = "";
      for (var arg = 0; arg < context.gl[method_name].length; arg++)
      {
        if (arg > 0) args += ",";
        args += "arg"+arg;
      }

      var func = "function() {"
               + "  var result;"
               + "  try { "
               + "    result = this.gl."+method_name+".apply(this.gl, arguments);"
               + "    this.checkError();"
               + "  } catch(e) { "
               + "    var args = [], i;"
               + "    for (i = 0; i < arguments.length; i++) args.push(arguments[i]);"
               + "    args = JSON.stringify(args);"
               + "    if (e.stack || (e = new Error(e.toString())).stack) {"
               + "      var stack_array = e.stack.split('\\n').reverse();" // reverse because logger shows newest messages first.
               + "      for (i = 0; i < stack_array.length; i++) logger.error('    '+stack_array[i]);"
               + "    }"
               + "    logger.error('WebGL FAILURE: in call to "+method_name+"<"+context.gl[method_name].length+"> with arguments '+args);"
               + "    throw e;"
//               + "    logger.attempt('"+method_name+"', function() { throw e; });"
               + "  }"
               + "  return result;"
               + "}";

      WebGLContext.prototype[method_name] = eval("("+func+")");
    }
    else
      /* define the GL enums globally so we don't need a context to reference them */
      if (!/[a-z]/.test(method_name)) // no lowercase letters
        window[('GL_'+method_name)] = context.gl[method_name];
  }
  
  // define some values that the iteration above probably didn't catch
  window.GL_MAX_VERTEX_ATTRIBS = context.gl.getParameter(context.gl.MAX_VERTEX_ATTRIBS);
  window.GL_DEPTH_COMPONENT = context.gl.DEPTH_COMPONENT || context.gl.DEPTH_COMPONENT16;
  window.GL_TEXTURES = [];
  for (i = 0; i < 32; i++) window.GL_TEXTURES[i] = context.gl["TEXTURE"+i];
  
  if (temporaryBody)
    $(body).remove();
})();
