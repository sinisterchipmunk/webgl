// each object should have its own instance of Animation so that it can
// be stopped, started, etc. independently of other objects. However, the
// data used by those Animations is shared, so this is OK.
var Animation = (function() {
  // calculates interpolation from current frame to next frame. This amount will
  // be multiplied by the interpolation percentage, which is increased based on
  // timechange via calls to #update.
  function interpolate(anim)
  {
    var next = anim.nextFrame();
    var current = anim.currentFrame();
    var i, j;
    
    // figure out vertex information
    for (i = 0; i < current.vertices.length; i++)
    {
      anim.interpolation.vertices[i] = next.vertices[i] - current.vertices[i];
      anim.interpolation.normals[i]  = next.normals[i]  - current.normals[i];
    }

    // reset the timer and mark the interpolation as valid
    anim.interpolation.timer = 0;
    anim.interpolation.timeout = 1.0 / anim.meta.fps;
    anim.interpolation.valid = true;
  }

  return Class.create({
    initialize: function(meta, options)
    {
      if (!options.frames) throw new Error("No frame data given!");
      if (!meta) throw new Error("No meta data given!");
      
      // meta contains: start, stop, fps, name, loop
      this.name    = meta.name;
      this.meta    = meta;
      this.frames  = options.frames;
      this.loop    = (typeof(options.loop) == "undefined") ? meta.loop : options.loop;
      this.playing = true;
      this.interpolation = {vertices:{},normals:{}};
      this.current = meta.start;
    },
    
    currentFrameIndex: function() { return this.current; },
    
    /* Returns the next frame index. If the animation has ended, the current index is returned.
       If the animation has ended and is set to loop, the first index is returned. */
    nextFrameIndex: function() {
      var current = this.currentFrameIndex(), fi = current + 1;
      if (fi > this.meta.stop)
        if (this.loop) return this.meta.start;
        else return current;
      else return fi;
    },
    
    currentFrame: function() { return this.frames[this.currentFrameIndex()]; },
    nextFrame: function() { return this.frames[this.nextFrameIndex()]; },
    
    /* "steps" ahead a number of frames. The default is 1. */
    step: function(distance) {
      this.interpolation.valid = false;
      if (typeof(distance) != "number") distance = 1;
      for (var i = 0; i < distance; i++)
        this.current = this.nextFrameIndex();
    },
    
    /* update should be called by the object which is being animated. It expects two arguments:
        self - the object being animated (expected to be an instance of Renderable).
        timechange - the number of seconds since the last call to #update.
     */
    update: function(self, timechange) {
      if (!this.interpolation.valid)
        interpolate(this);
      else
      {
        var i, current = this.currentFrame();
        this.interpolation.timer += timechange;
        var pcnt = (this.interpolation.timer / this.interpolation.timeout);

        if (pcnt > 0)
        {
          // have we run out the timer?
          if (1 - pcnt <= Math.EPSILON)
          { //...yes
            this.step();
            pcnt = 1;
          }
          
          var v = self.mesh.getVertexBuffer(), n = self.mesh.getNormalBuffer();
          if (v && n)
          {
            for (i = 0; i < v.js.length; i++)
            {
              v.js[i] = (current.vertices[i] + (this.interpolation.vertices[i] * pcnt)) * self.scale;
              n.js[i] = (current.normals[i]  + (this.interpolation.normals[i]  * pcnt)); // don't scale normals :)
            }
            v.refresh();
            n.refresh();
          }
        }
      }
    }
  });
})();
