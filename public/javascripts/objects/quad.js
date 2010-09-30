function Quad(width, height, gl)
{
  var self = this;
  self.object_id = ++Quad.identifier;
  
  var vertexBuffer = null, textureBuffer = null, colorBuffer = null;
  
  var vertices = [ -width/2, -height/2, 0,
                    width/2, -height/2, 0,
                   -width/2,  height/2, 0,
                    width/2,  height/2, 0  ];
  var colors = [ 1,1,1,1,
                 1,1,1,1,
                 1,1,1,1,
                 1,1,1,1 ];
  var textureCoords = [ 0, 0,
                        1, 0,
                        0, 1,
                        1, 1 ];
  var pickShader;
  
  /* private function for generating this object's pick shader. */
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
      colors = [];
      for (var i = 0; i < 4; i++)
        for (var j = 0; j < 4; j++)
          colors.push(color[j]);
    }
    else colors = color;
    this.rebuild(self.gl);
  };
  
  this.render = function(mode) {
    mode = mode || FILL;
    var gl = self.gl;
    if (!gl) return;
    var shaderProgram;
    
    var doRender = function() {
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
      checkGLError();

      if (mode == FILL || mode == RENDER_PICK)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numItems);
      else if (mode == WIREFRAME)
        gl.drawArrays(gl.LINE_STRIP, 0, vertexBuffer.numItems);

      checkGLError();
    };
    
    if (mode == RENDER_PICK)
    {
      var shader = getPickShader();
      shader.setAttribute('aVertexPosition', vertexBuffer);
      shader.bind(function() {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numItems);
        checkGLError();
      });
      return;
//      pushShader(shaderProgram, function() {
//        //shaderProgram = useShader('pick');
//        // if we do this elsewhere then we'll be applying it to the wrong shader.
//        // TODO FIXME need to see if this is a similar effect elsewhere
//        setMatrixUniforms();
//        doRender();
//      });
    }
    else
    {
      if (this.shader)
      {
        this.shader.setAttribute('aVertexPosition', vertexBuffer);
        this.shader.bind(function() {
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexBuffer.numItems);
          checkGLError();
        });
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
        setMatrixUniforms();
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
    vertexBuffer.numItems = 4;
    
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    colorBuffer.itemSize = 4;
    colorBuffer.numItems = 4;
    
    textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    textureBuffer.itemSize = 2;
    textureBuffer.numItems = 4;
  };
  
  if (gl)
    self.rebuild(gl);
  else
    after_initialize(function(gl) {
      self.rebuild(gl);
    });
}

Quad.prototype = {
  
};

Quad.identifier = 0;
