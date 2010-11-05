var AI = Class.create({
  initialize: function(attributes) {
    var ai = this;
    ai.id = attributes.id;
    ai.name = attributes.name;
    ai.base_id = attributes.base_id;
    
    /* TODO: add these to the record attributes */
    ai.speed = 15;
  },
  
  // takes two arguments:
  //   self -- the object which this AI is representing
  //   timechange -- how much time has passed since last update
  //   scene -- if given, the scene will have a chance to alter
  //            the actor's movements.
  update: function(self, timechange, scene) {
//    if (this.isMoving(self))
    
    if (this.isMoving(self))
    {
      /* TODO implement acceleration/deceleration */
      var total_movement = this.speed*timechange;
      
      var current = self.orientation.getPosition();
      var distance = self.movement.destination.minus(current[0], current[1]+self.lowest(), current[2]);
      var direction = distance.normalize();
      var difference = direction.times(total_movement);
      // don't go too far!
      if (total_movement > distance.magnitude())
      {
        difference = distance;
        self.movement.destination = null;
      }
      
      direction[1] = 0;
      self.orientation.setView(direction);
      self.orientation.setPosition(current.plus(difference));
      
      if (!this.isMoving(self)) {
        self.movement.destination = null;
        self.movement.interpolation.distance = null;
      }
    }
    else if (self.movement.interpolation && self.movement.interpolation.completion)
    {
      self.movement.interpolation.completion(self);
      self.movement.interpolation.completion = null;
    }
  },
  
  moveTo: function(self, destination, completion)
  {
    var distance = destination.minus(self.orientation.getPosition());
    var direction = distance.normalize();
    self.movement.destination = destination;
    self.orientation.setView(direction);
    self.movement.interpolation = {
      completion: completion
    };
  },
  
  isMoving: function(self) {
    return self.movement.destination && !self.orientation.getPosition().equals(self.movement.destination) &&
           self.movement.interpolation;
  }
});

AI.instance = function(attributes) { return instanceFor(AI, attributes); };

var MovementDescriptor = Class.create({
  initialize: function() {
    this.destination = null;
  }
});
