(function() { return {
  name: "heavy_rain",
  
  /*
    how many particles are ideally in this system? Note that the particle manager may
    tweak the actual particle count based on the system's performance. Consider this
    an upper limit, and not an absolute given.
   */
  particle_count: 750,
  
  /*
    Particle shape can be ParticleSystem.Shape.SQUARE, ParticleSystem.Shape.RECTANGLE,
    or a custom shape in the form of an array of 4 vertices:
    
      [v1x,v1y,v1z,  v2x,v2y,v2z,  v3x,v3y,v3z,  v4x,v4y,v4z]
      
    If there are more than 16 elements in the array, the additional elements will be
    ignored.
   */
  shape: ParticleSystem.Shape.RECTANGLE,
  
  /*
    List of textures to add to this particle system. Every particle in the system will
    have the entire texture list applied to it.
   */
  textures: [ "/images/textures/particle.png" ],
  
  revive_particle: function(particle) {
    particle.position[0] = Math.random() * 40 - 10;
    particle.position[1] = Math.random() * 40 + 20;
    particle.position[2] = Math.random();
    
    particle.velocity[0] = -3.5;
    particle.velocity[1] = -20;
    particle.velocity[2] = 0;
    
    particle.energy = 1;
    particle.size = 0.25;
    particle.color = [0.45,0.45,0.55,1];
  },
  
  update_particle: function(particle, timechange) {
    particle.position[0] = particle.position[0] + particle.velocity[0] * timechange;
    particle.position[1] = particle.position[1] + particle.velocity[1] * timechange;
    particle.position[2] = particle.position[2] + particle.velocity[2] * timechange;
    
    if (particle.position[1] < -10) {
      particle.energy = 0;
    }
  }
}; })();
