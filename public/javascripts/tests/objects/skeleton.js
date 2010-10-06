(function() {
  logger.attempt("skeleton tests", function() {
    var skeleton = new Skeleton({bones:{name     :"one",
                                 offset   :[0,0,0],
                                 joints   :[{name   :"two",
                                             offset  :[1,1,1],
                                             joints  :[]}]}});
  
    logger.attempt("keyframe tests", function() {
      var key1 = new Keyframe(null, [ 0,0,0], [0,0,0, 0,0,0, 0,0,0]);
      var key2 = new Keyframe( 1.0, [-1,0,0], [0,0,0, 0,0,1, 0,0,0]);
    
      var interp = key2.interpolate(key1);
    
      assert_equal(1.0,                   interp.remaining);
      assert_equal([-1,0,0],              interp.movement);
      assert_equal([0,0,0, 0,0,1, 0,0,0], interp.rotation);
    
      key2 = new Keyframe(3.0, [-1,0,0], [0,0,0, 0,0,1, 0,0,0]);
      interp = key2.interpolate(key1);
      assert_equal(3.0,                     interp.remaining);
      assert_equal([-1/3,0,0],              interp.movement);
      assert_equal([0,0,0, 0,0,1/3, 0,0,0], interp.rotation);
    });
  });
})();
