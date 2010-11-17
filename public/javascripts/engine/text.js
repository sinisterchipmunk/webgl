var Text = Class.create(Renderable, {
  /*
    Options include:
      lineWidth   - the width, in pixels, of the stroke line.
      text        - the text to be rendered.
      fillStyle   - a string. Defaults to "white". A color or CSS style for the text interior.
      strokeStyle - a string. Defaults to "black". A color or CSS style for the text border.
      font        - a string representing the font name. Defaults to "Verdana".
      size        - a number. Defaults to 16. How many pixels high is this text?
      type        - "3d" or "2d". Defaults to "2d". If "2d", then the Z coordinate is ignored and X and Y are pixel
                    coordinates. Otherwise, the text is treated as any other 3D object with its own orientation and
                    object space.
      update      - a function to call in order to update this text. Defaults to null (none).
      x / left    - the horizontal coordinates of this text.
      y / top     - the vertical coordinates of this text.
      background  - a function to be called which is expected to fill the background of this text. By default, the
                    background is completely transparent.
      scale       - a multiplier which will be used to enlarge the text in 3D mode. Not used in 2D mode. Defaults to
                    1/400.
      enable_alpha - Sometimes it is desireable to keep blending disabled by default, and only enable it when needed.
                     If this value is set to true, blending will be explicitly enabled and the blendFunc will be set
                     to (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA); and after rendering, blending will be explicitly
                     disabled. Obviously, you an also simply enable blending and set the desired blend function
                     system-wide, leaving this option off. The latter setting results in the best performance if you
                     have a lot of text or other objects that require blending. This option defaults to false.
   */
  initialize: function($super, options) {
    var text;
    if (arguments.length == 3) { text = options; options = arguments[2]; }
    else
      if (typeof(options) == "string") {
        text = options;
        options = {};
      } else { text = options.toString(); }
    
    var self = this;

    logger.attempt("text init", function() { 
  
      self.quad = new Quad(1,1);
      self.update       = options.update;
  
      $super();
  
      self.canvas = document.createElement("canvas");
      self.canvas.style.display = "none";
      document.getElementsByTagName("body")[0].appendChild(self.canvas);
      
      self.context      = self.canvas.getContext('2d');
      self.lineWidth    = typeof(options.lineWidth) == "number" ? options.lineWidth : 2.5;
      self.text         = options.text         || text;
      self.fillStyle    = options.fillStyle    || "white";
      self.strokeStyle  = options.strokeStyle  || "black";
      self.textAlign    = options.textAlign    || "center";
      self.textBaseline = options.textBaseline || "middle";
      self.font         = options.font         || "Verdana";
      self.size         = options.size         || 16;
      self.type         = options.type         || "2d";
      self.scale        = typeof(options.scale) == "number" ? options.scale : 1.0 / 400.0;
      self.enable_alpha = typeof(options.enable_alpha) == "undefined" ? false : options.enable_alpha;
      self.align        = {};
      self.align.x      = options.align && options.align.x || "center";
      self.align.y      = options.align && options.align.y || "center";
      if (self.type != "3d" && self.type != "2d") throw new Error("Invalid type: "+self.type+"; expected one of '2d' or '3d'");
      
      self.left = options.left || options.x || 0;
      self.top  = options.top  || options.y || 0;
      
      self.orientation.moveTo(self.left, self.top, 0);
  
      self.checkSize();
      self.background();
      self.draw2d();
      self.texture = new CanvasTexture(self.canvas);
      self.background = options.background || self.background;
      
      self.startUpdating();
    });
    this.mesh.addTexture(self.texture);
  },
  
  background: function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  
  init: function(verts, colors, texes, normals, indices) {
    this.quad.mesh.init(verts, colors, texes, normals, indices);
    this.draw_mode = this.quad.draw_mode;
  },
  
  applyMatrices: function(options) {
    if (this.type == "2d")
    {
      this.orientation.ortho(options.context.gl);
      
      pMatrix = this.orientation.getProjectionMatrix();
      loadIdentity();
      var pos = this.orientation.getPosition();
      mvTranslate(pos[0], pos[1], pos[2]);
      /* why doesn't this work?! actually it seems to invert X and Y. Strange. */
//      mvMatrix = this.orientation.getMatrix();
    }
    else
    {
      mvMatrix = mvMatrix.x(this.orientation.getMatrix());
    }
  } ,
  
  draw: function($super, options) {
    if (this.mesh)
    {
      if (!this.mesh.isValid() && this.type == "3d")
      {
        /*
          we need to find the correlation between font canvas width/height ratio and the 3d width/height ratio. Then
          we need to scale the quad by that amount. This will allow us to maintain font dimensions in 3D.
         */
        var rat3d = parseFloat(options.context.gl.viewportWidth) / parseFloat(options.context.gl.viewportHeight);
        var rat2d = parseFloat(this.canvas.width) / parseFloat(this.canvas.height);
        var size = this.size * this.scale;
        
        this.quad.setSize(size / rat3d * rat2d, size);
      }
      
      if (this.enable_alpha)
      {
        options.context.enable(GL_BLEND);
        options.context.blendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
      }
      
      if (this.type == "2d") {
        var x = this.getHorizontalAlignment(), y = this.getVerticalAlignment();
        mvTranslate(x,y,-1);
//        mvTranslate(this.quad.width/2.0,this.quad.height/2.0,-1);
        options.context.disable(GL_DEPTH_TEST);
        this.mesh.render(options);
        options.context.enable(GL_DEPTH_TEST);
      }
      else
        this.mesh.render(options);
      
      if (this.enable_alpha)
        options.context.disable(GL_BLEND);
    }
  },
  
  getHorizontalAlignment: function() {
    switch(this.align.x) {
      case "left":            return  this.quad.width/2.0;
      case "right":           return -this.quad.width/2.0;
      case "center":          return 0;
      default: throw new Error("Invalid horizontal alignment: "+this.align.x+" (expected 'left', 'right', 'center')");
    }
  },
  
  getVerticalAlignment: function() {
    switch(this.align.y) {
      case "bottom":           return  this.quad.height/2.0;
      case "top":              return -this.quad.height/2.0;
      case "center":           return 0;
      default: throw new Error("Invalid vertical alignment: "+this.align.y+" (expected 'top', 'bottom', 'center')");
    }
  },
  
  /*
    options include:
      draw: whether to redraw the text before refreshing the GL texture. Defaults to true.
   */
  refresh: function(options) {
    var draw = !options || (typeof(options.draw) == "undefined" ? true : options.draw);
    if (draw)
    {
      this.checkSize();
      this.background();
      this.draw2d();
    }
    
    this.texture.update();
  },
  
  draw2d: function() {
    var text = this.text;
    var ctx  = this.context;
    var left = this.canvas.width / 2;
    var top = parseFloat(this.size+this.lineWidth*2) / 2.0;
//    var top  = this.canvas.height/ 2;
    var lines = this.text.split("\n");
    for (var i = 0; i < lines.length; i++) {
      text = lines[i];
      ctx.strokeText(text, left, top);
      ctx.fillText(text, left, top);
      top += parseFloat(this.size+this.lineWidth*2);
    }
  },
  
  checkSize: function() {
    var text = this.text;
    var ctx  = this.context;
    var lines = text.split("\n");
        
    ctx.fillStyle = this.fillStyle;
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.strokeStyle;
    ctx.font = this.size+"px "+this.font;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    var width = 0;
    for (var i = 0; i < lines.length; i++)
    {
      var w = parseFloat(ctx.measureText(lines[i]).width) + this.lineWidth*2;
      if (w > width) width = w;
    }
    if (width != parseFloat(this.canvas.width))
    {
      var original_width = this.canvas.width, original_height = this.canvas.height;
      var height = parseFloat(this.size+this.lineWidth*2) * lines.length;
      var c2 = document.createElement("canvas");
      
      c2.width  = width;
      c2.height = height;
      var ctx2 = c2.getContext("2d");
      ctx2.scale(width/original_width, height/original_height);
      ctx2.drawImage(this.canvas, 0, 0);
      
      this.canvas.width = width;
      this.canvas.height = height;
      this.context = ctx = this.canvas.getContext("2d");

      ctx.fillStyle = this.fillStyle;
      ctx.lineWidth = this.lineWidth;
      ctx.strokeStyle = this.strokeStyle;
      ctx.font = this.size+"px "+this.font;
      ctx.textAlign = this.textAlign;
      ctx.textBaseline = this.textBaseline;
      
      if (this.type == "2d")
        this.quad.setSize(this.canvas.width, this.canvas.height);
      this.invalidate();
    }
  }
});
