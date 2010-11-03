/* 
  Wrapper to manage JS and GL buffer (array) types. Automates context juggling by requiring the context to generate the
  buffer for as an argument to #bind. If the context doesn't have a corresponding GL buffer for this data, it will be
  created. Calling #refresh will regenerate the buffer data for all contexts.
*/
var Buffer = (function() {
  function each_gl_buffer(self, func)
  {
    for (var id in self.gl)
      func(self.gl[id].context, self.gl[id].buffer);
  }
  
  return Class.create({
    initialize: function(bufferType, classType, drawType, jsarr, itemSize) {
      if (jsarr.length == 0) throw new Error("No elements in array to be buffered!");
      if (!itemSize) throw new Error("Expected an itemSize - how many JS array elements represent a single buffered element?");
      this.classType = classType;
      this.itemSize = itemSize;
      this.js = jsarr;
      this.gl = {};
      this.numItems = jsarr.length / itemSize;
      this.bufferType = bufferType;
      this.drawType = drawType;
    },
    
    refresh: function() {
      var self = this;
      if (self.classTypeInstance)
        for (var i = 0; i < self.js.length; i++)
          self.classTypeInstance[i] = self.js[i];
      else
        self.classTypeInstance = new self.classType(self.js);
      
      if (!self.gl) return;
      
      logger.attempt("buffer#refresh", function() {
        each_gl_buffer(self, function(context, buffer) {
          context.bindBuffer(self.bufferType, buffer);
          context.bufferData(self.bufferType, self.classTypeInstance, self.drawType);
        });
      });
    },
    
    dispose: function() {
      var self = this;
      each_gl_buffer(this, function(context, buffer) {
        context.deleteBuffer(buffer);
        self.gl[context.id] = null;
      });
      self.gl = {};
    },
    
    isDisposed: function() { return !this.gl; },
    
    bind: function(context) { context.bindBuffer(this.bufferType, this.getGLBuffer(context)); },
    
    getGLBuffer: function(context)
    {
      if (!context || typeof(context.id) == "undefined")
        throw new Error("Cannot build a buffer without a context!");
      
      if (!this.gl[context.id])
      {
        var buffer = context.createBuffer();
        buffer.itemSize = this.itemSize;
        buffer.numItems = this.js.length;
        this.gl[context.id] = {context:context,buffer:buffer};
        this.refresh();
      }
      return this.gl[context.id].buffer;
    }
  });
})();

// More user-friendly versions of the above
var ElementArrayBuffer = Class.create(Buffer, {
  initialize: function($super, jsarr) {
    $super(GL_ELEMENT_ARRAY_BUFFER, Uint16Array, GL_STREAM_DRAW, jsarr, 1);
  }
});

var FloatArrayBuffer = Class.create(Buffer, {
  initialize: function($super, jsarr, itemSize) {
    $super(GL_ARRAY_BUFFER, Float32Array, GL_STATIC_DRAW, jsarr, itemSize);
  }
});

var VertexBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, jsarr) { $super(jsarr, 3); }
});

var ColorBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, jsarr) { $super(jsarr, 4); }
});

var TextureCoordsBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, jsarr) { $super(jsarr, 2); }
});

var NormalBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, jsarr) { $super(jsarr, 3); }
});
