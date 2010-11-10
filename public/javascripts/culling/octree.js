var Octree = (function() {
  var FRONT_TOP_LEFT = 1, FRONT_TOP_RIGHT = 2, FRONT_BOTTOM_LEFT = 3, FRONT_BOTTOM_RIGHT = 4,
      BACK_TOP_LEFT  = 5, BACK_TOP_RIGHT  = 6, BACK_BOTTOM_LEFT  = 7, BACK_BOTTOM_RIGHT  = 8;
  
  function objPosition(obj) { return obj.orientation ? obj.orientation.getPosition() : obj.position; }
  
  function delegateObjectToNode(self, obj)
  {
    // first figure out which quadrant the object is in. We'll use just its position for this.
    
    // FIXME since we're going solely on position, this means some octree nodes can overlap when
    // an object close to one edge has triangles that cross that edge, and the opposite octree
    // has its own object with triangles crossing the boundary in the reverse direction.
    //           o =>|
    //             |<= o
    
    var quadrant = self.quadrantForPoint(objPosition(obj));
    
    
    // then add the object to the node in that quadrant.
    self.nodes[quadrant].addObject(obj);
  }
  
  function objectSize(obj)
  {
    var vertices = obj.mesh ? obj.mesh.getVertexBuffer().js : obj.vertices;
    if (vertices.length == 0) { logger.info("no size!"); return [0,0,0]; }
    var right = null, left = null, top = null, bottom = null, front = null, back = null;
    for (var i = 0; i < vertices.length; i += 3)
    {
      var x = vertices[i], y = vertices[i+1], z = vertices[i+2];
      if (right == null || right < x) right = x;
      if (left  == null || left  > x) left  = x;
      if (top   == null || top   < y) top   = y;
      if (bottom== null || bottom> y) bottom= y;
      if (front == null || front < z) front = z;
      if (back  == null || back  > z) back  = z;
    }
    return [right-left, top-bottom, front-back];
  }
  
  function recalculateNodeSize(node)
  {
    var right = null, left = null, top = null, bottom = null, front = null, back = null;
    var r, l, t, b, f, z;
    var pos, i;
    var p = node.position;
    if (node.objects)
    {
      for (i = 0; i < node.objects.length; i++)
      {
        pos = objPosition(node.objects[i]);
        var size = objectSize(node.objects[i]);
        r = pos[0] + size[0];
        l = pos[0] - size[0];
        t = pos[1] + size[1];
        b = pos[1] - size[1];
        f = pos[2] + size[2];
        z = pos[2] - size[2];
        
        if (right == null) { right = r; left = l; top = t; bottom = b; front = f; back = z; }
        else
        {
          right = Math.max(right, r); left = Math.min(left, l); top = Math.max(top, t);
          bottom= Math.min(bottom,b); front= Math.max(front,f); back= Math.min(back,z);
        }
      }
    }
//    else if (node.nodes)
//    {
//      for (i in node.nodes)
//      {
//        var n = node.nodes[i];
//        pos = n.position;
//        r = pos[0]+n.width /2.0;
//        l = pos[0]-n.width /2.0;
//        t = pos[1]+n.height/2.0;
//        b = pos[1]-n.height/2.0;
//        f = pos[2]+n.depth /2.0;
//        z = pos[2]-n.depth /2.0;
//        if (r > right) right = r;
//        if (l < left)  left  = l;
//        if (t > top)   top   = t;
//        if (b < bottom)bottom= b;
//        if (f > front) front = f;
//        if (z < back)  back  = z;
//      }
//    }
    
    var width = right - left, height = top - bottom, depth = front - back;
    if (width != node.width || height != node.height || depth != node.depth) {
      node.width  = right - left;
      node.height = top - bottom;
      node.depth  = front - back;
      
      // we also need to reset the node position so it's at the center of the new dimensions.
      node.position[0] = left   + node.width / 2.0;
      node.position[1] = bottom + node.height/ 2.0;
      node.position[2] = back   + node.depth / 2.0;
    
      node.callbacks.fire("size_changed");
    }
  }
  
  function subdivide(self)
  {
    var objs = self.max_objects;
    var lvls = self.max_levels - 1;
    self.nodes = {};
    self.nodes[FRONT_TOP_LEFT]   = new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[1,0,0,1]});
    self.nodes[FRONT_TOP_RIGHT]  = new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[0,1,0,1]});
    self.nodes[FRONT_BOTTOM_LEFT]= new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[0,0,1,1]});
    self.nodes[FRONT_BOTTOM_RIGHT]=new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[1,1,0,1]});
    self.nodes[BACK_TOP_LEFT]    = new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[0,1,1,1]});
    self.nodes[BACK_TOP_RIGHT]   = new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[1,0,1,1]});
    self.nodes[BACK_BOTTOM_LEFT] = new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[1,0.5,0.5,1]});
    self.nodes[BACK_BOTTOM_RIGHT]= new Octree({max_objects:objs,max_levels:lvls,level:self.level+1,color:[0.5,1,0.5,1]});
  }
  
  var klass = Class.create({
    /* Options may include any of the following:
         max_objects: a number representing how many objects can be added to this octree. If this threshold is exceeded,
                      the octree will be subdivided and its objects will be sorted into its nodes. Defaults to 8.
         max_levels : a number representing how many sublevels this octree may contain. max_levels trumps max_objects
                      such that if max_levels has been reached, max_objects may be exceeded. Defaults to 8.
     */
    initialize: function(options) {
      var self = this;
      options = options || {};
      this.nodes = null;
      this.position = [0,0,0];
      this.level = options.level || 1;
      this.width = this.height = this.depth = 0;
      this.max_levels  = typeof(options.max_levels) == "undefined" ? 8 : options.max_levels;
      this.max_objects = typeof(options.max_objects)== "undefined" ? 8 : options.max_objects;
      this.objects = [];
      this.color = options.color;
      this.callbacks = {
        fire: function(name) {
          if (self.callbacks[name])
            for (var i = 0; i < self.callbacks[name].length; i++)
              self.callbacks[name][i]();
        },
        size_changed: []
      };
      
      if (options.callbacks && options.callbacks.size_changed) this.callbacks.size_changed.push(options.callbacks.size_changed);
      
      /* an octree's "position" is the calculated center of its width, height and depth -- so this is useless because
         it will be replaced as soon as the first object is added. */
//      if (options.position) {
//        this.position[0] = options.position[0];
//        this.position[1] = options.position[1];
//        this.position[2] = options.position[2];
//      }
    },
    
    isSubdivided: function() { return !!this.nodes; },
    
    /*
      Returns a number representing the quadrant this point appears in, with this Octree's position as the origin.
      The return value is one of the predefined quadrant identifiers: FRONT_TOP_LEFT, BACK_BOTTOM_RIGHT, etc.
    */
    quadrantForPoint: function(point) {
      if (point[0] > this.position[0]) {
        if (point[1] > this.position[1]) {
          if (point[2] > this.position[2]) return FRONT_TOP_RIGHT;
          else                             return BACK_TOP_RIGHT;
        } else {
          if (point[2] > this.position[2]) return FRONT_BOTTOM_RIGHT;
          else                             return BACK_BOTTOM_RIGHT;
        }
      } else {
        if (point[1] > this.position[1]) {
          if (point[2] > this.position[2]) return FRONT_TOP_LEFT;
          else                             return BACK_TOP_LEFT;
        } else {
          if (point[2] > this.position[2]) return FRONT_BOTTOM_LEFT;
          else                             return BACK_BOTTOM_LEFT;
        }
      }
    },
    
    /*
      At a minimum, options must contain 'context'. It may also contain any of the following:
        shader: a Shader object, default null. A shader to be used for all objects in place of their normal shaders.
        render_octree:   boolean, default false. If true, the edges of the octree will be rendered.
        render_objects:  boolean, default true. If false, the objects within this node will not be rendered.
        frustum: the instance of Frustum to check nodes against. If omitted, defaults to context.world.camera.frustum.
     */
    render: function(options) {
      if (!this.normalized) this.normalize();
      if (!options.context) throw new Error("A context is required!");
      
      var frustum = options.frustum || options.context.world.camera.frustum;
      if (!frustum) throw new Error("A frustum is required!");
      
      if (typeof(options.render_objects) == "undefined") options.render_objects = true;
      
      var visibility;
      if (this.isSubdivided())
        for (var id in this.nodes)
        {
          if (this.nodes[id].isSubdivided() || this.nodes[id].objects.length > 0)
          {
            visibility = frustum.cube(this.nodes[id].position, this.nodes[id].width, this.nodes[id].height, this.nodes[id].depth);
            if (visibility == Frustum.INTERSECT)
              this.nodes[id].render(options);
            else if (visibility == Frustum.INSIDE)
              this.nodes[id].renderObjects(options);
          }
        }
      else this.renderObjects(options);
      
      /* render the octree, if requested */
      if (options.render_octree) this.getRenderable().render(options);
    },
    
    /* Returns all objects associated with this octree (or its nodes) that are currently visible in the given frustum.
       The individual objects are not tested; only subnodes. Therefore, if there are no subnodes, all objects will be
       returned regardless of whether they are visible.
    */
    getVisible: function(frustum) {
      if (!this.normalized) this.normalize();

      var visibility;
      var all = [], i;
      if (this.isSubdivided()) {
        for (var id in this.nodes)
        {
          if (this.nodes[id].isSubdivided() || this.nodes[id].objects.length > 0)
          {
            visibility = frustum.cube(this.nodes[id].position, this.nodes[id].width, this.nodes[id].height, this.nodes[id].depth);

            if (visibility == Frustum.INTERSECT)
              all = all.concat(this.nodes[id].getVisible(frustum));
            else if (visibility == Frustum.INSIDE)
              all = all.concat(this.nodes[id].objects);
          }
        }
      } else {
        all = all.concat(this.objects);
      }
      return all;
    },
    
    /*
      Renders all objects within this octree. Child nodes will not be rendered regardless of options, but the objects
      within them will be.
     */
    renderObjects: function(options) {
      /* TODO make a decision whether we should frustum cull objects individually. Right now I'd say no. */
      var i;
      
      if (options.render_objects)
      {
        for (i = 0; i < this.objects.length; i++)
          this.objects[i].render(options);
        if (this.isSubdivided())
        {
          for (i in this.nodes)
            this.nodes[i].renderObjects(options);
        }
      }
    },
    
    numLevels: function() {
      if (!this.normalized) this.normalize();
      if (this.isSubdivided())
      {
        var count = 0;
        for (var i in this.nodes)
          count = Math.max(count, this.nodes[i].numLevels());
        return count+1;
      }
      
      return 1;
    },
    
    addObject: function(obj) {
      /* invalidate the octree, because its bounds are no longer accurate and it may need to be subdivided. */
      this.normalized = false;
      
      /* TODO add a position listener to the object so that non-static objects can be used */
      this.objects.push(obj);
    },
    
    normalize: function() {
      recalculateNodeSize(this);

      if (this.objects.length >= this.max_objects && this.max_levels > 0)
        subdivide(this);
      
      /* handle any objects added after subdivision */
      if (this.isSubdivided())
      {
        var i;
        for (i = this.objects.length-1; i >= 0; i--)
          delegateObjectToNode(this, this.objects.pop());
        for (i in this.nodes)
          this.nodes[i].normalize();
      }

      this.normalized = true;
    },
    
    getRenderable: function() {
      if (this.renderable) return this.renderable;
      
      var self = this;
      
      var renderable = new Renderable({
        init: function(vertices, colors, texc, norms, indices) {
          var w = self.width / 2.0, h = self.height / 2.0, d = self.depth / 2.0;
          renderable.draw_mode = GL_LINES;
          
          /* edges */
          vertices.push(-w, -h, -d); vertices.push(-w,  h, -d);
          vertices.push( w, -h, -d); vertices.push( w,  h, -d);
          vertices.push(-w, -h,  d); vertices.push(-w,  h,  d);
          vertices.push( w, -h,  d); vertices.push( w,  h,  d);
          vertices.push(-w, -h, -d); vertices.push(-w, -h,  d);
          vertices.push( w, -h, -d); vertices.push( w, -h,  d);
          vertices.push(-w,  h, -d); vertices.push(-w,  h,  d);
          vertices.push( w,  h, -d); vertices.push( w,  h,  d);
          vertices.push(-w, -h, -d); vertices.push( w, -h, -d);
          vertices.push(-w,  h, -d); vertices.push( w,  h, -d);
          vertices.push(-w, -h,  d); vertices.push( w, -h,  d);
          vertices.push(-w,  h,  d); vertices.push( w,  h,  d);
          
          /* and a small star at the node center */
          vertices.push(-0.05, -0.05, 0);
          vertices.push( 0.05,  0.05, 0);
          vertices.push(-0.05,  0.05, 0);
          vertices.push( 0.05, -0.05, 0);
          vertices.push( 0,     0,   -0.05);
          vertices.push( 0,     0,    0.05);
        },
        
        update: null
      });
      
      self.renderable = renderable;
      self.renderable.orientation.setPosition(self.position);
      self.callbacks.size_changed.push(function() {
        self.renderable.invalidate();
        self.renderable.orientation.setPosition(self.position);
      });
      if (self.color) { self.renderable.mesh.setColor(self.color); }
      
      return renderable;
    }
  });
  
  klass.FRONT_TOP_LEFT     = FRONT_TOP_LEFT;
  klass.FRONT_TOP_RIGHT    = FRONT_TOP_RIGHT;
  klass.FRONT_BOTTOM_LEFT  = FRONT_BOTTOM_LEFT;
  klass.FRONT_BOTTOM_RIGHT = FRONT_BOTTOM_RIGHT;
  klass.BACK_TOP_LEFT      = BACK_TOP_LEFT;
  klass.BACK_TOP_RIGHT     = BACK_TOP_RIGHT;
  klass.BACK_BOTTOM_LEFT   = BACK_BOTTOM_LEFT;
  klass.BACK_BOTTOM_RIGHT  = BACK_BOTTOM_RIGHT;
  
  return klass;
}());
 