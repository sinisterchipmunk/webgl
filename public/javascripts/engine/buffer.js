var Buffer = Class.create({
  initialize: function(context, bufferType, classType, drawType, jsarr, itemSize) {
    if (jsarr.length == 0) throw new Error("No elements in array to be buffered!");
    if (!itemSize) throw new Error("Expected an itemSize - how many JS array elements represent a single buffered element?");
    this.context = context;
    this.buffer = null;
    this.classType = classType;
    this.itemSize = itemSize;
    this.js = jsarr;
    this.numItems = jsarr.length / itemSize;
    this.bufferType = bufferType;
    this.drawType = drawType;
    
    this.rebuild();
  },
  
  rebuild: function() {
    if (!this.buffer) this.buffer = this.context.gl.createBuffer();
    this.context.gl.bindBuffer(this.bufferType, this.buffer);
    this.context.gl.bufferData(this.bufferType, new this.classType(this.js), this.drawType);
    this.buffer.itemSize = this.itemSize;
    this.buffer.numItems = this.js.numItems;
  },
  
  dispose: function() {
    if (this.buffer) this.context.gl.deleteBuffer(this.buffer);
    this.buffer = null;
  },
  
  isDisposed: function() { return !this.buffer; },
  
  bind: function() { if (!this.buffer) this.rebuild(); context.gl.bindBuffer(this.bufferType, this.buffer); }
});

// More user-friendly versions of the above
var ElementArrayBuffer = Class.create(Buffer, {
  initialize: function($super, context, jsarr) {
    $super(context, GL_ELEMENT_ARRAY_BUFFER, Uint16Array, GL_STREAM_DRAW, jsarr, 1);
  }
});

var FloatArrayBuffer = Class.create(Buffer, {
  initialize: function($super, context, jsarr, itemSize) {
    $super(context, GL_ARRAY_BUFFER, Float32Array, GL_STATIC_DRAW, jsarr, itemSize);
  }
});

var VertexBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, context, jsarr) { $super(context, jsarr, 3); }
});

var ColorBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, context, jsarr) { $super(context, jsarr, 4); }
});

var TextureCoordsBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, context, jsarr) { $super(context, jsarr, 2); }
});

var NormalBuffer = Class.create(FloatArrayBuffer, {
  initialize: function($super, context, jsarr) { $super(context, jsarr, 3); }
});
