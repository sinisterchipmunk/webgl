function Camera(options)
{
  var default_options = {
    lock_up_vector: false,
    lock_y_axis:    false
  };
  options = options || default_options;
  
  var self = this;
  var view     = [0,0,-1];
  var position = [0,0,0];
  var up       = [0,1,0];
  var right    = view.cross(up).normalize();
  var matrix   = Matrix.I(4);
  var pmatrix = null;
  matrix.setLookAt(position, view, up, right);
  
  self.callbacks = self.callbacks || {
    matrices_changed: function() { self.fireCallbacks('matrices'); },
    orientation_changed: function() { self.fireCallbacks('orientation'); },
    position_changed: function(pos, vec) { self.fireCallbacks('position', [pos, vec]); }
  };

  self.lock_up_vector = options.lock_up_vector || default_options.lock_up_vector;
  self.lock_y_axis    = options.lock_y_axis    || default_options.lock_y_axis;

  self.getProjectionMatrix = function() { return pmatrix; };
  self.getMatrix   = function() { return matrix;   };
  self.getView     = function() { return view;     };
  self.getUp       = function() { return up;       };
  self.getPosition = function() { return position; };
  self.getRight    = function() { return right;    };
  self.getFrustum  = function() { return self.frustum = self.frustum || new Frustum(self.getMatrix(), self.getProjectionMatrix()); };
  
  self.setPosition = function(vec, y, z) {
    if (typeof(vec) == "number") vec = [vec, y, z];
    if (self.callbacks && self.callbacks.position_changed) self.callbacks.position_changed(position, vec);
    position = vec;
    self.look();
    return self;
  };

  self.setView = function(vec, y, z) {
    if (typeof(vec) == "number") vec = [vec, y, z];
    view  = vec.normalize();
    right = view.cross(up).normalize();
    up    = right.cross(view).normalize();
    self.look();
    self.callbacks.orientation_changed();
    return self;
  };
  
  self.setUp = function(vec, y, z) {
    if (typeof(vec) == "number") vec = [vec, y, z];
    up = vec.normalize();
    right = view.cross(up).normalize();
    view = up.cross(right).normalize();
    self.look();
    self.callbacks.orientation_changed();
    return self;
  };
  
  self.setRight = function(vec, y, z) {
    if (typeof(vec) == "number") vec = [vec, y, z];
    right = vec.normalize();
    view = up.cross(right).normalize();
    up = right.cross(view).normalize();
    self.look();
    self.callbacks.orientation_changed();
    return self;
  };
  
  /* Updates the Camera's internal matrix to ensure that it is currently "looking" at the correct position
     and that it has the correct orientation. Returns the Camera itself.
     
     If gl is specified, this Camera will apply its matrix transformations to the given WebGL context.
   */
  self.look = function(gl) {
    matrix.setLookAt(position, view, up, right, self.callbacks.matrices_changed);
    if (gl) self.lookGL(gl);
    return self;
  };
  
  /* this Camera will apply its matrix transformations to the given WebGL context *without* updating its
     internal matrix.
   */
  self.lookGL = function(gl) {
    setMatrix(matrix);
    if (!pmatrix) self.perspective(gl);
    setPMatrix(pmatrix);
    if (!self.frustum.upToDate) self.frustum.fireListeners('update');
  };
  
  /*
     options can include the following:
       unit: true or false. If true, scale will be set to {left:-1,bottom:-1,right:1,top:1,near:0.1,far:200}
       scale: values for viewport size:
          left  : leftmost coord
          top   : topmost coord
          bottom: bottom-most coord
          right : rightmost coord
          near  : nearest (positive) coord
          far   : most-distant coord
   */
  self.ortho = function(gl, options) {
    if (!gl) throw new Error("No WebGL context given!");
    if (gl.gl) gl = gl.gl;
    options = options || {};
    if (options.unit) {
      options.left   = typeof(options.left)   != "undefined" ? options.left   : -1;
      options.top    = typeof(options.top)    != "undefined" ? options.top    :  1;
      options.bottom = typeof(options.bottom) != "undefined" ? options.bottom : -1;
      options.right  = typeof(options.right)  != "undefined" ? options.right  :  1;
    }
    else {
      options.left   = typeof(options.left)   != "undefined" ? options.left   : -(gl.viewportWidth/2.0);
      options.top    = typeof(options.top)    != "undefined" ? options.top    :   gl.viewportHeight/2.0;
      options.bottom = typeof(options.bottom) != "undefined" ? options.bottom : -(gl.viewportHeight/2.0);
      options.right  = typeof(options.right)  != "undefined" ? options.right  :   gl.viewportWidth/2.0;
    }
    options.near = options.near || 0.1;
    options.far  = options.far  || 200;

    pmatrix = makeOrtho(options.left, options.right, options.bottom, options.top, options.near, options.far);
    self.fireCallbacks('matrices');
  };
  
  self.perspective = function(gl, options)
  {
	if (gl.gl) gl = gl.gl;
    if (!options) options = {};
    
    options.fov  = options.fov  || 45;
    options.near = options.near || 0.1;
    options.far  = options.far  || 200.0;
    options.ratio = options.ratio || (parseFloat(gl.viewportWidth) / parseFloat(gl.viewportHeight));
    
    if (!gl) throw new Error("No WebGL context given!");
    if (gl.gl) gl = gl.gl;
    pmatrix = makePerspective(options.fov, options.ratio, options.near, options.far);
    self.fireCallbacks('matrices');
  };
  
  /* Explicitly sets this Camera's orientation. This is a dangerous function, because it does NOT do any
     calculations. So you must first manually verify that viewVec, upVec and rightVec are all at right angles to
     one another, that they are relative to positionVec, and that they are normalized.
     
     rightVec is optional and will default to the cross product of view and up.
     positionVec is optional and will default to the Camera's current position.
   */
  self.orient = function(viewVec, upVec, rightVec, positionVec) {
    view = viewVec.normalize();
    up = upVec.normalize();
    right = (rightVec || view.cross(up)).normalize();
    if (self.callbacks && self.callbacks.orientation_changed) self.callbacks.orientation_changed();
    if (positionVec)
      if (self.callbacks && self.callbacks.position_changed) self.callbacks.position_changed(position, positionVec);
    position = positionVec || position;
    self.look();
    return self;
  };
  
  self.addListener = self.addCallback = function(name, func) {
    self.callbacks[name] = self.callbacks[name] || [];
    self.callbacks[name].push(func);
  };
  
  self.fireCallbacks = function(name, args) {
    if (self.callbacks[name])
    {
      for (var i = 0; i < self.callbacks[name].length; i++)
      {
        self.callbacks[name][i](args);
      }
    }
  };
  
  
  function updateFrustum() {
    if (self.frustum)
    {
      self.frustum.setMatrices(self.getMatrix(), self.getProjectionMatrix());
      return self.frustum;
    }
    self.frustum = new Frustum(self.getMatrix(), self.getProjectionMatrix());
    return self.frustum;
  }
  self.addListener("matrices", updateFrustum);
}

/* Sets the view to point at the specified position in world space. Up and right vectors are automatically
   recalculated; you should set these explicitly using #orient if you need a specific orientation.
 */
Camera.prototype.lookAt = function(vec, y, z) {
  if (typeof(vec) == "number") vec = [vec, y, z];
  var new_view = vec.minus(this.getPosition());
  this.setView(new_view);
  this.look();
  this.getFrustum().update();
  return this;
};

// Converts screen coordinates into a ray segment with one point at the NEAR plane and the other
// at the FAR plane relative to the camera's current matrices.
// Code adapted from gluUnproject(), found at http://www.opengl.org/wiki/GluProject_and_gluUnProject_code
Camera.prototype.unproject = function(context, winx, winy, winz) {
  if (typeof(winx) != "number" || typeof(winy) != "number") { throw new Error("one or both of Context / X / Y is missing"); }

  // winz is either 0 (near plane), 1 (far plane) or somewhere in between.
  // if it's not given a value we'll produce coords for both.
  if (typeof(winz) == "number") {
    winx = parseFloat(winx);
    winy = parseFloat(winy);
    winz = parseFloat(winz);
  
    var inf = [];
    var mm = this.getMatrix(), pm = this.getProjectionMatrix();
    var viewport = [0, 0, context.gl.viewportWidth, context.gl.viewportHeight];

    //Calculation for inverting a matrix, compute projection x modelview; then compute the inverse
    var m = pm.multiply(mm).inverse();

    // Transformation of normalized coordinates between -1 and 1
    inf[0]=(winx-viewport[0])/viewport[2]*2.0-1.0;
    inf[1]=(winy-viewport[1])/viewport[3]*2.0-1.0;
    inf[2]=2.0*winz-1.0;
    inf[3]=1.0;

    //Objects coordinates
    var out = m.multiply($V(inf)).elements;
    if(out[3]==0.0)
       return null;

    out[3]=1.0/out[3];
    return [out[0]*out[3], out[1]*out[3], out[2]*out[3]];
  }
  else
  {
    return [this.unproject(context, winx, winy, 0), this.unproject(context, winx, winy, 1)];
  }
};

/* Rotates the view vector of this Camera, effectively "turning" to look in a new direction. This is very useful
   when linked with mouse coordinates, or joystick axes, for instance.
   
   amount_x effectively rotates up and down.
   amount_y effecitvely rotates right and left.
   amount_z effectively "twists" clockwise or counterclockwise. This value is optional, and defaults to 0.
 */
Camera.prototype.rotateView = function(amount_x, amount_y, amount_z) {
  if (typeof(amount_x) != "number") { amount_y = amount_x[1]; amount_z = amount_x[2]; amount_x = amount_x[0]; }
  
  amount_y = -amount_y; //because user is expecting positive y to rotate right, not left.
  amount_z = amount_z || 0;

  var up = this.getUp(), view = this.getView(), right = this.getRight();
  
  if (amount_x != 0) // up & down
  {
    view = view.rotate(amount_x, right);
    if (!this.lock_up_vector) up = right.cross(view).normalize();
  }
  
  if (amount_y != 0) // left & right
  {
    view = view.rotate(amount_y, up);
    right = view.cross(up).normalize();
  }
  
  if (amount_z != 0) // clockwise / counterclockwise
  {
    up = up.rotate(amount_z, view);
    right = view.cross(up).normalize();
  }
  
  view = view.normalize();
  
  if (this.lock_up_vector)
  {
    // prevent view from rotating too far
    // FIXME: I really hate these hard numbers, but I can't figure out a better way to detect this. Seems to work, in
    // any case, but it may fail if amount_x is too high.
    var angle = Math.acos(view.dot(up)) - 0.05;
    if (angle != 0)
    {
      if (angle >= 3 - 0.05) angle = -angle;
      angle /= Math.abs(angle); // we want 1 or -1
      this.last_angle = this.last_angle || angle;
      if (angle != this.last_angle && amount_x != 0) return this.rotateView(-amount_x, 0, 0);
      else this.last_angle = angle;
    }
  }
  
  this.orient(view, up, right);
  this.look();
  this.getFrustum().update();
//  if (self.callbacks && self.callbacks.orientation_changed) self.callbacks.orientation_changed();
  return this;
};

/* Moves left or right, in relation to the supplied vector or in relation to the camera's current orientation */
Camera.prototype.strafe = function(distance, vec, y, z)
{
  if (typeof(vec) == "number") vec = [vec, y, z];
  else if (!vec) vec = this.getView();
  
  var direction = vec.cross(this.getUp()).normalize();
  if (this.lock_y_axis) direction[1] = 0;
  direction = direction.times(distance);
  
  this.setPosition(this.getPosition().plus(direction));
  this.look();
  this.getFrustum().update();
  return this;
};

/* Moves forward or back, in relation to the supplied vector or in relation to the camera's current orientation. */
Camera.prototype.move = function(distance, vec, y, z)
{
  if (typeof(vec) == "number") vec = [vec, y, z];
  else if (!vec) vec = this.getView();

  var direction = vec.normalize();
  if (this.lock_y_axis) direction[1] = 0;
  direction = direction.multiply(distance);
  
  this.setPosition(this.getPosition().plus(direction));
  this.look();
  this.getFrustum().update();
  return this;
};

/* Resets the position and orientation of this camera. This is the same as reloading the identity matrix
   glLoadIdentity(), and it also resets this camera's position, up, view and right vectors.
 */
Camera.prototype.reset = function()
{
  var view     = [0,0,-1];
  var position = [0,0,0];
  var up       = [0,1,0];
  var right    = view.cross(up).normalize();
  
  this.orient(view, up, right);
  this.setPosition(position);
  this.look(); // update the matrix with these values
  this.getFrustum().update();
  return this;
};

/* Translates the camera's current coordinates to the specified world position, ignoring its local axes.
   The right, up and view vectors remain the same, since they are relative to the camera's position.
  
   This method ignores the state of #lock_y_axis.
*/
Camera.prototype.moveTo = function(vec, y, z)
{
  if (typeof(vec) == "number") vec = [vec, y, z];
  this.setPosition(vec);
  this.getMatrix().setTranslateTo(vec, this.callbacks.matrices_changed);
  return this;
};

/* Translates the camera's current coordinates by the supplied amount, relative to its current orientation.
   For instance, if it is translated 0, 1, 0 (one unit on the positive Y axis), that will be converted into
   "one unit towards the up vector". Use #moveTo(camera.getPosition().plus(translation)) if you want to translate
   relative to worldspace (ignoring the right, up and view vectors).
  
   The right, view and up vectors are not modified by this method, because they are relative to the camera's
   position.
  
   This method ignores the state of #lock_y_axis
*/
Camera.prototype.translate = function(vec, y, z)
{
  if (typeof(vec) == "number") vec = [vec, y, z];
  var right = this.getRight();
  var up = this.getUp();
  var view = this.getView();
  var position = this.getPosition();
  var translation = position.plus(right.times(vec[0]).plus(up.times(vec[1]).plus(view.times(vec[2]))));
  
  this.setPosition(translation);
  this.getMatrix().setTranslateTo(translation, this.callbacks.matrices_changed);
  return this;
};

/* Aliases. */
Camera.prototype.translateTo = Camera.prototype.moveTo;
Camera.prototype.loadIdentity = Camera.prototype.reset;
