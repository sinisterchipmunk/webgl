var Renderable = function() {
  function getPickShader(self, context) {
    if (!context) throw new Error("no context given!");
    if (self.pickShader && self.pickShader[context.id]) return self.pickShader[context.id];
    if (!self.pickShader) self.pickShader = {};
    self.pickShader[context.id] = new Renderable.PickShader(context, self.object_id).shader;
    
    return self.pickShader[context.id];
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
    initialize: function(attributes)
    {
      if (typeof(attributes) == "function")
      {
        attributes = {init:attributes};
        if (arguments.length == 2 && typeof(arguments[1]) == "function") attributes.update = arguments[1]; 
      }
      
      attributes = attributes || {};
      if (attributes.init) this.init = attributes.init;
      if (attributes.update) this.update = attributes.update;
      
      var self = this;
      logger.attempt("Renderable#initialize", function() {
        self.after_render_queue = [];
        self.object_id = ++Renderable.identifier;
        Renderable.all.push(self);
      
        self.mesh = new Mesh(function() { self.init && self.init.apply(self, arguments); });
        self.orientation = new Camera();
        self.pickShader = false;
        self.textures = [];
        self.textureBuildQueue = [];
      
        var ori = attributes.orientation;
        if (ori && (ori.view || ori.up || ori.position || ori.right))
        {
          var view  = ori.view     || self.orientation.getView();
          var up    = ori.up       || self.orientation.getUp();
          var right = ori.right    || self.orientation.getRight();
          var pos   = ori.position || self.orientation.getPosition();
          self.orientation.orient(view, up, right, pos);
        }
      
        self.scale = attributes.scale || 1;
      });
    },
    
    getDefaultShader: function() {
      return this.shader || this.mesh.getDefaultShader();
    },

    rebuildPickShader: function(context, index) {
      if (!context) throw new Error("No context given!");
      this.object_id = typeof(index) == "undefined" || index == null ? this.object_id : index;
      if (this.pickShader && this.pickShader[context.id]) this.pickShader[context.id].dispose();
      this.pickShader[context.id] = false;
      return getPickShader(this, context);
    },
    
    render: function(options) {
      var self = this;
      if (options.id) options = {context:options}; // backward compatibility

      logger.attempt("Renderable#render", function() {
        if (options.createShader) options = {context:options};
        if (!options.context) throw new Error("no context given!");
        if (self.update && !self.updateInterval) self.rebuild(options.context);
        
        options.mode = options.mode || FILL;
        mvPushMatrix();
          applyObjectSpaceMatrixTransformations(self);
  
          if (options.mode == RENDER_PICK && !options.shader) options.shader = getPickShader(self, options.context);
          else options.shader = options.shader || self.getDefaultShader();
  
          self.draw(options);
            
        mvPopMatrix();
          
        for (var i = self.after_render_queue.length-1; i >= 0; i--)
          self.after_render_queue.pop()();
      });
    },
    
    /* just draws the object, ignoring whether the buffers are initialized, object transformations, etc.
       use this to override what happens when rendering while preserving things like orientation.
     */
    draw: function(options) {
      options.draw_mode = options.draw_mode || this.DRAW_MODE;
      if (this.mesh) { 
        this.mesh.render(options);
      }
    },
    
    dispose: function(context) {
      var self = this;
      logger.attempt("Renderable#dispose", function() {
        if (!context) throw new Error("No context given!");
        if (self.pickShader && self.pickShader[context.id]) { self.pickShader[context.id].dispose(); self.pickShader[context.id] = false; }
        if (self.mesh) self.mesh.dispose(context);
      });
    },
    
    // forces this object to be rebuilt for every context.
    invalidate: function() {
      if (this.updateInterval) clearInterval(this.updateInterval);
      this.updateInterval = null;
      if (this.mesh) this.mesh.invalidate();
    },
    
    after_render: function(func) {
      this.after_render_queue.push(func);
    },
    
    rebuild: function(context) {
      var self = this;
      logger.attempt("Renderable#rebuild", function() {
        if (!context) throw new Error("Can't rebuild without a context!");
        
        self.dispose(context);
        var previousUpdate = new Date();
        self.updateInterval = setInterval(function() {
          if (self.update)
          {
            logger.attempt("update", function() {
              var currentTime = new Date();
              var timechange = currentTime - previousUpdate;
              previousUpdate = currentTime;
              self.update(timechange / 1000);
            });
          }
        }, Renderable.update_interval);
      });
    },
    
    rebuildAll: function() { this.invalidate(); }
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
    this.shader = context.buildShader();
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