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
function HeightMap(gl, image, options)
{
  var self = this;
  var vertexBuffer = null;
  var colorBuffer = null;
  var min_height, max_height;
  var textureBuffers = [];
  options = options || {};
  
  // private helper function for iterating through all vertices (in the order they will be rendered)
  function each_vertex(callback) {
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

  self.magnitude = options.magnitude || 1.0;
  self.scale     = options.scale || 1.0;
  self.gl        = gl;
  
  self.minHeight = function() { return min_height; };
  self.maxHeight = function() { return max_height; };
  self.width = function() { return image.width;  };
  self.depth = function() { return image.height; };
  self.height = function(x, z) {
    if (typeof(x) != "number" || typeof(z) != "number") { throw("both x and z are required to calculate height"); }
    return self.data[z * self.width() + x] * self.magnitude;
  };
  
  self.release = function() {
    self.gl.deleteBuffer(vertexBuffer);
    self.gl.deleteBuffer(colorBuffer);
    for (var i = 0; i < textureBuffers.length; i++) self.gl.deleteBuffer(textureBuffers[i]);
    textureBuffers = [];
  };
  
  /* valid options include: 
      scale  - how many times this texture will be tiled over the object. Defaults to 1.
      scaleX - just like scale, but is only applied horizontally.
      scaleY - just like scale, but is only applied vertically.
   */
  self.addTexture = function(texture, options)
  {
    options.scale = options.scale || 1;
    options.scaleX = options.scaleX || options.scale;
    options.scaleY = options.scaleY || options.scale;
    
    var buffer = self.gl.createBuffer();
    textureBuffers.push(buffer);
    
    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, buffer);
    
    var textureData = [];
    each_vertex(function(x, z) {
      textureData.push((x)/self.width()*options.scaleX, (z)/self.depth()*options.scaleY);
    });
    buffer.texture = texture;
    buffer.itemSize = 2;
    buffer.numItems = textureData.length / 2;
    assert_equal(buffer.numItems, vertexBuffer.numItems);
    
    self.gl.bufferData(self.gl.ARRAY_BUFFER, new Float32Array(textureData), gl.STATIC_DRAW);
  };
  
  self.rebuild = function(new_image, options) {
    if (vertexBuffer) self.release();
    if (new_image) { image = new_image; self.data = HeightMap.normalize(HeightMap.load(image)); }
    options = options || {};
    self.magnitude = options.magnitude || self.magnitude;
    self.scale     = options.scale || self.scale;
        
    var colors = [];
    var vertices = [];
    try {
      var x, y, z, c;

      min_height = max_height = null;
      for (x = 0; x < self.data.length; x++)
      {
        min_height = min_height || self.data[x];
        max_height = max_height || self.data[x];
        if (min_height > self.data[x]*self.magnitude) min_height = self.data[x]*self.magnitude;
        if (max_height < self.data[x]*self.magnitude) max_height = self.data[x]*self.magnitude;
      }
            
      each_vertex(function(x, z) {
        var y = self.height(x, z);
        vertices.push(x*self.scale, y, z*self.scale);

        y -= min_height;
        y = (y / (max_height - min_height) / 2) + 0.5;
        colors.push(y, y, y, 1);
      })
    } catch(e) { alert(e); throw(e); }
    
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexBuffer.itemSize = 3;
    vertexBuffer.numItems = vertices.length/3;
    
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;
    colorBuffer.numItems = colors.length / 4;
    
    assert_equal(vertexBuffer.numItems, colorBuffer.numItems);
  };
  
  // mode is an optional render mode such as FILL, WIREFRAME, etc. and defaults to FILL.
  self.render = function(mode) {
    try {
      var self = this;
      var gl = self.gl;
  
      mode = mode || FILL;
  
      var shaderProgram;
      if (textureBuffers.length > 0)
      {
        useShader('color_with_texture');
        setMatrixUniforms();
        shaderProgram = shaders['color_with_texture'];
        for (var i = 0; i < textureBuffers.length && i < 32; i++) // 32 is max supported by GL
        {
          gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffers[i]);
          gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, textureBuffers[i].itemSize, gl.FLOAT, false, 0, 0);

          gl.activeTexture(eval("gl.TEXTURE"+i));  
          gl.bindTexture(gl.TEXTURE_2D, textureBuffers[i].texture);  
          gl.uniform1i(shaderProgram.samplers[i], i);
        }
      }
      else
      {
        useShader('color_without_texture');
        shaderProgram = shaders['color_without_texture'];
      }
  
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
          
      if (mode == FILL)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numItems);
      else if (mode == WIREFRAME)
        gl.drawArrays(gl.LINE_STRIP, 0, vertexBuffer.numItems);
    }
    catch (e) {
      alert(e+"\n\n"+(e.stack || "(no further information available)"));
    }
  };
  
  self.rebuild(image);
}

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
  canvas.width = image.width;
  canvas.height = image.height;
  var context = HeightMap.context();
  context.drawImage(image, 0, 0);
  var image_data = context.getImageData(0, 0, image.width, image.height);
  
  return image_data;
};