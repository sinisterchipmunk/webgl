var Texture = Class.create({
  /* By default, a GL_TEXTURE_2D is generated. Set #target if you need something different. */
  initialize: function(path_or_image) {
    var self = this;
    self.texture = null;
    self.min_filter = GL_LINEAR_MIPMAP_NEAREST;
    self.mag_filter = GL_LINEAR;
    self.target = GL_TEXTURE_2D;
    
    logger.attempt("Texture#initialize", function() {
      var node_name = (path_or_image && path_or_image.nodeName && path_or_image.nodeName.toLowerCase());
      if (typeof(path_or_image) == 'string') {
        self.path = path_or_image;
        var img = new Image();
        img.onload = function() { self.handleTextureData(img); };
        img.src = self.path;
      }
      else if (node_name && node_name == "image")
      {
        self.path = path_or_image.src;
        if (path_or_image.complete) self.handleTextureData(path_or_image);
        else path_or_image.onload = function() { self.handleTextureData(path_or_image); };
      }
      else if (node_name && node_name == "canvas")
      {
        throw new Error("Canvas element texture detected -- use CanvasTexture() instead of Texture()");
      }
      else throw new Error("Don't know how to handle texture element: "+path_or_image);
    });
  },
  
  handleTextureData: function(image) {
    var self = this;
    self.image = image;
    logger.attempt("Texture#handleTextureData", function() {
      if (self.onload) self.onload(image);
    });
  },
  
  refresh: function(context) {
    context.bindTexture(this.target, this.glTexture);  
    context.texImage2D(this.target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, this.image);
    context.texParameteri(this.target, GL_TEXTURE_MAG_FILTER, this.mag_filter);  
    context.texParameteri(this.target, GL_TEXTURE_MIN_FILTER, this.min_filter);  
    context.generateMipmap(this.target);  
    context.bindTexture(this.target, null);
  },
  
  /* Binds this texture to the given context.
  
    If a callback is given, the texture will be bound and then unbound after the callback is triggered. If no callback
    is given, the texture will be bound to the given context so you can begin drawing.
    
    Examples:
      texture.bind(context);
      // draw stuff
      
      
      texture.bind(context, function() {
        // draw stuff
      });
      // texture is unbound
   */
  bind: function(context, func) {
    var isLoaded = this.isLoaded();
    
    if (!this.glTexture)
    {
      if (isLoaded) // loaded but not prepared
      {
        this.glTexture = context.createTexture();
        this.refresh(context);
      }
    }
    
    if (isLoaded) context.bindTexture(this.target, this.glTexture);
    if (func) {
      func();
      if (isLoaded) context.bindTexture(this.target, null);
    }
  },
  
  isLoaded: function() {
    return (this.glTexture || (this.image && this.image.complete));
  }
});

Texture.all = Texture.all || [];
Texture.find_or_create = function(path) {
  return Texture.all[path] || (Texture.all[path] = new Texture(path));
};

Texture.instance = function(attributes) {
  if (attributes.nodeName && attributes.nodeName.toLowerCase() == "canvas")
    return (Texture.all[attributes] = Texture.all[attributes] || new Texture(attributes));
  else
    return Texture.find_or_create(attributes.path ? attributes.path : attributes);
  // TODO or we can switch to keying off of attributes.id, which would be more future-proof, but less flexible
};
