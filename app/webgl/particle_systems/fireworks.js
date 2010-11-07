(function() { return {
  name: "fireworks",
  
//  src_blend_mode: GL_SRC_COLOR,
//  dst_blend_mode: GL_DST_COLOR,
  /* this is identical to explosion except for the shape. TODO see about code reuse. */
  
  /*
    how many particles are ideally in this system? Note that the particle manager may
    tweak the actual particle count based on the system's performance. Consider this
    an upper limit, and not an absolute given.
   */
  particle_count: 500,
  
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
    particle.position = [0,0,0];
    
    var theta = Math.random() * Math.PI*2;
    var alpha = Math.random() * Math.PI*2;
    var speed = 5;//Math.random() * 10 - 5;
    
    particle.initial_velocity = [
      speed * Math.sin(theta) * Math.cos(alpha),
      speed * Math.sin(theta) * Math.sin(alpha),
      speed * Math.cos(theta)
    ];
    
//    x = r sin(a1) cos(a2)
//    y = r sin(a1) sin(a2)
//    z = r cos(a1)
    
    //    particle.initial_velocity = [speed*Math.cos(theta), speed*Math.sin(theta), Math.random() * 10-5];
    
    particle.velocity = particle.initial_velocity.dup();
    particle.max_size = Math.random() * 0.5;
    particle.size[0] = particle.max_size;
    particle.size[1] = particle.max_size * 0.5;
    particle.size[2] = particle.max_size;
    particle.alive = 1;
    particle.max_energy = Math.random()*1 + 2;//(Math.random() * 2) + 1;
    particle.energy = particle.max_energy;
    particle.counter = 0;
    particle.color = [Math.random()*0.5+0.5,Math.random()*0.5+0.5,Math.random()*0.5+0.5,1];
  },
  
  update_particle: function(particle, tc) {
    particle.energy -= tc;
    particle.position[0] += particle.velocity[0] * tc;
    particle.position[1] += particle.velocity[1] * tc;
    particle.position[2] += particle.velocity[2] * tc;
    particle.size[0] = particle.max_size * (particle.energy / particle.max_energy);
    particle.size[1] = particle.max_size * (particle.energy / particle.max_energy) * 0.5;
    particle.size[2] = particle.max_size * (particle.energy / particle.max_energy);
    particle.velocity[0] += particle.velocity[0] * -tc;
    particle.velocity[1] += particle.velocity[1] * -tc;
    particle.velocity[2] += particle.velocity[2] * -tc;
    particle.velocity[1] -= tc*1.5;
    
    if (particle.energy <= 0) particle.alive = false;
  }
}; })();
