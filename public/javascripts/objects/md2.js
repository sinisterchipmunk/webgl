var MD2 = function() {
  // snapshot serves a dual purpose: it lets us only calculate the frame once and apply it to the buffers for
  // each context at the same time; and it also exposes the current vertex information to the outside world
  // without putting those buffers at risk.
  function initSnapshot(md2) {
    var i;
    md2.frametracker = 0;
      
    var frame = md2.model_data.frames[md2.currentFrame];
    for (i = 0; i < frame.vertices.length; i++)
      md2.snapshot.vertices[i] = frame.vertices[i] * md2.scale;
    for (i = 0; i < frame.normals.length; i++)
      md2.snapshot.normals[i] = frame.normals[i];
  }
  
  function updateFramerate(md2, timechange) {
    if (timechange && typeof(md2.frametracker) != "undefined")
    {
      if (md2.frametracker >= 1 && md2.framecount > 0)
      {
        md2.actual_framerate = md2.framecount;
        md2.frametracker = 0;
        md2.framecount = 0;
      }
    
      md2.frametracker += timechange;
    }
  }
  
  function interpolate(md2)
  {
    var i;
    
    md2.framecount = md2.framecount || 0;
    md2.framecount++;
    
    var nextFrameIndex;
    if (md2.anim_looping && md2.currentFrame+1 >= md2.current_animation.stop)
      nextFrameIndex = md2.current_animation.start;
    else if (!md2.anim_looping && md2.currentFrame >= md2.current_animation.stop)
      { nextFrameIndex = md2.currentFrame; md2.stop(); }
    else
      nextFrameIndex = md2.currentFrame+1;

    var currentFrame = md2.model_data.frames[md2.currentFrame];
    var targetFrame = md2.model_data.frames[nextFrameIndex];
      
    md2.interpolation = md2.interpolation || {vertices:[],normals:[]};

    for (i = 0; i < currentFrame.vertices.length; i++)// += 3)
    {
      // figure out vertex interpolation
      md2.interpolation.vertices[i] = (targetFrame.vertices[i] - currentFrame.vertices[i]);
      // figure out normal interpolation
      md2.interpolation.normals[i] = (targetFrame.normals[i] - currentFrame.normals[i]);
    }
    
    // reset the timer and mark the interpolation as valid
    md2.interpolation.timer = 1.0 / md2.fps;
    md2.interpolation.timer_total = 1.0 / md2.fps;
    md2.interpolation.valid = true;
  }
  
  // updates the buffers for every context. Called when vertex or normal information changes.
  function updateBuffers(md2)
  {
    var i;
    for (var id in md2.mesh.buffers) {
      if (md2.mesh.buffers[id])
      {
        var vertexBuffer = md2.mesh.getVertexBuffer();
        var normalBuffer = md2.mesh.getNormalBuffer();
          
        for (i = 0; i < md2.snapshot.vertices.length; i++)
          vertexBuffer.js[i] = md2.snapshot.vertices[i];
        for (i = 0; i < md2.snapshot.normals.length; i++)
          normalBuffer.js[i] = md2.snapshot.normals[i];
          
        vertexBuffer.refresh();
        normalBuffer.refresh();
      }
    }      
  }
  
  function snapshot(md2, timechange) {
    var i, j, k, triangle, vindex;
    if (md2.snapshot.vertices.length == 0) // if no vertices exist, we need to populate them.
      initSnapshot(md2);
    
    updateFramerate(md2, timechange);
    
    // we know what frame we're on, and we know what frame we're targeting (currentFrame+1)
    // if an interpolation exists, then we know how far we need to go and how long it should take to get there.
    // if an interpolation does not exist, we need to figure that info out.
    // after we have the interpolation, we'll just increment each vertex by that amount.

    if (md2.interpolation && md2.interpolation.valid)
    {
      if (typeof(timechange) != "undefined") // don't try to interpolate if we have no timechange to check it against
      {
        // don't exceed the remaining time; else we'll get incorrect percentages and wind up with runaway vertices
        if (timechange >= md2.interpolation.timer)
          timechange = md2.interpolation.timer;
        
        var percentage = timechange / md2.interpolation.timer_total;
        
        md2.interpolation.timer -= timechange;
        if (!md2.use_interpolation) percentage = 0;
        
        // see if we've run out the timer
        if (md2.interpolation.timer <= Math.EPSILON)
        {
          if (!md2.use_interpolation) percentage = 1;
          md2.incrementFrame();
          md2.interpolation.timer = 0;
          md2.interpolation.valid = false; // trigger next frame's calculation
        }
        
        if (md2.use_interpolation || md2.interpolation.timer <= Math.EPSILON)
        {
          for (i = 0; i < md2.interpolation.vertices.length; i++)
          {
            md2.snapshot.vertices[i] += md2.interpolation.vertices[i] * percentage * md2.scale;
            md2.snapshot.normals[i]  += md2.interpolation.normals[i]  * percentage; // don't scale normals :)
          }
        }
      }
    }
    
    // this isn't an 'else' because interp.valid may have changed after the condition was evaluated. see above.
    if (!md2.interpolation || !md2.interpolation.valid)
    {
      interpolate(md2);
    }
  }
  
  return Class.create(Renderable, {
    /* Note that you can set the following callbacks for MD2 objects:
        md2.callbacks.anim_start    = function(md2) { ... }
        md2.callbacks.anim_stop     = function(md2) { ... }
        md2.callbacks.anim_loop     = function(md2) { ... }
        md2.callbacks.anim_complete = function(md2) { ... }
     */
    initialize: function($super, json) {
      this.scale = 1.0;
      this.use_interpolation = true;
      this.model_data = json;
      this.snapshot = {vertices:[],normals:[],textureCoords:[]};
      this.currentFrame = 0;
      this.callbacks = {};
      $super();
      this.playAnimation("stand");
    },
    
    incrementFrame: function()
    {
      this.currentFrame++;
      if (this.currentFrame >= this.current_animation.stop)
      {
        if (this.anim_looping)
        {
          this.currentFrame = this.current_animation.start;
          if (this.callbacks["anim_loop"]) this.callbacks["anim_loop"](this);
        }
        else
          this.stop();
      }
    },
    
    start: function() {
      if (this.currentFrame >= this.current_animation.stop && !this.anim_looping) this.restart();
      else {
        this.anim_playing = true;
        if (this.callbacks["anim_start"]) this.callbacks["anim_start"](this);
      }
    },
    
    stop: function() {
      this.anim_playing = false;

      if (this.currentFrame >= this.current_animation.stop && !this.anim_looping)
        // anim completed on its own
        if (this.callbacks["anim_complete"]) this.callbacks["anim_complete"](this);
      else
        // was stopped externally
        if (this.callbacks["anim_stop"]) this.callbacks["anim_stop"](this);
    },
    
    restart: function() {
      this.playAnimation(this.current_animation.name, this.anim_looping);
    },
    
    /*
      Some animations are designed to loop by default. Others are not.
      If the user specifies a loop argument, the animation will be forced to (or not to) loop.
      Otherwise, it will choose whether to loop automatically depending on the animation specified.
     */
    playAnimation: function(which, loop)
    {
      var anim = MD2.animations[which];
      if (!anim) throw new Error("Animation not found: "+which);
      this.fps = anim.fps;
      this.current_animation = anim;
      this.anim_looping = typeof(loop) == "undefined" ? typeof(anim.loop) == "undefined" ? false : anim.loop : loop;
      this.setFrame(anim.start);
      this.start();
    },
    
    setFrame: function(index)
    {
      var self = this;
      logger.attempt("MD2#setFrame", function() {
        prev = self.currentFrame;
        self.currentFrame = (index = index % self.model_data.frames.length);
        // since the frame has chagned, the verts are in the wrong position
        // so we have to revert to the only known good source: the current frame
        initSnapshot(self);
        if (self.interpolation) self.interpolation.valid = false;
      });
    },
    
    setScale: function(scale)
    {
      // update the current snapshot to reflect the new scale
      if (this.snapshot) {
        // handle divide-by-zero
        if (this.scale == 0)
        {
          this.scale = scale;
          initSnapshot(this);
        }
        else
        {
          var i;
          for (i = 0; i < this.snapshot.vertices.length; i++)
            this.snapshot.vertices[i] = this.snapshot.vertices[i] / this.scale * scale;
          this.scale = scale;
        }
        updateBuffers(this);
      }
    },
    
    init: function(vertices, colors, textureCoords, normals, indices) {
      this.draw_mode = GL_TRIANGLES;
      this.fps = 10;
      
      snapshot(this);
      
      for (var i = 0; i < this.model_data.texcoords.length; i++)
        textureCoords.push(this.model_data.texcoords[i]);
      
      /*
      If we were going to build an optimized list (we're not), then here's
      how we'd do it. We're not going to because A) there's not much difference,
      at least considering we can't use real triangle strips / fans; and B)
      we lose precision with the textures, compromising image quality. I think
      it remains to be seen at this point whether there's any noteworthy gain
      from using these optimization techniques on modern hardware.
      ***
      
      var i, j;
      var last, current, next;
      var offset = 0, command;
      
      for (i = 0; i < this.model_data.gl_commands.length; i++)
      {
        offset = textureCoords.length / 2;
        command = this.model_data.gl_commands[i];
        for (j = 0; j < command.segments.length; j++)
        {
          textureCoords.push(command.segments[j].texture_s);
          textureCoords.push(command.segments[j].texture_t);
        }


        if (command.type == "triangle_strip")
        {
          last = 0;
          current = 1;
          for (j = 2; j < command.segments.length; j++)
          {
            next = j;
            indices.push(offset+last);
            indices.push(offset+current);
            indices.push(offset+next);
            last = current;
            current = next;
          }
        }
        else// triangle fan
        {
          var origin = 0;
          last = 1;
          for (j = 2; j < command.segments.length; j++)
          {
            next = j;
            indices.push(offset+origin);
            indices.push(offset+last);
            indices.push(offset+next);
            last = next;
          }
          // fill in the remaining gap
          indices.push(offset+origin);
          indices.push(offset+last);
          indices.push(offset+1);
        }
      }
      */
      
      for (j = 0; j < this.snapshot.vertices.length; j++)
        vertices.push(this.snapshot.vertices[j]);
      for (j = 0; j < this.snapshot.normals.length; j++)
        normals.push(this.snapshot.normals[j]);
    },
    
    update: function(timechange) {
      if (this.anim_playing)
      {
        snapshot(this, timechange);
        updateBuffers(this);
      }
    }
  });
}();

MD2.load = function(model_name, success)
{
  new Ajax.Request("/md2/"+model_name, {
    onSuccess: function(response) {
      logger.attempt("MD2.load-success", function() {
        var i, j, k, l;
        if (response.responseJSON == null) throw new Error("Could not parse a JSON object from the response text:\n\n"+response.responseText);
        
        var frame;
        
        /* first unpack the frame data so the model can worry about important stuff */
        for (i = 0; i < response.responseJSON.frames.length; i++)
        {
          frame = response.responseJSON.frames[i];
          var rearranged_vertices = [], rearranged_normals = [];
          for (j = 0; j < frame.vertices.length; j += 3)
          {
            for (k = 0; k < 3; k++)
              frame.vertices[j+k] = (frame.vertices[j+k] * frame.scale[k]) + frame.translation[k];

            // All the MD2 files I've seen so far put the up axis along Z, not Y. I'm going to assume that this
            // is fairly constant and transpose the values here.
            var y = frame.vertices[j+2];
            frame.vertices[j+2] = frame.vertices[j+1];
            frame.vertices[j+1] = y;

            // now rotate so it's in line with the camera (right now we're turned 90 degrees CCW around the Y axis)
            var x = frame.vertices[j], z = frame.vertices[j+2];
            var theta = -Math.PI/2;
            var vx = x * Math.cos(theta) - z * Math.sin(theta),
                vz = x * Math.sin(theta) + z * Math.cos(theta);
            frame.vertices[j] = vx;
            frame.vertices[j+2] = vz;
          }
        }
        
        // sets up an array of vertices, normals and indices as WebGL expects them
        var counter = 0, f, texes = [], json = response.responseJSON, new_verts = {}, new_norms = {};
        for (j = 0; j < json.triangles.length; j++)
        {
          var triangle = json.triangles[j];
          for (k = 0; k < 3; k++)
            texes.push(json.texcoords[triangle.texcoord_indices[k]][0], json.texcoords[triangle.texcoord_indices[k]][1]);

          for (f = 0; f < json.frames.length; f++)
          {
            frame = json.frames[f];
            new_verts[f] = new_verts[f] || [];
            new_norms[f] = new_norms[f] || [];
          
            for (k = 0; k < 3; k++)
            {
              var vindex = triangle.vertex_indices[k];
              new_verts[f].push(frame.vertices[vindex*3], frame.vertices[vindex*3+1], frame.vertices[vindex*3+2]);
              
              new_norms[f].push(MD2.normals[frame.normal_indices[vindex]][0],
                                MD2.normals[frame.normal_indices[vindex]][1],
                                MD2.normals[frame.normal_indices[vindex]][2]);
            }
          }
        }
        
        json.texcoords = texes;
        for (f in new_verts)
        {
          json.frames[f].vertices = new_verts[f];
          json.frames[f].normals = new_norms[f];
        }
        
        

        /* works, but produces glitches in texture mapping. I think it's an effect of the optimized
         rendering, so I"m going the old fashioned triangle route. See above note in #init
         for more info.
        ***

        var command, frame_verts, vindex, vindex2 = 0, tmp_verts = {};
        for (i = 0; i < response.responseJSON.gl_commands.length; i++)
        {
          command = response.responseJSON.gl_commands[i];
          for (j = 0; j < command.segments.length; j++)
          {
            vindex = command.segments[j].vertex_index;
            for (var f = 0; f < response.responseJSON.frames.length; f++)
            {
              frame = response.responseJSON.frames[f];
              frame_verts = frame.vertices;
              tmp_verts[f] = tmp_verts[f] || [];
              for (k = 0; k < 3; k++)
                tmp_verts[f].push(frame_verts[vindex*3+k]);
            }
            command.segments[j].vertex_index = vindex2;
            vindex2++;
          }
        }
        for (f in tmp_verts)
        {
          frame = response.responseJSON.frames[f];
          frame.vertices = tmp_verts[f];
        }
        //*/
        
        success(new MD2(response.responseJSON));
      });
    },
    onFailure: function(response) {
      logger.error("error: "+response.toSource());
    },
    evalJSON: true,
    method: 'get'
  });
};

/* Animation sequences are predefined for MD2 models. */
MD2.animations = {
  stand:              {start:   0, stop:  39, fps:  9, loop:true},
  run:                {start:  40, stop:  45, fps: 10, loop:true},
  attack:             {start:  46, stop:  53, fps: 10, loop:false},
  pain_a:             {start:  54, stop:  57, fps:  7, loop:false},
  pain_b:             {start:  58, stop:  61, fps:  7, loop:false},
  pain_c:             {start:  62, stop:  65, fps:  7, loop:false},
  jump:               {start:  66, stop:  71, fps:  7, loop:true},
  flip:               {start:  72, stop:  83, fps:  7, loop:true},
  salute:             {start:  84, stop:  94, fps:  7, loop:true},
  fallback:           {start:  95, stop: 111, fps: 10, loop:false},
  wave:               {start: 112, stop: 122, fps:  7, loop:true},
  point:              {start: 123, stop: 134, fps:  6, loop:true},
  crouch_stand:       {start: 135, stop: 153, fps: 10, loop:true},
  crouch_walk:        {start: 154, stop: 159, fps:  7, loop:true},
  crouch_attack:      {start: 160, stop: 168, fps: 10, loop:true},
  crouch_pain:        {start: 196, stop: 172, fps:  7, loop:false},
  crouch_death:       {start: 173, stop: 177, fps:  5, loop:false},
  death_fallback:     {start: 178, stop: 183, fps:  7, loop:false},
  death_fallforward:  {start: 184, stop: 189, fps:  7, loop:false},
  death_fallbackslow: {start: 190, stop: 197, fps:  7, loop:false},
  boom:               {start: 198, stop: 198, fps:  5, loop:false}
};

MD2.animation_names = [];

// each animation should have a reference to its own name.
for (var id in MD2.animations)
{
  MD2.animations[id].name = id;
  MD2.animation_names.push(id);
}

/* Normals are precalculated for MD2 models. */
MD2.normals = [
  [-0.525731,  0.000000,  0.850651], [-0.442863,  0.238856,  0.864188], [-0.295242,  0.000000,  0.955423], 
  [-0.309017,  0.500000,  0.809017], [-0.162460,  0.262866,  0.951056], [ 0.000000,  0.000000,  1.000000], 
  [ 0.000000,  0.850651,  0.525731], [-0.147621,  0.716567,  0.681718], [ 0.147621,  0.716567,  0.681718], 
  [ 0.000000,  0.525731,  0.850651], [ 0.309017,  0.500000,  0.809017], [ 0.525731,  0.000000,  0.850651], 
  [ 0.295242,  0.000000,  0.955423], [ 0.442863,  0.238856,  0.864188], [ 0.162460,  0.262866,  0.951056], 
  [-0.681718,  0.147621,  0.716567], [-0.809017,  0.309017,  0.500000], [-0.587785,  0.425325,  0.688191], 
  [-0.850651,  0.525731,  0.000000], [-0.864188,  0.442863,  0.238856], [-0.716567,  0.681718,  0.147621], 
  [-0.688191,  0.587785,  0.425325], [-0.500000,  0.809017,  0.309017], [-0.238856,  0.864188,  0.442863], 
  [-0.425325,  0.688191,  0.587785], [-0.716567,  0.681718, -0.147621], [-0.500000,  0.809017, -0.309017], 
  [-0.525731,  0.850651,  0.000000], [ 0.000000,  0.850651, -0.525731], [-0.238856,  0.864188, -0.442863], 
  [ 0.000000,  0.955423, -0.295242], [-0.262866,  0.951056, -0.162460], [ 0.000000,  1.000000,  0.000000], 
  [ 0.000000,  0.955423,  0.295242], [-0.262866,  0.951056,  0.162460], [ 0.238856,  0.864188,  0.442863], 
  [ 0.262866,  0.951056,  0.162460], [ 0.500000,  0.809017,  0.309017], [ 0.238856,  0.864188, -0.442863], 
  [ 0.262866,  0.951056, -0.162460], [ 0.500000,  0.809017, -0.309017], [ 0.850651,  0.525731,  0.000000], 
  [ 0.716567,  0.681718,  0.147621], [ 0.716567,  0.681718, -0.147621], [ 0.525731,  0.850651,  0.000000], 
  [ 0.425325,  0.688191,  0.587785], [ 0.864188,  0.442863,  0.238856], [ 0.688191,  0.587785,  0.425325], 
  [ 0.809017,  0.309017,  0.500000], [ 0.681718,  0.147621,  0.716567], [ 0.587785,  0.425325,  0.688191], 
  [ 0.955423,  0.295242,  0.000000], [ 1.000000,  0.000000,  0.000000], [ 0.951056,  0.162460,  0.262866], 
  [ 0.850651, -0.525731,  0.000000], [ 0.955423, -0.295242,  0.000000], [ 0.864188, -0.442863,  0.238856], 
  [ 0.951056, -0.162460,  0.262866], [ 0.809017, -0.309017,  0.500000], [ 0.681718, -0.147621,  0.716567], 
  [ 0.850651,  0.000000,  0.525731], [ 0.864188,  0.442863, -0.238856], [ 0.809017,  0.309017, -0.500000], 
  [ 0.951056,  0.162460, -0.262866], [ 0.525731,  0.000000, -0.850651], [ 0.681718,  0.147621, -0.716567], 
  [ 0.681718, -0.147621, -0.716567], [ 0.850651,  0.000000, -0.525731], [ 0.809017, -0.309017, -0.500000], 
  [ 0.864188, -0.442863, -0.238856], [ 0.951056, -0.162460, -0.262866], [ 0.147621,  0.716567, -0.681718], 
  [ 0.309017,  0.500000, -0.809017], [ 0.425325,  0.688191, -0.587785], [ 0.442863,  0.238856, -0.864188],
  [ 0.587785,  0.425325, -0.688191], [ 0.688191,  0.587785, -0.425325], [-0.147621,  0.716567, -0.681718], 
  [-0.309017,  0.500000, -0.809017], [ 0.000000,  0.525731, -0.850651], [-0.525731,  0.000000, -0.850651], 
  [-0.442863,  0.238856, -0.864188], [-0.295242,  0.000000, -0.955423], [-0.162460,  0.262866, -0.951056], 
  [ 0.000000,  0.000000, -1.000000], [ 0.295242,  0.000000, -0.955423], [ 0.162460,  0.262866, -0.951056], 
  [-0.442863, -0.238856, -0.864188], [-0.309017, -0.500000, -0.809017], [-0.162460, -0.262866, -0.951056], 
  [ 0.000000, -0.850651, -0.525731], [-0.147621, -0.716567, -0.681718], [ 0.147621, -0.716567, -0.681718], 
  [ 0.000000, -0.525731, -0.850651], [ 0.309017, -0.500000, -0.809017], [ 0.442863, -0.238856, -0.864188], 
  [ 0.162460, -0.262866, -0.951056], [ 0.238856, -0.864188, -0.442863], [ 0.500000, -0.809017, -0.309017], 
  [ 0.425325, -0.688191, -0.587785], [ 0.716567, -0.681718, -0.147621], [ 0.688191, -0.587785, -0.425325], 
  [ 0.587785, -0.425325, -0.688191], [ 0.000000, -0.955423, -0.295242], [ 0.000000, -1.000000,  0.000000], 
  [ 0.262866, -0.951056, -0.162460], [ 0.000000, -0.850651,  0.525731], [ 0.000000, -0.955423,  0.295242], 
  [ 0.238856, -0.864188,  0.442863], [ 0.262866, -0.951056,  0.162460], [ 0.500000, -0.809017,  0.309017], 
  [ 0.716567, -0.681718,  0.147621], [ 0.525731, -0.850651,  0.000000], [-0.238856, -0.864188, -0.442863], 
  [-0.500000, -0.809017, -0.309017], [-0.262866, -0.951056, -0.162460], [-0.850651, -0.525731,  0.000000], 
  [-0.716567, -0.681718, -0.147621], [-0.716567, -0.681718,  0.147621], [-0.525731, -0.850651,  0.000000], 
  [-0.500000, -0.809017,  0.309017], [-0.238856, -0.864188,  0.442863], [-0.262866, -0.951056,  0.162460], 
  [-0.864188, -0.442863,  0.238856], [-0.809017, -0.309017,  0.500000], [-0.688191, -0.587785,  0.425325], 
  [-0.681718, -0.147621,  0.716567], [-0.442863, -0.238856,  0.864188], [-0.587785, -0.425325,  0.688191], 
  [-0.309017, -0.500000,  0.809017], [-0.147621, -0.716567,  0.681718], [-0.425325, -0.688191,  0.587785], 
  [-0.162460, -0.262866,  0.951056], [ 0.442863, -0.238856,  0.864188], [ 0.162460, -0.262866,  0.951056], 
  [ 0.309017, -0.500000,  0.809017], [ 0.147621, -0.716567,  0.681718], [ 0.000000, -0.525731,  0.850651], 
  [ 0.425325, -0.688191,  0.587785], [ 0.587785, -0.425325,  0.688191], [ 0.688191, -0.587785,  0.425325], 
  [-0.955423,  0.295242,  0.000000], [-0.951056,  0.162460,  0.262866], [-1.000000,  0.000000,  0.000000], 
  [-0.850651,  0.000000,  0.525731], [-0.955423, -0.295242,  0.000000], [-0.951056, -0.162460,  0.262866], 
  [-0.864188,  0.442863, -0.238856], [-0.951056,  0.162460, -0.262866], [-0.809017,  0.309017, -0.500000], 
  [-0.864188, -0.442863, -0.238856], [-0.951056, -0.162460, -0.262866], [-0.809017, -0.309017, -0.500000], 
  [-0.681718,  0.147621, -0.716567], [-0.681718, -0.147621, -0.716567], [-0.850651,  0.000000, -0.525731], 
  [-0.688191,  0.587785, -0.425325], [-0.587785,  0.425325, -0.688191], [-0.425325,  0.688191, -0.587785], 
  [-0.425325, -0.688191, -0.587785], [-0.587785, -0.425325, -0.688191], [-0.688191, -0.587785, -0.425325]
];

// As said above:
// All the MD2 files I've seen so far put the up axis along Z, not Y. I'm going to assume that this
// is fairly constant and transpose the values here.
// that goes for normals too.
for (var i = 0; i < MD2.normals.length; i++)
{
  var y = MD2.normals[i][2];
  MD2.normals[i][2] = MD2.normals[i][1];
  MD2.normals[i][1] = y;
  
  // now rotate so it's in line with the camera (right now we're turned 90 degrees CCW around the Y axis)
  var x = MD2.normals[i][0], z = MD2.normals[i][2];
  var theta = -Math.PI/2;
  var vx = x * Math.cos(theta) - z * Math.sin(theta),
      vz = x * Math.sin(theta) + z * Math.cos(theta);
  MD2.normals[i][0] = vx;
  MD2.normals[i][2] = vz;
  MD2.normals[i] = MD2.normals[i].normalize();
}
