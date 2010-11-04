var Creature = (function() {
  function buildAnimation(self)
  {
    var name = self.animationName;
    var loop = self.animationLoop;
    
    var meta = MD2.animations[name];
    self.animation = new Animation(meta, {frames:self.actor.model.model_data.frames,loop: loop});
    self.mesh.rebuildAll();
    for (var i = 0; i < self.actor.model.mesh.textures.length; i++)
      self.mesh.addTexture(self.actor.model.mesh.textures[i]);
  }
  
  return Class.create(Renderable, {
    initialize: function($super, attributes) {
      this.id = attributes.id;
      this.name = attributes.name;
      this.actor = Actor.instance(attributes.actor);
      this.scale = this.actor.scale = attributes.scale;
      this.playAnimation("stand");
      
      $super(attributes);
    },
    
    // No default shader because Creature isn't responsible for shading itself.
    // Pick shaders are a special case and are handled differently by Renderable.
//    getDefaultShader: function() { return null; },
    
    lowest: function() { return this.actor.lowest(); },
//    draw: function($super, options) {
//      this.actor.render(options);
//    },
    
    init: function(vertices, colors, texcoords, normals)
    {
      if (this.actor.meshLoaded)
      {
//        var i;
        /* clone actor's mesh data for animation purposes - this way we don't affect the root actor when animating */
        this.actor.model.mesh.init(vertices, colors, texcoords, normals);
//        var vertexBuffer   = this.actor.model.mesh.getVertexBuffer().js;
//        var colorBuffer    = this.actor.model.mesh.getColorBuffer() .js;
//        var normalBuffer   = this.actor.model.mesh.getNormalBuffer().js;
//        var texcoordBuffer = this.actor.model.mesh.originalTextureCoords;
//        for (i = 0; i < vertexBuffer  .length; i++) vertices .push(vertexBuffer[i]  );
//        for (i = 0; i < normalBuffer  .length; i++) normals  .push(normalBuffer[i]  );
//        for (i = 0; i < colorBuffer   .length; i++) colors   .push(colorBuffer[i]   );
//        for (i = 0; i < texcoordBuffer.length; i++) texcoords.push(texcoordBuffer[i]);
      }
    },
    
    update: function(timechange)
    {
      if (this.actor.meshLoaded && (!this.animation || this.animation.name != this.animationName))
        buildAnimation(this);
      if (this.animation) this.animation.update(this, timechange);
    },
    
    playAnimation: function(which, loop) {
      if (this.animationName == which) return;
      if (MD2.animations[which])
      {
        this.animationName = which;
        this.animationLoop = loop;
      }
      else
        throw new Error("Invalid MD2 animation name: "+which);
    }
  });
})();

Creature.instance = function(attributes) { return instanceFor(Creature, attributes); };
