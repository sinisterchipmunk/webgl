var Creature = (function() {
  function buildAnimation(self)
  {
    var name = self.animationName;
    var loop = self.animationLoop;
    
    var meta = MD2.animations[name];
    self.animation = new Animation(meta, {frames:self.actor.model.model_data.frames,loop: loop});
  }
  
  return Class.create(Renderable, {
    initialize: function($super, attributes) {
      this.id = attributes.id;
      this.name = attributes.name;
      this.actor = Actor.instance(attributes.actor);
      this.actor.scale = attributes.scale;
      this.playAnimation("stand");
      
      $super(attributes);
    },
    
    // No default shader because Creature isn't responsible for shading itself.
    // Pick shaders are a special case and are handled differently by Renderable.
    getDefaultShader: function() { return null; },
    
    lowest: function() { return this.actor.lowest(); },
    draw: function($super, options) {
      this.actor.render(options);
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
