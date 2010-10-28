var MD2 = function() {
  // snapshot serves a dual purpose: it lets us only calculate the frame once and apply it to the buffers for
  // each context at the same time; and it also exposes the current vertex information to the outside world
  // without putting those buffers at risk.
  function initSnapshot(md2) {
    md2.frametracker = 0;
    var counter = 0;
      
    var frame = md2.model_data.frames[md2.currentFrame];
    for (i = 0; i < md2.model_data.triangles.length; i++)
    {
      triangle = md2.model_data.triangles[i];
      
      for (j = 0; j < 3; j++)
      {
        vindex = triangle.vertex_indices[j];
        var tindex = triangle.texcoord_indices[j];
        
        for (k = 0; k < 3; k++) md2.snapshot.vertices[counter*3+k] = (frame.vertices[vindex*3+k]);
        for (k = 0; k < 2; k++) md2.snapshot.textureCoords[counter*2+k] = (md2.model_data.texcoords[tindex][k]);
        for (k = 0; k < 3; k++) md2.snapshot.normals[counter*3+k] = (MD2.normals[frame.normal_indices[vindex]][k]);
        
        counter++;
      }
    }
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
    var i, j;
    
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

    for (j = 0; j < 3; j++)
    {
      // figure out vertex interpolation
      for (i = 0; i < currentFrame.vertices.length; i += 3)
        md2.interpolation.vertices[i+j] = targetFrame.vertices[i+j] - currentFrame.vertices[i+j];

      // figure out normal interpolation
      for (i  = 0; i < currentFrame.normal_indices.length; i++)
        md2.interpolation.normals[i*3+j] = MD2.normals[targetFrame.normal_indices[i]][j] - MD2.normals[currentFrame.normal_indices[i]][j];
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
    for (var id in md2.buffers) {
      if (md2.buffers[id])
      {
        var vertexBuffer = md2.buffers[id]['vertices'];
        var normalBuffer = md2.buffers[id]['normals'];
          
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
          var counter = 0;
          for (i = 0; i < md2.model_data.triangles.length; i++)
          {
            triangle = md2.model_data.triangles[i];
            for (j = 0; j < 3; j++)
            {
              vindex = triangle.vertex_indices[j];
              
              for (k = 0; k < 3; k++)
              {
                md2.snapshot.vertices[counter] += md2.interpolation.vertices[vindex*3+k] * percentage;
                md2.snapshot.normals[counter] += md2.interpolation.normals[vindex*3+k] * percentage;
                counter++;
              }
            }
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
    
    init: function(vertices, colors, textureCoords, normals, indices) {
      this.draw_mode = GL_TRIANGLES;
      this.fps = 10;
      
      snapshot(this);
      var i, j;
      for (j = 0; j < this.snapshot.vertices.length; j++)
        vertices.push(this.snapshot.vertices[j]);
      for (j = 0; j < this.snapshot.textureCoords.length; j++)
        textureCoords.push(this.snapshot.textureCoords[j]);
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
        if (response.responseJSON == null) throw new Error("Could not parse a JSON object from the response text:\n\n"+response.responseText);
        
        /* first unpack the frame data so the model can worry about important stuff */
        for (var i = 0; i < response.responseJSON.frames.length; i++)
        {
          var frame = response.responseJSON.frames[i];
          for (var j = 0; j < frame.vertices.length; j += 3)
          {
            for (var k = 0; k < 3; k++)
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

// each animation should have a reference to its own name.
for (var id in MD2.animations)
  MD2.animations[id].name = id;

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
