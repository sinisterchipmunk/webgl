/* if program is specified, this shader will be attached to the specified program. Otherwise, a new
   program will be created.
 */
function Shader(program)
{
  var self = this;
  var compiled = false;
  var uniforms = {};
  var attributes = {};
  var fragmentShader = null, vertexShader = null;
  
  self.fragment = { source: null };
  self.vertex   = { source: null };
  
  /* ensures that this shader is compiled if it hasn't been already, and then returns its program. */
  self.getCompiledProgram = function() { if (!compiled) self.compile(); return program; };
  self.isCompiled = function() { return compiled; };
  self.getFragmentShader = function() { return fragmentShader; };
  self.getVertexShader = function() { return vertexShader; };
  
  self.compile = function() {
    function compileShader(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }

    if (self.fragment.source) fragmentShader = compileShader(gl.FRAGMENT_SHADER, self.fragment.source);
    else throw new Error("No fragment shader source!");
    
    if (self.vertex.source)   vertexShader   = compileShader(gl.VERTEX_SHADER,   self.vertex.source);
    else throw new Error("No vertex shader source!");
    
    program = program || gl.createProgram();
    
    if (vertexShader)   gl.attachShader(program, vertexShader);
    if (fragmentShader) gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Could not initialize shader!");

    checkGLError();    

    compiled = true;
    return program;
  };
  
  self.attributes = function(name) {
    if (!attributes[name])
    {
      attributes[name] = ({name:name,type:gl.FLOAT});
    }
    return attributes[name];
  };
  self.attribute = self.attributes;
  
  /* type is optional and defaults to gl.FLOAT (or whatever the previous type for this attribute was).
     buffer is the GL buffer, and is expected to have a #length property representing the item count.
     buffer may also be a function which returns the expected buffer object. */
  self.setAttribute = function(name, buffer, type) {
    var attr = self.attribute(name);
    if (type) attr.type = type;
    attr.buffer = buffer;
  };
  
  self.getAttribute = function(name) {
    var result = self.attribute(name).buffer;
    if (typeof(result) == "function") result = result();
    return result;
  };
  
  function capitalize(name) { return name.substring(0,1).toUpperCase()+name.substring(1,name.length); }
  
  self.uniforms = function(name, type) {
    if (!uniforms[name])
    {
      uniforms[name] = ({name:name,type:type || "uniformMatrix4fv"});
      // create some setters and getters for convenience.
      self["set"+capitalize(name)] = function(value, type) { return self.setUniformValue(name, value, type); };

      self["get"+capitalize(name)] = function() { return self.getUniformValue(name); };
    }
    return uniforms[name];
  };
  self.uniform = self.uniforms;
  
  self.getAttributeLocation = function(name) {
    var attribute = self.attributes(name);
    if (typeof(attribute.location) == "undefined")
      pushShader(program, function() { attribute.location = gl.getAttribLocation(program, name); });

    if (location == -1) throw new Error("Attribute not found: "+name);
    return attribute.location;
  };
  
  /* Applies the buffers for each attribute. This is called automatically by #bind. */
  self.applyAttributes = function() {
    var program = self.getCompiledProgram();
    
    for (var name in attributes) {
      var attribute = attributes[name];
      var location = self.getAttributeLocation(name); // because attribute.location might not exist yet
      
      if (location > -1)
        if (attribute.buffer)
        {
          gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, attribute.buffer.itemSize, attribute.type, false, 0, 0);
          checkGLError();
        }
        else
        {
          gl.disableVertexAttribArray(location);
          checkGLError();
        }
    }
  };
  
  /* Applies the set values for each uniform. This is called automatically by #bind. */
  self.applyUniforms = function() {
    var program = self.getCompiledProgram();
    for (var name in uniforms) {
      var uniform = self.uniforms(name);
      if (typeof(uniform.value) != "undefined")
      {
        var location = self.getUniformLocation(name);
        if (location)
          if (uniform.type.indexOf("uniformMatrix") != -1)
          {
            if (typeof(uniform.transpose) != "undefined")
              gl[uniform.type](location, uniform.transpose, self.getUniformValue(name));
            else
              gl[uniform.type](location,             false, self.getUniformValue(name));
          }
          else
          {
            gl[uniform.type](location, self.getUniformValue(name));
          }
        checkGLError();
      }
    }
  };
  
  /* Deletes this program. Calling any method which requires a compiled program will recompile it. */
  self.dispose = function() {
    gl.deleteProgram(program);
    checkGLError();
    vertexShader = fragmentShader = null;
    compiled = false;
  };
  
  self.uniforms('mvMatrix', 'uniformMatrix4fv').value = function() { return new Float32Array(mvMatrix.flatten()); };
  self.uniforms('pMatrix',  'uniformMatrix4fv').value = function() { return new Float32Array(pMatrix.flatten());  };
  self.uniforms('nMatrix',  'uniformMatrix4fv').value = function() {
    return new Float32Array(mvMatrix.inverse().transpose().flatten());
  };
}

Shader.prototype = {
  
  bind: function(func) {
    var self = this;
    
    var program = self.getCompiledProgram();
    
    if (func)
      pushShader(program, function() {
        self.applyUniforms();
        self.applyAttributes();
        func();
      });
    else
    {
      useShader(program);
      self.applyUniforms();
      self.applyAttributes();
    }
  },
  
  setUniformValue: function(name, value, type) {
    if (typeof(type) == "function" && typeof(value) != "function") {
      // user probably reversed values for legibility, let's give it to them
      var swap = value;
      value = type;
      type = swap;
    }
    var uniform = this.uniforms(name);
    if (type) uniform.type = type;
    uniform.value = value;
  },
  
  getUniformValue: function(name) {
    var val = this.uniforms(name).value;
    if (typeof(val) == "function") { return val(); }
    return val;
  },
  
  // Returns the location of the specified uniform.
  getUniformLocation: function(name)
  {
    var uniform = this.uniforms(name);
    if (typeof(uniform.location) != "undefined") return uniform.location;
    var program = this.getCompiledProgram();
    return uniform.location = gl.getUniformLocation(program, name);
  }
};
