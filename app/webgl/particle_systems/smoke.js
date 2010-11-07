(function() { return {
  name: "smoke",
  
  particle_count: 500,
  shape: ParticleSystem.Shape.SQUARE,
  
  textures: [ "/images/textures/particle.png" ],
  
  revive_particle: function(particle) {
    particle.position = [Math.random()*10 - 5,-3.5,17.5];
    
    particle.initial_velocity = [Math.random()*1-0.5, 1, 0];
    
    particle.velocity = particle.initial_velocity.dup();
    particle.size = 0;
    particle.max_size = Math.random() * 2.25 + 0.25;
    particle.alive = 1;
    particle.max_energy = (Math.random() * 4) + 5;
    particle.energy = particle.max_energy;
    
    var color = Math.random() * 0.25;
    particle.color = [color,color,color,0.5];
  },
  
  update_particle: function(particle, tc) {
    particle.energy -= tc;
    if (particle.color[1] > 1) particle.color[1] = 1;
    particle.position[0] += particle.velocity[0] * tc;
    particle.position[1] += particle.velocity[1] * tc;
    particle.position[2] += particle.velocity[2] * tc;
    var pcnt = ((particle.max_energy - particle.energy) / particle.max_energy);
    if (pcnt < 0) pcnt = 0;
    if (pcnt > 0.5) particle.color[3] = 1 - pcnt;
    if (particle.energy > 0)
      particle.size = particle.max_size * pcnt;
    else particle.size = 0;
  }
}; })();
