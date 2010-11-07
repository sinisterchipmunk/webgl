(function() { return {
  name: "water_fountain",
  particle_count: 250,
  shape: ParticleSystem.Shape.RECTANGLE,
  textures: ["/images/textures/particle.png"],
        
  revive_particle: function(particle) {
    particle.energy= Math.random();
    particle.color[0] = 0.7;
    particle.color[1] = 0.7;
    particle.color[2] = 1.0;
    particle.color[3] = 1.0;
    particle.position[0] = 0;
    particle.position[1] = 0;
    particle.position[2] = 17;
    particle.velocity[0] = Math.random()*5-2.5;
    particle.velocity[1] = Math.random()*0.5+5;
    particle.velocity[2] = Math.random()*5-2.5;
    particle.size = [0.05,0.025,0.05];
  },

  update_particle: function(particle, tc) {
    particle.energy -= tc * 1.6;
    particle.position[0] += particle.velocity[0] * tc;
    particle.position[1] += particle.velocity[1] * tc;
    particle.position[2] += particle.velocity[2] * tc;
    particle.velocity[1] -= 20 * tc;
  }
}; })();
