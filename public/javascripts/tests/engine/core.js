after_initialize(function() {
  assert_equal([0,0,255,255], encodeToColor(0));
  assert_equal(0, decodeFromColor([0,0,255,255]));
  
  var encoded = encodeToColor(10);
  assert_equal(10, decodeFromColor(encoded));
});
