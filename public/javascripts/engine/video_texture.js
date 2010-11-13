var VideoTexture = Class.create({
  initialize: function(path) {
    var self = this;
    this.video=document.createElement("video");
	this.video.style.display="none";
    this.video.style.border = '1px solid #000;';
	this.video.setAttribute("loop","loop");
	this.video.autoplay=true;
    
    this.video.addEventListener("timeupdate", function() { self.update(); }, true);
	this.video.addEventListener("ended", function() { this.play(); }, true); 
    
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(this.video);

    this.path = path;
    this.video.src = path;
    
    this.canvas_texture = new CanvasTexture(this.video);
  },
  
  generateTexture: function(context) {
    this.canvas_texture.generateTexture(context);
  },
  
  
  update: function() {
    this.canvas_texture.update();
  },
  
  bind: function(context, func) {
    this.canvas_texture.bind(context, func);
  }
});

VideoTexture.instance = function(attributes) { return Texture.instance(attributes); };
