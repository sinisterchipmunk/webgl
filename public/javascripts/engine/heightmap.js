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
    var x, z;
    for (x = 0; x < self.width(); x += 1)
    {
      // in order to use triangle strips with a single buffer...
      // first we draw DOWN the z-axis...
      for (z = 0; z < self.depth(); z++)
      {
        callback(x, z);
        callback(x+1, z);
      }
        
      // then we draw back UP it. Draw this on paper and you'll see why.
      x += 1;
      for (z = self.depth()-1; z >= 0; z--)
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
      options = options || {};
    
      this.image = image;
      this.magnitude = options.magnitude || 1;
      this.scale  = options.scale  || 1;
      buildData(this); // force an immediate build of this.data
    
      $super();
    },
    
    lowest:  function() { return this.data.lowest;  },
    highest: function() { return this.data.highest; },
    width:   function() { return this.data.width;   },
    depth:   function() { return this.data.depth;   },
    
    height:  function(x, z) {
      if (typeof(x) != "number" || typeof(z) != "number") { throw new Error("both x and z are required to calculate height"); }
      return this.data.map[z * this.width() + x] * this.magnitude;
    },
    
    init: function(vertices, colors, textureCoords, normals, indices) {
      var y, self = this;
      buildData(self); // because image data may have changed. TODO don't do this if image / options haven't changed
      
      self.DRAW_MODE = GL_TRIANGLE_STRIP;
        
      each_vertex(self, function(x, z) {
        y = self.height(x, z);
        vertices.push(x*self.scale, y, z*self.scale);
        
        y -= self.data.lowest;
        y = (y / (self.data.highest - self.data.lowest) / 2) + 0.5;
        colors.push(y, y, y, 1);
        
        textureCoords.push(x/self.width(), z/self.depth());
      });

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
