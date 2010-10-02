var Sphere = Class.create(Renderable, {
  initialize: function($super, radius) {
    this.radius = radius;
    $super();
  },
  
  init: function(vertices, colors, textureCoords, normals, indices) {
    var self = this;
    self.shader = shaders['color_without_texture'];
    
    var slices = 30, stacks = 30;
    var slice, stack;
    for (slice = 0; slice <= slices; slice++) {
      var theta = slice * Math.PI / slices;
      var sinth = Math.sin(theta);
      var costh = Math.cos(theta);
    
      for (stack = 0; stack <= stacks; stack++) {
        var phi = stack * 2 * Math.PI / stacks;
        var sinph = Math.sin(phi);
        var cosph = Math.cos(phi);
      
        var x = cosph * sinth;
        var y = costh;
        var z = sinph * sinth;
        var u = 1 - (stack / stacks);
        var v = 1 - (slice / slices);
      
        normals.push(x);
        normals.push(y);
        normals.push(z);
        textureCoords.push(u);
        textureCoords.push(v);
        vertices.push(self.radius * x);
        vertices.push(self.radius * y);
        vertices.push(self.radius * z);
        colors.push(1);
        colors.push(1);
        colors.push(1);
        colors.push(1);
      }
    }
  
    for (slice = 0; slice < slices; slice++) {
      for (stack = 0; stack < stacks; stack++) {
        var first = (slice * (stacks + 1)) + stack;
        var second = first + stacks + 1;
        indices.push(first);
        indices.push(second);
        indices.push(first+1);
        indices.push(second);
        indices.push(second+1);
        indices.push(first+1);
      }
    }
  }
});
/*
function Sphere(radius, gl)
{
  var self = this;
  self.object_id = ++Sphere.identifier;
  
  self.orientation = new Camera();
  var vertexBuffer = null, textureBuffer = null, colorBuffer = null, indexBuffer = null, normalBuffer = null;
  
  var slices = 30, stacks = 30;
  var vertices = [], colors = [], textureCoords = [], normals = [], indices = [];
  var pickShader;
  
  
  function getPickShader() {
    if (pickShader) return pickShader;
    var color = encodeToColor(self.object_id);
    pickShader = new Shader();
    pickShader.vertex.source = "attribute vec3 aVertexPosition;\n" +
                               "uniform mat4 uMVMatrix;\n" +
                               "uniform mat4 uPMatrix;\n" +
                               "void main(void) {\n" +
                               "  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
                               "}";
    pickShader.fragment.source = "#ifdef GL_ES\n" +
                                 "precision highp float;\n" +
                                 "#endif\n" +
                                 "void main(void) {\n" +
                                 "  gl_FragColor = vec4("+color[0]/255+","+color[1]/255+","+color[2]/255+","+color[3]/255+");\n" +
                                 "}";
    
    pickShader.setUniformValue('uMVMatrix', function() { return new Float32Array(mvMatrix.flatten()); });
    pickShader.setUniformValue('uPMatrix',  function() { return new Float32Array(pMatrix.flatten());  });
    
    return pickShader;
  }
  
  self.rebuildPickShader = function(index)
  {
    self.object_id = typeof(index) == "undefined" || typeof(index) == "null" ? self.object_id : index;
    if (pickShader) pickShader.dispose();
    pickShader = false;
    return getPickShader();
  };
  
  this.getWidth  = function() { return width;  };
  this.getHeight = function() { return height; };
  this.setWidth  = function(size) { width  = size; this.rebuild(); };
  this.setHeight = function(size) { height = size; this.rebuild(); };
  this.setColor  = function(color) {
    if (color.length == 4)
    {
      var numColors = colors.length / 4;
      colors = [];
      for (var i = 0; i < numColors; i++)
        for (var j = 0; j < 4; j++)
          colors.push(color[j])
    }
    else colors = color;
    this.rebuild(self.gl);
  };
  
  this.render = function(mode) {
    mode = mode || FILL;
    var gl = self.gl;
    if (!gl) return;
    var shaderProgram;
        
    mvPushMatrix();
    multMatrix(self.orientation.getMatrix());

    var doRender = function() {
      if (shaderProgram && typeof(shaderProgram.vertexPositionAttribute) != "undefined")
      {
        setMatrixUniforms();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
        checkGLError();
      }
      

      if (mode == FILL || mode == RENDER_PICK)
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      else if (mode == WIREFRAME)
        gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);
      
      mvPopMatrix();
      checkGLError();
    };
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    if (mode == RENDER_PICK)
    {
      var shader = getPickShader();
      shader.setAttribute('aVertexPosition', vertexBuffer);
      shader.bind(function() { doRender(); });
      return;
    }
    else
    {
      if (self.shader)
      {
        self.shader.setAttribute('aVertexPosition', vertexBuffer);
        self.shader.setAttribute('aTextureCoord', textureBuffer);
        self.shader.setAttribute('aVertexNormal', normalBuffer);
        self.shader.setAttribute('aVertexColor', colorBuffer);
        if (self.texture)
        {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          self.shader.uniform('uSampler', 'uniform1i').value = 0;
        }
        self.shader.bind(function() { doRender(); });
        return;
      }
      if (self.texture)
      {
        shaderProgram = useShader('color_with_texture');
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);
        checkGLError();
      }
      else
      {
        shaderProgram = useShader('color_without_texture');
        checkGLError();
      }

      if (shaderProgram.vertexColorAttribute)
      {
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
        checkGLError();
      }
      
      doRender();
    }
  };
  
  this.dispose = function() {
    self.gl.deleteBuffer(vertexBuffer);
    self.gl.deleteBuffer(colorBuffer);
    self.gl.deleteBuffer(textureBuffer);
  };
  
  this.rebuild = function(gl) {
    if (vertexBuffer) self.dispose();
    self.gl = gl;
    
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexBuffer.itemSize = 3;
    vertexBuffer.numItems = vertices.length / 3;
    
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;
    colorBuffer.numItems = colors.length / 4;
    
    textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    textureBuffer.itemSize = 2;
    textureBuffer.numItems = textureCoords.length / 2;
    
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STREAM_DRAW);
    indexBuffer.itemSize = 1;
    indexBuffer.numItems = indices.length;
    
    normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    normalBuffer.itemSize = 3;
    normalBuffer.numItems = normals.length / 3;
  };
  
  if (gl)
    self.rebuild(gl);
  else
    after_initialize(function(gl) {
      self.rebuild(gl);
    });
}

Sphere.prototype = {
  
};

Sphere.identifier = 0;
*/
