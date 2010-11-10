/* Simple height map implementation for WebGL.

  properties:
    data      - the height indices themselves. All are between 0 and 1.
    magnitude - a multiplier for the height values. The default magnitude is 1.
    scale     - a multiplier for the width and depth of the map. The default scale is 1.
    gl        - the WebGL context this height map is bound to.

  methods:
    width()   - the width of this height map, equal to the width of the image in pixels.
    depth()   - the depth of this height map, equal to the height of the image in pixels.
    rebuild() - rebuilds the various internal WebGL buffers which represent this height map. Call this
                after modifying the height data. Takes an optional argument representing the image data
                to replace the current data with. If not specified, the current height data will be used.
                Also takes an optional options argument, which may have magnitude and/or scale. These
                default to the current magnitude and scale.
 */
var HeightMap = function() {
  // private helper function for iterating through all vertices (in the order they will be rendered)
  function each_vertex(self, callback) {
    if (!self.image) return;
    var x, z, width = self.width(), depth = self.depth();
    for (x = 0; x < width-1; x += 1)
    {
      // in order to use triangle strips with a single buffer...
      // first we draw DOWN the z-axis...
      for (z = 0; z < depth; z++)
      {
        callback(x, z);
        callback(x+1, z);
      }
        
      // then we draw back UP it. Draw this on paper and you'll see why.
      x += 1;
      if (x < width-1)
        for (z = depth-1; z >= 0; z--)
        {
          callback(x+1, z);
          callback(x, z);
        }
    }
  }
  
  function buildData(self)
  {
    logger.attempt("building height map", function() {
      if (!self.image) throw new Error("No image data!");
      var x;
      self.data = {};
      self.data.map = HeightMap.normalize(HeightMap.load(self.image));
      self.data.width = self.image.width;
      self.data.depth = self.image.height;
  
      for (x = 0; x < self.data.map.length; x++) {
        var height = self.data.map[x] * self.magnitude;
        self.data.lowest = self.data.lowest || height;
        self.data.highest= self.data.highest|| height;
        if (self.data.lowest > height)  self.data.lowest = height;
        if (self.data.highest < height) self.data.highest = height;
      }
    });
  }
  
  return Class.create(Renderable, {
    initialize: function($super, image, options) {
      var self = this;
      options = options || {};
    
      this.magnitude = options.magnitude || 1;
      this.scale  = options.scale  || 1;
      this.segment_size = options.segment_size || 40;
      this.segments = [];
      /* TODO segments should probably be an instance of a real class. */
      this.segments.getRenderable = function() {
        if (this.renderable) return this.renderable;
        var hm = self;
        var size = hm.segment_size;
        var segms = this;
        var renderable = this.renderable = new Renderable({
          init: function(vertices, colors) {
            this.draw_mode = GL_LINES;
            for (var i = 0; i < segms.length; i++)
            {
              var center = segms[i].center;
              var w = size / 2.0, h = hm.magnitude / 2.0, d = size / 2.0;
              var tlb = [center[0]-w, center[1]+h, center[2]-d];
              var trb = [center[0]+w, center[1]+h, center[2]-d];
              var blb = [center[0]-w, center[1]-h, center[2]-d];
              var brb = [center[0]+w, center[1]-h, center[2]-d];
              var tlf = [center[0]-w, center[1]+h, center[2]+d];
              var trf = [center[0]+w, center[1]+h, center[2]+d];
              var blf = [center[0]-w, center[1]-h, center[2]+d];
              var brf = [center[0]+w, center[1]-h, center[2]+d];
              
              var lines = [tlb,trb,  trb,brb,  brb,blb,  blb,tlb,
                           tlf,trf,  trf,brf,  brf,blf,  blf,tlf,
                           tlb,tlf,  trb,trf,  brb,brf,  blb,blf
              ];
              for (var j = 0;  j < lines.length; j++)
              {
                vertices.push(lines[j][0], lines[j][1], lines[j][2]);
                colors.push(1,1,0,1);
              }
            }
          }
        });
        return renderable;
      };
      
      if (typeof(image) == "string") {
        var img = new Image();
        img.onload = function() {
          self.image = img;
          self.rebuildAll();
          if (self.onload) logger.attempt("HeightMap#onload", function() { self.onload(); });
        };
        img.src = image;
      }
      else
      {
        self.image = image;
        if (image.complete) self.rebuildAll();
        image.onload = function() { self.rebuildAll(); }
      }
    
      $super();
    },
    
    getVisibleVertices: function(frustum) {
      var visible = [];
      var height = this.magnitude;
      for (var i = 0; i < this.segments.length; i++)
        if (this.segments[i].length > 0 && frustum.cubeVisible(this.segments[i].center, this.segment_size, height, this.segment_size))
          visible = visible.concat(this.segments[i]);
      return visible;
    },
    
    updateObjectPosition: function(world, object, oldPosition, newPosition) {
      var self = this;
      
      if (object.lowest())
      {
        // TODO extrapolate this along up, right and view vectors. object.bottom() may be of some help for that.
        if (newPosition[0] < 0) newPosition[0] = 0;
        if (newPosition[0] > this.width()) newPosition[0] = this.width();
        if (newPosition[2] < 0) newPosition[2] = 0;
        if (newPosition[2] > this.depth()) newPosition[0] = this.depth();
        newPosition[1] = this.height(parseInt(newPosition[0] / this.scale), parseInt(newPosition[2] / this.scale))*this.scale - object.lowest();
        if (isNaN(newPosition[1])) newPosition[1] = 0;
      }
      else
        // not available? means vertex data hasn't initialized yet; need to retry after render.
        this.after_render(function() { self.updateObjectPosition(world, object, oldPosition, newPosition); });
    },
    
    lowest:  function() { return this.data.lowest;  },
    highest: function() { return this.data.highest; },
    width:   function() { return this.data.width;   },
    depth:   function() { return this.data.depth;   },
    
    height:  function(x, z) {
      if (typeof(x) != "number" || typeof(z) != "number") { throw new Error("both x and z are required to calculate height"); }
      return this.data.map[z * this.width() + x] * this.magnitude;
    },
    
    draw: function($super, options) {
      $super(options);
      if (this.render_segments)
        this.segments.getRenderable().render(options);
    },
    
    getHorizontalSegmentCount: function() {
      return this.getSegmentIndex(this.width()) + 1;
    },
    
    getVerticalSegmentCount: function() {
      return this.getSegmentIndex(this.depth()) + 1;
    },
    
    getSegmentIndex: function(i) {
      return Math.round(parseFloat(i) / parseFloat(this.segment_size));
    },
    
    getSegment: function(x, z) {
      x = this.getSegmentIndex(x);
      z = this.getSegmentIndex(z);
      
      var index = x * this.getVerticalSegmentCount() + z;
      
      if (this.segments[index]) return this.segments[index];
      this.segments[index] = [];
      var size = this.segment_size / 2.0;
      this.segments[index].center = [(x * this.segment_size) + size, this.magnitude / 2.0, (z * this.segment_size) + size];
      
      return this.segments[index];
    },
    
    init: function(vertices, colors, textureCoords, normals, indices) {
      var y, self = this;
      if (self.image) buildData(self); // TODO don't do this if image / options haven't changed
      
      self.draw_mode = GL_TRIANGLE_STRIP;
      
      each_vertex(self, function(x, z) {
        y = self.height(x, z);
        if (isNaN(y)) alert(x+" "+z+" / "+self.width()+" "+self.depth());
        vertices.push(x*self.scale, y, z*self.scale);
                
        y -= self.data.lowest;
        y = (y / (self.data.highest - self.data.lowest) / 2) + 0.5;
        colors.push(y, y, y, 1);
        
        textureCoords.push(x/self.width(), z/self.depth());
      });
      
      var v0 = [vertices[0],vertices[1],vertices[2]], v1 = [vertices[3],vertices[4],vertices[5]];
      for (var i = 6; i < vertices.length; i += 3)
      {
        var v2 = [vertices[i],vertices[i+1],vertices[i+2]];

        var segment = self.getSegment(v0[0], v0[2]);
        segment.push(v0[0], v0[1], v0[2]);
        segment.push(v1[0], v1[1], v1[2]);
        segment.push(v2[0], v2[1], v2[2]);
        
        v0 = v1;
        v1 = v2;
      }
      
      self.triangles = vertices;  

      assert_equal(vertices.length / 3, colors.length / 4);
      assert_equal(vertices.length / 3, textureCoords.length / 2);
    }
  });
}();

HeightMap.normalize = function(map)
{
  var data = new Array();
  
  for (var x = 0; x < map.width; x++)
  {
    for (var y = 0; y < map.height; y++)
    {
      var offset = y*map.width+x;
      var r = map.data[offset*4];
      var g = map.data[offset*4+1];
      var b = map.data[offset*4+2];
      //var a = map.data[i*4+3];
      
      var average = (r + g + b) / 3;
      data[offset] = average / 255.0;
    }
  }
  
  return data;
};

HeightMap.canvas = function()
{
  if (HeightMap.canvas_element) return HeightMap.canvas_element;
  
  HeightMap.canvas_element = document.createElement('canvas');
  HeightMap.canvas_element.style.visibility = "hidden";
  HeightMap.canvas_element.style.border = "1px solid #000";
  HeightMap.canvas_element_context = HeightMap.canvas_element.getContext('2d');
  document.body.appendChild(HeightMap.canvas_element);
  
  return HeightMap.canvas_element;
};

HeightMap.context = function()
{
  HeightMap.canvas();
  return HeightMap.canvas_element_context;
};

HeightMap.load = function(image)
{
  var canvas = HeightMap.canvas();
  canvas.width  = image.width;
  canvas.height = image.height;
  var context = HeightMap.context();
  context.drawImage(image, 0, 0);
  var image_data;
  try {
    image_data =  context.getImageData(0, 0, image.width, image.height);
  } catch (e) {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
    image_data = context.getImageData(0, 0, image.width, image.height);
  }
  
  return image_data;
};
