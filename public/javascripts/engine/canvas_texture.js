var CanvasTexture = Class.create({
  initialize: function(canvas) {
    var self = this;
    this.glTexture = null;
    this.min_filter = GL_LINEAR_MIPMAP_NEAREST;
    this.mag_filter = GL_LINEAR;
    this.target = GL_TEXTURE_2D;

    this.source = canvas;
    this.source.addEventListener("onchange", function() { self.update(); }, true);
    this.out_of_date = true;
	this.buffer = document.createElement("canvas");
	this.buffer.context = this.buffer.getContext("2d");
    
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(this.buffer);
    this.ready = false;
    
    if (this.source.height <= 0) {
      var original = this.source.style.display;
      this.source.style.display = "";
      this.source.height = this.source.offsetHeight;
      this.source.width  = this.source.offsetWidth;
      this.source.style.display = original;
    }
    this.buffer.style.display = "none";

    this.buffer.height = Math.pow2(this.source.height);
    this.buffer.width  = Math.pow2(this.source.width);
  },
  
  generateTexture: function(context) {
    context.bindTexture(this.target, this.glTexture);
    this.buffer.context.save();
    if (this.source.nodeName.toLowerCase() == "video")
      /* TODO FIXME will this hold across implementations? is this a driver issue? what the hell is with the 1.25 magic number?? */
      this.buffer.context.scale(this.source.width/this.buffer.width*1.25, this.source.height/this.buffer.height*1.25);
    else
      this.buffer.context.scale(this.buffer.width/this.source.width, this.buffer.height/this.source.height);
    this.buffer.context.clearRect(0, 0, this.buffer.width, this.buffer.height);
    this.buffer.context.drawImage(this.source, 0, 0);
    this.buffer.context.restore();
    context.texImage2D(this.target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, this.buffer);
    context.texParameteri(this.target, GL_TEXTURE_MAG_FILTER, this.mag_filter);  
    context.texParameteri(this.target, GL_TEXTURE_MIN_FILTER, this.min_filter);  
    context.generateMipmap(this.target);
    this.ready = true;
  },
  
  update: function() {
    this.out_of_date = true;
  },
  
  bind: function(context, func) {
    if (!this.glTexture)
      this.glTexture = context.createTexture();

    if (this.out_of_date)
      this.generateTexture(context);
  
    if (!this.ready) { context.bindTexture(this.target, null); }
    if (func) {
      func();
      context.bindTexture(this.target, null);
    }
  }
});

CanvasTexture.instance = function(attributes) { return Texture.instance(attributes); };
