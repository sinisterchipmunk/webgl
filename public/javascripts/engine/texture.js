var Texture = Class.create({
  /* By default, a GL_TEXTURE_2D is generated. Set #target if you need something different. */
  initialize: function(path_or_image) {
    var self = this;
    self.texture = null;
    self.min_filter = GL_LINEAR_MIPMAP_NEAREST;
    self.mag_filter = GL_LINEAR;
    self.target = GL_TEXTURE_2D;
    
    logger.attempt("Texture#initialize", function() {
      if (typeof(path_or_image) == 'string') {
        self.path = path_or_image;
        var img = new Image();
        img.onload = function() { self.handleTextureData(img); };
        img.src = self.path;
      }
      else
      {
        self.path = path_or_image.src;
        if (path_or_image.complete) self.handleTextureData(path_or_image);
        else path_or_image.onload = function() { self.handleTextureData(path_or_image); };
      }
    });
  },
  
  handleTextureData: function(image) {
    var self = this;
    self.image = image;
    logger.attempt("Texture#handleTextureData", function() {
      if (self.onload) self.onload(image);
    });
  },
  
  generateTexture: function(context, image, texture) {
    context.bindTexture(this.target, texture);  
    context.texImage2D(this.target, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, image);
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
        this.generateTexture(context, this.image, this.glTexture)
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
  return Texture.find_or_create(attributes.path ? attributes.path : attributes);
  // TODO or we can switch to keying off of attributes.id, which would be more future-proof, but less flexible
};
