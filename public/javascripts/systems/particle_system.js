var ParticleSystem = (function() {
  var klass = Class.create(Renderable, {
    /*
      options:
        src_blend_mode - the source GL blend mode to use. Defaults to GL_SRC_ALPHA.
        
        dst_blend_mode - the destination GL blend mode to use. Defaults to GL_ONE.
        
        system_type    - the type of particle system. This is set by subclasses, and defaults to null.
        
        shape          - the shape of a particle in this system, in the form of an array of numbers between -1 and 1.
                         The shape will be multiplied by the size to result in vertex locations. There must be either
                         1 or 4 vertices, or a total of either 3 or 12 numbers. Additional numbers will be ignored.
                         
                         You can also set this to one of these predefined types:
                           ParticleSystem.Shape.SQUARE    => [-1.0,-1.0,0.0,  -1.0,1.0,0.0,  1.0,1.0,0.0,  1.0,-1.0,0.0]
                           ParticleSystem.Shape.RECTANGLE => [-0.5,-1.0,0.0,  -0.5,1.0,0.0,  0.5,1.0,0.0,  0.5,-1.0,0.0]
                           ParticleSystem.Shape.POINT     => [0, 0, 0]
                           
                         Defaults to ParticleSystem.Shape.SQUARE.
                         
        update_particle- a function used to update a single particle in the system. A particle argument and a timechange
                         argument is supplied, which represents time elapsed in seconds since the last update. There is
                         no default for this option, but if a subclass supplies an #update_particle method then it will
                         not be required. The particle update method should return true when the particle system as a
                         whole is dead.
                         
        particle_count - how many particles are to be used. Default is 100.
        
        after_initialize - an optional callback function to invoke after the particle system has been initialized.
        
        revive_particle- a function which is expected to set initial values for a particle. It is given two arguments:
                         the particle itself, and the particle's index in the greater particle system. When the particle
                         is first created, it will have only an #index attribute. In subsequent calls, the particle's
                         previous attributes will be available. The base particle system expects this method to define
                         the following attributes:
                         
                         position - a 3-element float array containing X, Y and Z locations relative to the particle
                                    system's position.
                         
                         velocity - a 3-element float array containing X, Y and Z velocity. The particle will be moved
                                    by this amount per second, and its previous position will be stored in an attribute
                                    called #previous_position. Note also that the particle's shape will be rotated to
                                    point in this direction, regardless of whether the particle's position is actually
                                    changed.
                                    
                         color    - the color of this particle.
                         
                         alive    - a boolean. If false, the particle will be considered dead.
                         
                         energy   - a number. If zero or less, and if #alive evaluates to false, then the
                                    #revive_particle method will be called again to reset this particle.
                                    
                         size     - a multiplier. The particle will be scaled by this amount. Defaults to 0.1.
                         
                         Additionally, the #index attribute will constantly be assigned to the particle's internal array
                         index in this particle system. You can use this, if necessary, to track the particle ID. The
                         system will also dynamically update the following attributes before every update:
                             previous_position
                             previous_velocity   
                             previous_color
                             previous_energy     
                             previous_size

     */
    initialize: function($super, options)
    {
      $super();
      options = options || {};
      this.src_blend_mode = typeof(options.src_blend_mode) == "undefined" ? GL_SRC_ALPHA : options.src_blend_mode;
      this.dst_blend_mode = typeof(options.dst_blend_mode) == "undefined" ? GL_ONE       : options.dst_blend_mode;
      this.system_type = options.type || null;
      this.particles = {};
      this.shape = options.shape || ParticleSystem.Shape.SQUARE;
      this.bounding_box = options.bounding_box;
      this.update_particle = options.update_particle || this.update_particle;
      this.particle_count = options.particle_count || 100;
      this.revive_particle = options.revive_particle || this.revive_particle;
      
      var i;
      if (options.texture)
        this.mesh.addTexture(Texture.instance(options.texture));
      
      if (options.textures)
        for (i = 0; i < options.textures.length; i++)
          this.mesh.addTexture(Texture.instance(options.textures[i]));
      
      this.internal = { numLiving: 0, bounding_box: [], after_initialize: options.after_initialize };
      for (i = 0; i < this.particle_count; i++)
      {
        var particle = {index:i,size:[0,0,0],position:[0,0,0],velocity:[0,0,0],color:[1,1,1,1],alive:true,energy:1};
        this.revive_particle(particle);
        this.particles[i] = particle;
      }
    },
    
    update_previous_values: function(particle)
    {
      particle.previous_position = particle.previous_position || [];
      particle.previous_position[0] = particle.position[0];
      particle.previous_position[1] = particle.position[1];
      particle.previous_position[2] = particle.position[2];
      particle.previous_color = particle.previous_color || [];
      particle.previous_color[0] = particle.color[0];
      particle.previous_color[1] = particle.color[1];
      particle.previous_color[2] = particle.color[2];
      particle.previous_color[3] = particle.color[3];
      particle.previous_velocity = particle.previous_velocity || [];
      particle.previous_velocity[0] = particle.velocity[0];
      particle.previous_velocity[1] = particle.velocity[1];
      particle.previous_velocity[2] = particle.velocity[2];
      particle.previous_energy = particle.energy;     
      if (typeof(particle.size) == "number")
      {
        particle.previous_size = particle.size;
      }
      else
      {
        if (typeof(particle.previous_size) != "Array") particle.previous_size = [];
        particle.previous_size[0] = particle.size[0];
        particle.previous_size[1] = particle.size[1];
        particle.previous_size[2] = particle.size[2];
      }
    },
    
    update: function(timechange)
    { /* TODO refactor this */
      /* don't update if #init hasn't completed */
      if (!this.untransformed_vertices) return false;
      
      var deadCount = 0, j;
      var vertexBuf = this.mesh.getVertexBuffer();
      var colorBuf  = this.mesh.getColorBuffer();
      var vertex_size, color_size;
      if (this.shape.length == 3) { vertex_size = 3; color_size = 4; }
      else { vertex_size = 18; color_size = 24; }
      
      var normalX, normalY, normalZ;
      var t;
      var len;
      var yaw;
      var pitch;
      var x, y, z;
      
      
      
      for (var i = 0; i < this.particle_count; i++)
      {
        var offset = i * vertex_size;
        var particle = this.particles[i];
//        var forceColor = !particle.previous_color;
        particle.index = i;
        this.update_previous_values(particle);
        this.update_particle.call(this, particle, timechange);
        
        var sizex, sizey, sizez;
        if (typeof(particle.size) == "number") sizex = sizey = sizez = particle.size;
        else { sizex = particle.size[0]; sizey = particle.size[1]; sizez = particle.size[2]; }
        
        if (!particle.alive) {
          deadCount++;
          if (!particle.__dead_and_repositioned)
          {
            /* set vertices to all 0's. This will cause the particle to become effectively invisible, because it has
               no width, height or depth. */
            for (j = 0; j < vertex_size; j++) vertexBuf.js[offset+j] = 0;
            particle.__dead_and_repositioned = true;
          }
        }
        else
        {
          if (particle.energy <= 0) this.revive_particle.call(this, particle);
//          if (!particle.position.equals(particle.previous_position) || !particle.velocity.equals(particle.previous_velocity))
          {
            if (vertex_size != 3) // just a waste of time for POINTs
            {
              normalX = particle.velocity[0];
              normalY = particle.velocity[1];
              normalZ = particle.velocity[2];
              t = normalX*normalX + normalY*normalY;
              len = Math.sqrt(t + normalZ*normalZ);
              if (len != 0) { normalX /= len; normalY /= len; normalZ /= len; }
              yaw = Math.atan2(normalX, normalY);
              pitch = Math.atan2(normalX, Math.sqrt(t));
            }

            // set new vertex coords
            for (j = 0; j < vertex_size; j += 3)
            {
              x = (this.untransformed_vertices[offset+j  ]*sizex); 
              y = (this.untransformed_vertices[offset+j+1]*sizey);
              z = (this.untransformed_vertices[offset+j+2]*sizez);
              
              if (vertex_size != 3) // if it's a POINT then it needs no orientation
              {
                var _x = x, _y = y, _z = z;
                // rotation about Z
                x = _x*Math.cos(yaw) - _y*Math.sin(yaw);
                y = _x*Math.sin(yaw) + _y*Math.cos(yaw);
                _x = x; _y = y;
              
                // rotation about (new)X
                y = _y*Math.cos(pitch) - _z*Math.sin(pitch);
                z = _y*Math.sin(pitch) + _z*Math.cos(pitch);
              
                x = -x; // WHY?
              }
              
              vertexBuf.js[offset+j  ] = x + particle.position[0];
              vertexBuf.js[offset+j+1] = y + particle.position[1];
              vertexBuf.js[offset+j+2] = z + particle.position[2];
            }
          }
          if (particle.color)
          {
            offset = i * color_size;
            // set new vertex coords
            for (j = 0; j < color_size; j += 4)
            {
              colorBuf.js[offset+j  ] = particle.color[0];
              colorBuf.js[offset+j+1] = particle.color[1];
              colorBuf.js[offset+j+2] = particle.color[2];
              colorBuf.js[offset+j+3] = particle.color[3];
            }
          }
        }
      }
      vertexBuf.refresh();
      colorBuf.refresh();
      this.internal.numLiving = deadCount;
      return deadCount == this.particle_count;
    },
    
    render: function($super, options)
    {
      if (options.context && this.src_blend_mode && this.dst_blend_mode)
      { /* TODO what about pick shading? */
        /* TODO: optimize with other particle systems to avoid redundant calls */
        var vc = this.untransformed_vertices && this.untransformed_vertices.length == 3
        if (!vc)
        {
          options.context.enable(GL_BLEND);
          options.context.blendFunc(this.src_blend_mode, this.dst_blend_mode);
        }
        $super(options);
        if (vc) options.context.disable(GL_BLEND);
      }
      else $super(options);
    },
    
    init: function(vertices, colors, texcoords, normals, indices)
    {
      this.draw_mode = GL_TRIANGLES;
      this.untransformed_vertices = [];
      
      var self = this;
      function push(v) {
        /*
          we store two arrays: untransformed_vertices represent each particle's individual shape; and vertices
          are the actual particle vertices to be used. The vertices are initially set to 0 in order to avoid
          an odd graphical "flicker". Since #update hasn't fired yet, we can't trust #render to work properly so
          we need to make the system invisible until after the initial call to #update completes.
         */
        self.untransformed_vertices.push(self.shape[v*3], self.shape[v*3+1], self.shape[v*3+2]);
        vertices.push(0,0,0);
      }
      
      var shape_length = this.shape.length;
      for (var i = 0; i < this.particle_count; i++)
      {
        if (shape_length == 3) // POINT
        {
          push(0);
          colors.push(0,0,0,0);
          texcoords.push(0,0);
        }
        else // QUAD
        {
          // add 2 triangles. TODO: I'd prefer a strip, here's the second use case today for multiple tristrip support
          push(0); push(3); push(1); //tri1
          push(3); push(1); push(2); //tri2
        
          colors.push(0,0,0,0,  0,0,0,0,  0,0,0,0,  0,0,0,0,  0,0,0,0,  0,0,0,0); // These are altered per-particle.
        
          //tri1
          texcoords.push(0, 0); //v0
          texcoords.push(1, 0); //v1
          texcoords.push(0, 1); //v2
          //tri2
          texcoords.push(1, 0); //v1
          texcoords.push(0, 1); //v2
          texcoords.push(1, 1); //v3
        }
      }
      
      if (shape_length == 3) // POINT
        this.draw_mode = GL_POINTS;
      if (self.internal.after_initialize) self.internal.after_initialize.apply(self, []);
    }
  });
  
  klass.Shape = {
    SQUARE    : [-1.00,-1.00,0.0,  -1.00,1.00,0.0,  1.00,1.00,0.0,  1.00,-1.00,0.0],      //  1  4      1,4,2
    RECTANGLE : [-0.25,-2.00,0.0,  -0.25,2.00,0.0,  0.25,2.00,0.0,  0.25,-2.00,0.0],      //  2  3      4,2,3
    POINT     : [ 0.00, 0.00,0.0 ]
  };
  
  return klass;
})();
