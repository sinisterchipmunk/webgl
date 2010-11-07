var Skeleton = function() {
  function buildBone(bone, start, vertices, indices, scale, parent_index)
  {
    var offset = start.plus(bone.offset);
    var i, index;
    
    index = vertices.length / 3;
    bone.index = index;
    vertices.push(offset[0]*scale, offset[1]*scale, offset[2]*scale);

    if (!bone.isRoot) {
      // skeleton is rendered as GL_LINES, so we need to add 2 indices: one for bone start, one for bone end.
      bone.parentIndex = parent_index;
      
      indices.push(parent_index);
      indices.push(index);
    }
    
    for (i = 0; i < bone.joints.length; i++)
    {
      buildBone(bone.joints[i], offset, vertices, indices, scale, index);
    }
    return index;
  }
  
  function snapshot(self, buffer) {
    var index = 0;

    function updateVertex(node, start, rotationArray, rotation)
    {
      index = node.index*3;
            
      var t = Matrix.Translation(Vector.create(node.offset));
      rotation = rotation.x(t);

      var offset = [rotation.elements[0][3], rotation.elements[1][3], rotation.elements[2][3]];

      if (rotationArray)
      {
        var newRotation = [rotationArray[index], rotationArray[index+1], rotationArray[index+2]];
        var rx = Matrix.RotationX(newRotation[0]),
            ry = Matrix.RotationY(newRotation[1]),
            rz = Matrix.RotationZ(newRotation[2]);
        var rotm = ry.x(rx).x(rz).ensure4x4();
        rotation = rotation.x(rotm);
        //rotation = rotm.x(rotation);
      }

      // update positions
      for (var j = 0; j < 3; j++)
        buffer[index+j] = (start[j]+offset[j])*self.scale;
            
      index += 1;
      for (var i = 0; i < node.joints.length; i++)
        updateVertex(node.joints[i], start, rotationArray, rotation);
    }
    updateVertex(self.root,
                 self.currentFrame && self.currentFrame.position  || [0,0,0],
                 self.currentFrame && self.currentFrame.rotations || null,
                 Matrix.I(4));
                 //[0,0,0]);
  }
  
  function update(self, timechange)
  {
    logger.attempt("Skeleton#-update", function() {
      if (self.interpolation && timechange) {
        if (self.interpolation.remaining <= Math.EPSILON)
          self.nextKeyframe();
        
        var interp = { movement: self.interpolation.movement.times(timechange), 
                       rotation: self.interpolation.rotation.times(timechange) };

        // update interpolation so that we're counting down to something
        self.interpolation.remaining -= timechange;
      
        self.currentFrame.position = self.currentFrame.position.plus(interp.movement);
        self.currentFrame.rotations = self.currentFrame.rotations.plus(interp.rotation);
      }
      
      // snapshot serves a dual purpose: it lets us only calculate the frame once and apply it to all buffers; and it
      // also exposes the current frame to the outside.
      snapshot(self, self.snapshot);
      
      var vertexBuffer = self.mesh.getVertexBuffer();
      for (var i = 0; i < self.snapshot.length; i++)
        vertexBuffer.js[i] = self.snapshot[i];
      vertexBuffer.refresh();
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
      this.draw_mode = GL_LINES;
      this.keyframes = [];
      this.playing = false;
      this.loop = true;
      
      var bones = options.bones;
      var keyframes = options.keyframes;
      this.timeScale = options.timeScale || 1;
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
      var current = this.currentKeyframe;
      if (typeof(current) != "number") current = -1;
      this.setCurrentKeyframe(current+1);
    },
    
    previousKeyframe: function() {
      var current = this.currentKeyframe;
      if (typeof(current) != "number") current = 1;
      this.setCurrentKeyframe(current-1);
    },
    
    setCurrentKeyframe: function(index) {
      if (this.keyframes.length > 0 && index != null)
      {
        index = index % this.keyframes.length;
        this.currentKeyframe = index;
        this.targetKeyframe = index + 1;
        if (this.loop && this.keyframes.length <= this.targetKeyframe) {
          this.currentKeyframe = this.keyframes.length - 1;
          this.targetKeyframe = 0;
        }
      }
      else {
        index = null;
        this.currentKeyframe = this.targetKeyframe = null;
      }
      this.matchKeyframe(index);
      this.interpolate();
    },
    
    matchKeyframe: function(index) {
      if (typeof(index) == "undefined")
        index = this.currentKeyframe;
      
      if (index != null) {
        if (index < 0 || index >= this.keyframes.length) throw new Error("Invalid keyframe index!");
      
        this.currentFrame = {
                              position:this.keyframes[index].offset,
                              rotations:this.keyframes[index].rotations
                            };
      }
      else {
        this.currentFrame = {
          position:[0,0,0],
          rotations:this.restingStateRotations()
        };
      }
      this.refresh();
    },
    
    /* Returns an array of rotations -- an X, Y and Z rotation for every bone in the skeleton. This can be passed into
      the 'rotations' argument of addKeyframe().
     */
    restingStateRotations: function() {
      result = [];
      for (var i = 0; i < this.all.length; i++)
        result.push(0,0,0);
      return result;
    },
    
    interpolate: function() {
      if (this.keyframes.length == 0) throw new Error("No keyframes!");
      
      this.currentKeyframe = this.currentKeyframe || 0;
      this.targetKeyframe = this.targetKeyframe || (this.currentKeyframe + 1) % this.keyframes.length;

      this.currentFrame = this.currentFrame || {
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
      {
        this.root = new Bone(root);
        this.all = this.root.all();
        this.root.isRoot = true;
      }
      return this.root;
    },
    
    setScale: function(scale) {
      this.scale = scale;
      this.interpolate();
      update(this, 0);
    },
    
    init: function(vertices, colors, textureCoords, normals, indices) {
      buildBone(this.root, [0,0,0], vertices, indices, this.scale);
      this.snapshot = [];
      for (var i = 0; i < vertices.length; i++)
        this.snapshot[i] = vertices[i];
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
    
    refresh: function() {
      var self = this;
      logger.attempt("Skeleton#update", function() {
        // we'll update the vertex locations here using gl.bufferData(). Since this won't create or destroy anything, only
        // alter existing, we won't need to rebuild the object.
        update(self, 0);
      });
    },
    
    /*
      See the Keyframe() function for information about these arguments.
      
      Note, a single instance of Keyframe() can be passed instead of the arguments shown.
      
      The 'index' argument is optional. If specified, the keyframe will be added *following* the keyframe represented
      by the index. If the index is null, the keyframe will be added to the beginning of the animation.
     */
    addKeyframe: function(time, offset, rotations, index) {
      var keyframe;
      if (time && time.rotations) keyframe = time;
      else keyframe = new Keyframe(time, offset, rotations);
      var result = this.keyframes.length;
      if (typeof(index) != "undefined") {
        if (index == null) { this.keyframes.splice(0, 0, keyframe); result = 0; }
        else { this.keyframes.splice(index+1, 0, keyframe); result = index+1; }
      }
      else {
        this.keyframes.push(keyframe);
      }
      return result;
    }
  });
}();

var Bone = Class.create({
  initialize: function(bone) {
    //if (!bone.name) throw new Error("Every bone must have a name."); // or does it?
    this.offset = bone.offset || [0,0,0];
    this.joints = [];
    this.name   = bone.name;
    this.object_id = ++Renderable.identifier;
    
    for (var i = 0; i < (bone.joints || []).length; i++)
      this.joints[i] = new Bone(bone.joints[i]);
  },
  
  all: function() {
    var result = {length:1};
    var joints;
    result[this.object_id] = this;
    for (var i = 0; i < this.joints.length; i++)
    {
      joints = this.joints[i].all();
      result.length += joints.length;
      for (var x in joints)
      {
        if (x == "length") continue;
        result[x] = joints[x];
      }
    }
    return result;
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

Skeleton.load = function(path, options, func) {
  if (!func && typeof(options) == "function") { func = options; options = {}; }
  
  new Ajax.Request(path, {method: "get", evalJSON: true, onSuccess: function(resp) {
    logger.attempt("Skeleton#load", function() {
      for (var i in resp.responseJSON)
        if (typeof(options[i]) == "undefined") options[i] = resp.responseJSON[i];
      var skeleton = new Skeleton(options);
      func(skeleton);
    });
  }});
};
