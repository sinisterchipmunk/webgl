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
    
//    lowest: function() { return this.actor.lowest(); },
    lowest: function() { return this.mesh ? this.mesh.lowest() : 0; },

    init: function(vertices, colors, texcoords, normals)
    {
      if (this.actor.meshLoaded)
      {
        /* clone actor's mesh data for animation purposes - this way we don't affect the root actor when animating */
        this.actor.model.mesh.init(vertices, colors, texcoords, normals);
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
