var Skeleton = function() {
  function buildBone(bone, start, vertices, scale)
  {
    var offset = start.plus(bone.offset);
    var i;
    
    // skeleton is rendered as GL_LINES, so we need to add 2 vertices: one for bone start, one for bone end.
    vertices.push(start[0]*scale,  start[1]*scale,  start[2]*scale);
    vertices.push(offset[0]*scale, offset[1]*scale, offset[2]*scale);
    
    for (i = 0; i < bone.joints.length; i++)
      buildBone(bone.joints[i], offset, vertices, scale);
  }
  
  function update(self, timechange)
  {
    logger.attempt("-update", function() {
      if (self.interpolation.remaining <= Math.EPSILON)
        self.nextKeyframe();

      //self.interpolation.tally = self.interpolation.tally || 0;
      // self.interpolation == {remaining:duration, movement:offsetPerSec, rotation:rotationsPerSec};
      var interp = { movement: self.interpolation.movement.times(timechange), 
                     rotation: self.interpolation.rotation.times(timechange) };
      // update interpolation so that we're counting down to something
      self.interpolation.remaining -= timechange;
      //self.interpolation.tally += timechange;
      
      
      self.currentFrame.position = self.currentFrame.position.plus(interp.movement);
      self.currentFrame.rotations = self.currentFrame.rotations.plus(interp.rotation);
          
      for (var id in self.buffers) {
        if (self.buffers[id])
        {
          var index = 0;
          function rotateAboutCenter2D(pX, pY, cX, cY, rads, result)
          {
            var dX = pX-cX;                         // distance along X
            var dY = pY-cY;                         // distance along Y
            var radsToPt = Math.atan2(dY, dX);           // tan = opposite / adjacent
            var hypotenuse = Math.sqrt(dX*dX + dY*dY);   // c^2 = a^2 + b^2               
            var newAngle   = radsToPt + rads;       // the angle we want from the center to our point
            pX = hypotenuse*Math.cos(newAngle)+cX;    // cos = adj / hyp
            pY = hypotenuse*Math.sin(newAngle)+cY;    // sin = opp / hyp
            
            result[0] = pX;
            result[1] = pY;
          }
          
          function rotatePointAroundPoint(p, c, pitchX, yawY, rollZ)
          {
            var r = [];
            rotateAboutCenter2D( p[0], p[2], c[0], c[2], pitchX, r );
            p[0] = r[0];
            p[2] = r[1];
            rotateAboutCenter2D( p[0], p[1], c[0], c[1], yawY  , r );
            p[0] = r[0];
            p[1] = r[1];
            rotateAboutCenter2D( p[1], p[0], c[1], c[0], rollZ , r );
            p[1] = r[0];
            p[0] = r[1];
          }
          
          function updateVertex(buf, node, start, rotationArray, rotation)
          {
            var newRotation = [rotationArray[index*3], rotationArray[index*3+1], rotationArray[index*3+2]];
            rotation = rotation.plus(newRotation);
            
            var i = index*6;
            var offset = start.plus(node.offset.times(self.scale));
            
            rotatePointAroundPoint(offset, start, rotation[0], rotation[1], rotation[2]);
            
            // handle translation
            for (var j = 0; j < 3; j++)
            {
              buf[i+j]   = start[j]*self.scale;
              buf[i+j+3] = offset[j]*self.scale;
            }
            
            index += 1;
            for (i = 0; i < node.joints.length; i++)
              updateVertex(buf, node.joints[i], offset, rotationArray, rotation);
          }
          var vertexBuffer = self.buffers[id]['vertices'];
          updateVertex(vertexBuffer.js, self.root, self.currentFrame.position, self.currentFrame.rotations, [0,0,0]);
          vertexBuffer.refresh();
        }
      }      
    });
  }
  
  return Class.create(Renderable, {
    /*
      Options include:
        bones: the bones which make up this Skeleton. Mandatory. Each bone must contain a name, offset and joints
               (array of sub-bones).
        keyframes: optional array of keyframes. Each keyframe object must contain offset, rotations and frame time.
        timeScale: optional multiplier. Each frame time will be multiplied by this amount. Defaults to 1.
        scale: optional multiplier. Bone offsets and positions will be multiplied by this amount.
        
      Example:
        new Skeleton({bones: {name:Hips,
                              offset:[0.0,0.0,0.0],
                              joints:[{name:"Chest",
                                       offset:[0.0,4.57,0.0],
                                       joints:[]},
                                        { ... }]},
                      keyframes: [{offset:[0.010345,34.72909,0.833995],
                                   rotations:[-0.01,0.12, ... ],
                                   time: 0.033}],
                      timeScale: 1,
                      scale: 0.25
                    });
     */
    initialize: function($super, options) {
      this.DRAW_MODE = GL_LINES;
      this.keyframes = [];
      this.playing = false;
      this.loop = true;
      
      var bones = options.bones;
      var keyframes = options.keyframes;
      this.timeScale = options.timescale || 1;
      this.scale = options.scale || 1;
      
      if (!bones) throw new Error("No bones given!");
      this.bones(bones);
      if (keyframes)
        for (var i = 0; i < keyframes.length; i++)
          this.addKeyframe(keyframes[i].time, keyframes[i].offset, keyframes[i].rotations);
      
      $super();
    },
    
    play: function() {
      this.interpolate();
      //this.nextKeyframe();
      this.playing = true;
    },
    
    nextKeyframe: function() {
      this.currentKeyframe = this.targetKeyframe || 0;
      this.targetKeyframe = this.currentKeyframe + 1;
      if (this.loop && this.keyframes.length <= this.targetKeyframe) {
        this.currentKeyframe = this.keyframes.length - 1;
        this.targetKeyframe = 0;
      }
      this.interpolate();
    },
    
    interpolate: function() {
      if (this.keyframes.length == 0) throw new Error("No keyframes!");
      
      this.currentKeyframe = this.currentKeyframe || 0;
      this.targetKeyframe = this.targetKeyframe || (this.currentKeyframe + 1) % this.keyframes.length;

      this.currentFrame = {
                            position:this.keyframes[this.currentKeyframe].offset,
                            rotations:this.keyframes[this.currentKeyframe].rotations
                          };
      if (this.targetKeyframe < this.keyframes.length)
        this.interpolation = this.keyframes[this.targetKeyframe].interpolate(this.keyframes[this.currentKeyframe], this.timeScale);
      else
        this.interpolation = null;
    },
    
    stop: function() {
      this.playing = false;
    },
    
    bones: function(root) {
      if (root)
        this.root = new Bone(root);
      return this.root;
    },
    
    setScale: function(scale) {
      this.scale = scale;
      this.interpolate();
      update(this, 0);
    },
    
    init: function(vertices, colors, textureCoords, normals, indices) {
      buildBone(this.root, [0,0,0], vertices, this.scale);
    },
    
    update: function(timechange)
    {
      var self = this;
      logger.attempt("Skeleton#update", function() {
        // we'll update the vertex locations here using gl.bufferData(). Since this won't create or destroy anything, only
        // alter existing, we won't need to rebuild the object.
        if (self.playing && self.interpolation) {
          update(self, timechange);
        }
      });
    },
    
    /*
      See the Keyframe() function for information about these arguments.
      
      Note, a single instance of Keyframe() can be passed instead of the arguments shown.
     */
    addKeyframe: function(time, offset, rotations) {
      var keyframe;
      if (time && time.rotations) keyframe = time;
      else keyframe = new Keyframe(time, offset, rotations);
      this.keyframes.push(keyframe);
    }
  });
}();

var Bone = Class.create({
  initialize: function(bone) {
    //if (!bone.name) throw new Error("Every bone must have a name."); // or does it?
    this.offset = bone.offset || [0,0,0];
    this.joints = [];
    this.name   = bone.name;
    
    for (var i = 0; i < (bone.joints || []).length; i++)
      this.joints[i] = new Bone(bone.joints[i]);
  }
});

var Keyframe = Class.create({
  /*
    Time is the seconds elapsed between the last keyframe and the current one. Time is ignored for the first keyframe in
    the animation. Note that the time in the first keyframe is, however, used to loop the animation from the last
    keyframe back to the first. If null, the keyframe values will be assigned immediately in all cases.
  
    Offset is a 3D vector (X, Y, Z).
     
    Rotations is an array of values divisible by 3. Each value in the rotations
    array is expected to be a single X, Y, or Z value, and must appear in that order. There must be enough sets of 3
    values for every bone in this skeleton, or else an error will be thrown.
  */
  initialize: function(time, offset, rotations) {
    if (!offset || !rotations) throw new Error("Offset and rotations are required!");
    this.time = time;
    this.offset = offset;
    this.rotations = rotations;
  },
  
  /* 
    Returns the result of interpolating this keyframe over the course of its duration, compared to the values of the
    given keyframe. Essentially:
    
      keyframe.normalize(otherKeyframe)
      #=> (keyframe - otherKeyframe) / keyframe.duration
      
    This can be used as a value-per-second to be multiplied against timechange in Skeleton#update.
   */
  interpolate: function(previous, timeScale) {
    timeScale = timeScale || 1;
    if (!previous) throw new Error("Expected a keyframe!");
    var offset = this.offset.minus(previous.offset);
    var duration = this.time && this.time * timeScale; // how many seconds must pass
    var offsetPerSec = offset;
    if (duration)
      offsetPerSec = offset.dividedBy(duration); // how far to move per second
    var rotationsPerSec = [];
    for (var i = 0; i < this.rotations.length; i++) {
      // how far to rotate per second
      rotationsPerSec[i] = this.rotations[i] - previous.rotations[i];
      rotationsPerSec[i] = duration ? rotationsPerSec[i] / duration : rotationsPerSec[i];
    }
    
    return {remaining:duration, movement:offsetPerSec, rotation:rotationsPerSec};
  }
});

Skeleton.load = function(path, func) {
  new Ajax.Request(path, {method: "get", evalJSON: true, onSuccess: function(resp) {
    logger.attempt("Skeleton#load", function() {
      var skeleton = new Skeleton(resp.responseJSON);
      func(skeleton);
    });
  }});
};
