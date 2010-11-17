var MouseWeight = Class.create(Renderable, {
  initialize: function($super, world, options) {
    options = options || (world && (world.segments || world.radius) ? world : {});
    if (options.world) world = options.world;
    
    this.world = world;
    this.segments = options.segments || 32;
    this.radius   = options.radius   || 100;
    this.sensitivity = options.sensitivity ||10;
    this.xsize    = options.xsize    || 10;
    this.magnitude = {x:0, y:0};
    this.x = world.context.gl.viewportWidth / 2.0;
    this.y = world.context.gl.viewportHeight / 2.0;
    this.speed = Math.PI/4;
    this.cursor = {};
    this.cursor.out_of_bounds = options.cursor && options.cursor.out_of_bounds || "none";
    this.cursor.suspended = options.cursor && options.cursor.suspended || "default";
    this.outer_color = options.outer_color || [1,0.5,0.5,0.15];
    this.inner_color = options.inner_color || [0.5,1,0.5,0.5];
    this.x_color = options.x_color || [1,1,1,0.5];
    this.invert = typeof(options.invert) == "undefined" ? false : options.invert;
    this.suspended = false;
    
    $super();
  },
  
  init: function(verts, colors) {
    this.draw_mode = GL_LINES;//_STRIP;
    var theta, increment = Math.PI*2 / this.segments;
    var cos, sin, cos2, sin2;
    var i;
    
    this.updateX(verts);
    for (i = 0; i < 4; i++)
      colors.push(this.x_color[0], this.x_color[1], this.x_color[2], this.x_color[3]);
    
    for (i = 0; i < this.segments; i++) {
      theta = increment * i;
      cos = Math.cos(theta);
      sin = Math.sin(theta);
      cos2 = Math.cos(theta+increment);
      sin2 = Math.sin(theta+increment);
      
      
      verts.push(cos * this.radius, sin * this.radius, 0);
      verts.push(cos2* this.radius, sin2* this.radius, 0);
      colors.push(this.outer_color[0], this.outer_color[1], this.outer_color[2], this.outer_color[3]);
      colors.push(this.outer_color[0], this.outer_color[1], this.outer_color[2], this.outer_color[3]);
      
      // sensitivity ring
      verts.push(cos * this.sensitivity, sin * this.sensitivity, 0);
      verts.push(cos2* this.sensitivity, sin2* this.sensitivity, 0);
      colors.push(this.inner_color[0], this.inner_color[1], this.inner_color[2], this.inner_color[3]);
      colors.push(this.inner_color[0], this.inner_color[1], this.inner_color[2], this.inner_color[3]);
    }
  },
  
  render: function($super, options) {
    if (this.suspended) return;
    $super(options);
  },
  
  applyMatrices: function(options) {
    loadIdentity();
    mvTranslate(0,0,-1);
    var w = options.context.gl.viewportWidth / 2.0;
    var h = options.context.gl.viewportHeight / 2.0;
    pMatrix = makeOrtho(-w, w, -h, h, 0.01, 250);
  },
  
  updateX: function(buf) {
    var xsize = this.xsize / 2.0;
    var x = this.x, y = this.y;
    var gl = this.world.context.gl;
    
    y = gl.viewportHeight - y;
    x -= gl.viewportWidth / 2.0;
    y -= gl.viewportHeight / 2.0;
    
    // cap values at 1.0 magnitude
    // first find normal from origin
    var normal = [x,y].normalize();
    
    // multiply by radius to get extreme values
    var nx1 = normal[0] * this.radius, nx2 = normal[0] * this.sensitivity;
    var ny1 = normal[1] * this.radius, ny2 = normal[1] * this.sensitivity;
    
    // check values against extremes
    if (nx1 > 0 && x > nx1) x = nx1;
    if (nx1 < 0 && x < nx1) x = nx1;
    if (ny1 > 0 && y > ny1) y = ny1;
    if (ny1 < 0 && y < ny1) y = ny1;
    if (nx2 > 0 && x < nx2) x = 0;
    if (nx2 < 0 && x > nx2) x = 0;
    if (ny2 > 0 && y < ny2) y = 0;
    if (ny2 < 0 && y > ny2) y = 0;
    
    if ((x == 0 || mouse.x - gl.viewportWidth / 2.0 == x) &&
        (y == 0 || (gl.viewportHeight - mouse.y) - gl.viewportHeight / 2.0 == y))
      this.world.context.canvas.style.cursor = 'none';
    else
      this.world.context.canvas.style.cursor = this.cursor.out_of_bounds;
    
    this.magnitude.x = parseFloat(x) / parseFloat(this.radius);
    this.magnitude.y = parseFloat(y) / parseFloat(this.radius);
    
    buf[0] = x - xsize; buf[ 1] = y - xsize; buf[ 2] = 0;
    buf[3] = x + xsize; buf[ 4] = y + xsize; buf[ 5] = 0;
    buf[6] = x + xsize; buf[ 7] = y - xsize; buf[ 8] = 0;
    buf[9] = x - xsize; buf[10] = y + xsize; buf[11] = 0;
  },
  
  update: function(tc) {
    if (this.suspended) {
      this.world.context.canvas.style.cursor = this.cursor.suspended;
      return;
    }
    
    var buf = this.mesh.getVertexBuffer();
    if (buf && mouse && mouse.context && mouse.context == this.world.context
            && (mouse.x != this.x || mouse.y != this.y)) {
      this.x = mouse.x;
      this.y = mouse.y;

      this.updateX(buf.js);
      buf.refresh();
    }
    
    this.world.camera.rotateView((this.invert ? -1 : 1) * this.magnitude.y * this.speed * tc,
                                  this.magnitude.x * this.speed * tc, 0);
  }
});
