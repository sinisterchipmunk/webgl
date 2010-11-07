/* if options are specified, they may contain:
     program - if program is specified, this shader will be attached to the specified program. Otherwise, a new
               program will be created.
               
     vertex_source - a String containing the vertex shader source code
     
     fragment_source - a String containing the fragment shader source code
 */
function Shader(options)
{
  options = options || {};
  var program = options.program;
  
  this.id = ++Shader.identifier;
  var self = this;
  var compiled = false;
  var disposed = false;
  var uniforms = {};
  var attributes = {};
  var fragmentShader = null, vertexShader = null;
  
  self.context = options.context || WebGLContext.mostRecent || null;
  self.fragment = { source: options.fragment_source || null };
  self.vertex   = { source: options.vertex_source   || null };
  
  /* ensures that this shader is compiled if it hasn't been already, and then returns its program. */
  self.getCompiledProgram = function() { if (!self.isCompiled()) self.compile(); return program; };
  self.isCompiled = function() { return compiled; };
  self.getFragmentShader = function() { return fragmentShader; };
  self.getVertexShader = function() { return vertexShader; };
  
  self.compile = function() {
    var context = self.context;
    if (!disposed && compiled) throw new Error("Tried to compile an already-compiled shader. Try calling #dispose() first.");
    if (!context) throw new Error("No associated WebGLContext object!");
    
    function compileShader(type, source) {
      var shader = context.createShader(type);
      context.shaderSource(shader, source);
      context.compileShader(shader);
      
      if (!context.getShaderParameter(shader, GL_COMPILE_STATUS))
        throw new Error(context.getShaderInfoLog(shader));
      return shader;
    }

    if (self.fragment.source) fragmentShader = compileShader(GL_FRAGMENT_SHADER, self.fragment.source);
    else throw new Error("No fragment shader source!");
    
    if (self.vertex.source)   vertexShader   = compileShader(GL_VERTEX_SHADER,   self.vertex.source);
    else throw new Error("No vertex shader source!");
    
    if (!disposed) program = program || context.createProgram();
    else program = context.createProgram();
    
    if (vertexShader)   context.attachShader(program, vertexShader);
    if (fragmentShader) context.attachShader(program, fragmentShader);
    context.linkProgram(program);
    
    if (!context.getProgramParameter(program, GL_LINK_STATUS))
      throw new Error("Could not initialize shader!");

    disposed = false;
    compiled = true;
    return program;
  };
  
  self.attributes = function(name) {
    if (!attributes[name])
    {
      attributes[name] = ({name:name,type:GL_FLOAT});
    }
    return attributes[name];
  };
  self.attribute = self.attributes;
  
  /* type is optional and defaults to GL_FLOAT (or whatever the previous type for this attribute was).
     buffer is the GL buffer, and is expected to have a #length property representing the item count.
     buffer may also be a function which returns the expected buffer object. */
  self.setAttribute = function(name, buffer, type) {
    var attr = self.attribute(name);
    if (type) attr.type = type;
    attr.buffer = buffer;
  };
  
  /* equivalent to calling #setAttribute(name, null) */
  self.disableAttribute = function(name) {
    self.attribute(name).buffer = null;
  };
  
  self.getAttribute = function(name) {
    var result = self.attribute(name).buffer;
    if (typeof(result) == "function") result = result();
    return result;
  };
  
  self.uniforms = function(name, type) {
    if (!uniforms[name])
    {
      uniforms[name] = ({name:name,type:type || "uniformMatrix4fv"});
      // create some setters and getters for convenience.
      self["set"+name.capitalize()] = function(value, type) { return self.setUniformValue(name, value, type); };

      self["get"+name.capitalize()] = function() { return self.getUniformValue(name); };
    }
    return uniforms[name];
  };
  self.uniform = self.uniforms;
  
  self.getAttributeLocation = function(name) {
    var context = self.context;
    var attribute = self.attributes(name);
    if (typeof(attribute.location) == "undefined")
      self.context.pushShader(program, function() { attribute.location = context.getAttribLocation(program, name); });

    if (location == -1) throw new Error("Attribute not found: "+name);
    return attribute.location;
  };
  
  /* Applies the buffers for each attribute. This is called automatically by #bind. */
  self.applyAttributes = function(program) {
    var context = self.context;
    if (!program) program = self.getCompiledProgram();
    
    for (var name in attributes) {
      var attribute = attributes[name];
      var location = self.getAttributeLocation(name); // because attribute.location might not exist yet
      
      if (location > -1)
        if (attribute.buffer)
        {
          if (attribute.buffer.bufferType)
            attribute.buffer.bind(self.context);
          else
          {
            if (!attribute.buffer.itemSize) throw new Error("Buffer "+(attribute.toSource())+" is not dynamic, and its itemSize is not valid");
            context.bindBuffer(GL_ARRAY_BUFFER, attribute.buffer);
          }
          context.enableVertexAttribArray(location);
          context.vertexAttribPointer(location, attribute.buffer.itemSize, attribute.type, false, 0, 0);
        }
        else
        {
          context.disableVertexAttribArray(location);
        }
    }
  };
  
  /* Applies the set values for each uniform. This is called automatically by #bind. */
  self.applyUniforms = function(program) {
    var gl = self.context.gl;
    if (!program) program = self.getCompiledProgram();
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
      }
    }
  };
  
  /* Deletes this program. Calling any method which requires a compiled program will recompile it. */
  self.dispose = function() {
    if (self.context)
      self.context.deleteProgram(program);

    vertexShader = fragmentShader = null;
    compiled = false;
    disposed = true;
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
      self.context.pushShader(program, function() {
        self.applyUniforms(program);
        self.applyAttributes(program);
        func();
      });
    else
    {
      self.context.useShader(program);
      self.applyUniforms(program);
      self.applyAttributes(program);
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
    return uniform.location = this.context.getUniformLocation(program, name);
  }
};

Shader.identifier = Shader.identifier || 0;