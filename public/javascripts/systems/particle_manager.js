var ParticleManager = Class.create({
  initialize: function(world) {
    this.world = world;
    this.systems = [];

    var lastUpdate = null;
    var self = this;
    function update()
    {
      logger.attempt("particle manager update", function() {
        var time = new Date();
        var timechange = 0;
        if (lastUpdate) timechange = (time - lastUpdate) / 1000.0;
        lastUpdate = time;
      
        for (var i = 0; i < self.systems.length; i++)
          if (self.systems[i].update(timechange))
          {
            self.systems[i].invalidate();
            self.systems.splice(i, 1);
            i--;
          }
      
        setTimeout(update, ParticleManager.update_interval);
      });
    }
    setTimeout(update, ParticleManager.update_interval);
  },
  
  clear: function() {
    for (var i = 0; i < this.systems.length; i++)
      this.systems[i].invalidate();
    this.systems.clear();
  },
  
  render: function(options)
  {
    var num_systems = this.systems.length;
    if (options.context)
      options.context.disable(GL_DEPTH_TEST);
    for (var i = 0; i < num_systems; i++)
      this.systems[i].render(options);
    if (options.context)
      options.context.enable(GL_DEPTH_TEST);
  },
  
  add: function(system)
  {
    this.systems.push(system);
  },
  
  remove: function(system)
  {
    var num_systems = this.systems.length;
    for (var i = 0; i < num_systems; i++)
      if (this.systems[i] == system)
      {
        this.systems.splice(i, 1);
        system.invalidate();
      }
  }
});

/* Estimated number of milliseconds between system updates */
ParticleManager.update_interval = 20;
