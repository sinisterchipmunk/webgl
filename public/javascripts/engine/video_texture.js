var VideoTexture = Class.create({
  initialize: function(path) {
    var self = this;
    this.glTexture = null;
    this.min_filter = GL_LINEAR_MIPMAP_NEAREST;
    this.mag_filter = GL_LINEAR;
    this.target = GL_TEXTURE_2D;

    this.video=document.createElement("video");
	this.video.style.display="none";
    this.video.style.border = '1px solid #000;';
	this.video.setAttribute("loop","loop");
	this.video.autoplay=true;
    
    this.video.addEventListener("timeupdate", function() { self.update(); }, true);
	this.video.addEventListener("ended", function() { this.play(); }, true); 
    this.out_of_date = true;
	this.buffer = document.createElement("canvas");
	this.buffer.context = this.buffer.getContext("2d");
    
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(this.buffer);
    body.appendChild(this.video);

    this.path = path;
    this.video.src = path;
    this.ready = false;
    
    if (this.video.height <= 0) {
      this.video.style.display = "";
      this.video.height = this.video.offsetHeight;
      this.video.width  = this.video.offsetWidth;
      this.video.style.display = "none";
    }
    this.buffer.style.display = "none";

    this.buffer.height = Math.pow2(this.video.height);
    this.buffer.width  = Math.pow2(this.video.width);
    /* TODO FIXME will this hold across implementations? is this a driver issue? what the hell is with the 1.25 magic number?? */
    this.buffer.context.scale(this.video.width/this.buffer.width*1.25, this.video.height/this.buffer.height*1.25);
  },
  
  generateTexture: function(context) {
    if (this.video.readyState > 0)
    {
      context.bindTexture(this.target, this.glTexture);
      this.buffer.context.drawImage(this.video, 0, 0);
      context.texImage2D(this.target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, this.buffer);
      context.texParameteri(this.target, GL_TEXTURE_MAG_FILTER, this.mag_filter);  
      context.texParameteri(this.target, GL_TEXTURE_MIN_FILTER, this.min_filter);  
      context.generateMipmap(this.target);
      this.ready = true;
    }
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

VideoTexture.instance = function(attributes) { return Texture.instance(attributes); };
