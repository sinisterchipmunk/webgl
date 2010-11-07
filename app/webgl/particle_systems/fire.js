(function() { return {
  name: "fire",
  
  particle_count: 1000,
  shape: [0,1,0,  -1,-1,0,  0,-1,0,  1,-1,0],
  
  textures: [ "/images/textures/particle.png" ],
  
  revive_particle: function(particle) {
    particle.position = [Math.random()*10 - 5,-3.5,17.5];
    
    particle.initial_velocity = [0, 1, 0];
    
    particle.velocity = particle.initial_velocity.dup();
    particle.size = particle.max_size = Math.random() * 0.35;
    particle.alive = 1;
    particle.max_energy = (Math.random() * 1) + 1;
    particle.energy = particle.max_energy;
    particle.counter = 0;
    var red = (Math.random() * particle.position[0]);
    red = Math.abs(red) / 5;
    particle.color = [1,red * 0.75,0,1];
  },
  
  update_particle: function(particle, tc) {
    particle.energy -= tc * 1.1;
    particle.color[1] += tc / 4;
    if (particle.color[1] > 1) particle.color[1] = 1;
    particle.position[0] += particle.velocity[0] * tc;
    particle.position[1] += particle.velocity[1] * tc;
    particle.position[2] += particle.velocity[2] * tc;
    var pcnt = (particle.energy / particle.max_energy);
    particle.size = particle.max_size * pcnt * 2;
  }
}; })();
