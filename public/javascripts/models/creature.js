var Creature = Class.create(Renderable, {
  initialize: function($super, attributes) {
    logger.info(attributes.toSource());
    
    this.id = attributes.id;
    this.name = attributes.name;
    this.actor = Actor.instance(attributes.actor);
    this.actor.scale = attributes.scale;
    
    $super(attributes);
  },
  
  // No default shader because Creature isn't responsible for shading itself.
  // Pick shaders are a special case and are handled differently by Renderable.
  getDefaultShader: function() { return null; },
  
  lowest: function() { return this.actor.lowest(); },
  draw: function($super, options) {
    this.actor.render(options);
  },
  
  // we don't need an update thread for Creature.
  /* TODO: YES WE DO! But not just yet. */
  update: null
});

Creature.instance = function(attributes) { return instanceFor(Creature, attributes); };
