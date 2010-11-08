(function() { return {
  name: "xmas_tree",
  particle_count:4000,
  shape: ParticleSystem.Shape.POINT,
      
  revive_particle: function(particle) {
    var min_spin = 0.05, max_spin = 0.25;
    var topr = 0.05;
    var botr = 4;
    var y = Math.random() * 10;
    var o = 0;
    while (o < 0.6 && y > Math.random() * 5)
    {
      y = Math.random() * 10;
      o = Math.random();
    }
          
    particle.rad = (Math.random() * ((y / 10.0) * (topr - botr) + botr)) + 0;
    particle.spin = Math.random() * (max_spin-min_spin) + min_spin;
    particle.angle = Math.random() * Math.PI * 2;
    var x = particle.rad * Math.cos(particle.angle);
    var z = particle.rad * Math.sin(particle.angle);
          
    particle.position[0] = x;
    particle.position[1] = y - 5;
    particle.position[2] = z;
    particle.energy = Math.random()*4;

    if (particle.index < 314)       // first 300 or so particles for angel
    { // r = m sin (2a)
      var a = particle.index * 2 / 100.0;
      var r = 0.75 * Math.sin(2*a);
      particle.position[0] = Math.cos(a) * r;
      particle.position[1] = Math.sin(a) * r + 5;
      particle.position[2] = 0;
      particle.static = true;
    }
    else if (Math.random() > 0.8)   // 20% of remaining particles for lights
    {
      var c = parseInt(Math.random() * 4);
      particle.color[0] = 0;
      particle.color[1] = 0;
      particle.color[2] = 0;
      switch(c) {
        case 0: particle.color[0] = 1; break;
        case 1: particle.color[1] = 1; break;
        case 2: particle.color[0] = 1; particle.color[1] = 1; break;
        case 3: particle.color[1] = 1; particle.color[2] = 1; break;
      }
    }
    else                            // 90% of particles for tree
    {
      particle.color[0] = 0;
      particle.color[1] = 0.25 + Math.random()*0.25;
      particle.color[2] = 0;
    }
    particle.color[3] = 1;
  },
      
  update_particle: function(particle, timechange) {
    if (!particle.static) {
      particle.angle += particle.spin*timechange;
      var x = particle.rad * Math.cos(-particle.angle);
      var z = particle.rad * Math.sin(-particle.angle);
          
      particle.position[0] = x;
      particle.position[2] = z;
    }
    
    particle.energy -= timechange;
  }
}; })();
