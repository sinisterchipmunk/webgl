var ParticleGenerator = function() {
  function variance(amount) { return Math.random() * amount - (amount / 2); }
  
  function generate(self, particle) {
    var i;
    var size = self.options.startSize + variance(self.options.startSizeVariance);
    var endSize = self.options.endSize + variance(self.options.endSizeVariance);
    if (!particle)
    {
      particle = new Quad(size, size);
      particle.setColor([Math.random(),Math.random(),Math.random(),Math.random()]);
    }
    var position = [self.options.position[0], self.options.position[1], self.options.position[2]];
    for (i = 0; i < 3; i++)
      position[i] += variance(self.options.posVariance[i]);
    
    particle.size = size;
    particle.orientation.translateTo(position);
    particle.endSize = endSize;
    particle.lifespan = self.options.lifespan + variance(self.options.lifespanVariance);
    particle.destVariance = [];
    for (i = 0; i < 3; i++)
      particle.destVariance[i] = variance(self.options.destVariance[i]);
    
    return particle;
  }
  
  return Class.create(Renderable, {
    initialize: function($super, options) {
      var self = this;
      logger.attempt("create ParticleGenerator", function() {
        self.setOptions(options);
        self.particles = [];
        $super();
      });
    },
    
    update: function(timechange) {
      for (var i = 0; i < this.particles.length; i++)
      {
        var particle = this.particles[i];
        var sizechange = (particle.size - particle.endSize) / particle.lifespan * timechange;
        particle.size -= sizechange;
        particle.lifespan -= (particle.lifespan * timechange);
        if (Math.abs(particle.lifespan) < Math.EPSILON || Math.abs(particle.size-particle.endSize) < Math.EPSILON)
        { // regenerate it
          generate(this, particle);
        }
        else
        { // it's still alive, move it
          var pos = particle.orientation.getPosition();
          var dest = this.options.destination.plus(particle.destVariance);
          var distance = pos.minus(dest).magnitude();
          var speed = particle.lifespan / distance;
          var home = true;
          for (var j = 0; j < 3; j++)
          {
            pos[j] += ((dest[j]-pos[j])/speed*timechange);
            if (Math.abs(pos[j]-dest[j]) >= Math.EPSILON) home = false;
          }
          if (home) // particle is home, kill it
            generate(this, particle);
          else
            particle.orientation.setPosition(pos);
        }
      }
      if (this.particles.length < this.options.particleCount)
        this.particles.push(generate(this));
    },
    
    render: function(context, mode) {
      if (!this.isBuiltFor(context)) { this.rebuild(context); }
      for (var i = 0; i < this.particles.length; i++)
        if (this.particles[i])
          this.particles[i].render(context, mode);
    },
    
    setOptions: function(options) {
      options = options || {};
      var defaults = {
        particleCount: 100,
        position: [0,0,0],
        posVariance: [1.5,1.5,1.5],
        destination: [3,3,3],
        destVariance: [0.5,0.5,0.5],
        startSize: 0.025,
        startSizeVariance: 0.1,
        endSize: 0,
        endSizeVariance: 0,
        lifespan: 1,
        lifespanVariance: 0.5
      };
      
      for (var i in defaults)
        if (typeof(options[i]) == "undefined")
          options[i] = defaults[i];
      
      this.options = options;
    }
  });
}();
