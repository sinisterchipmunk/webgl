after_initialize(function() {
  assert_equal([0,0,255,255], encodeToColor(0));
  assert_equal(0, decodeFromColor([0,0,255,255]));

  var encoded = encodeToColor(10);
  assert_equal(10, decodeFromColor(encoded));

  var log = new Logger('test');
  try {
    log.attempt("one", function() {
      log.attempt("two", function() {
        throw new Error("error");
      });
    });
  } catch(e) {
    var index = log.toString().indexOf("During 'one' =&gt; 'two': Error: error");
    assert(index < 100 && index != -1);
  }
  
  var arr = [0,1,0];
  assert([0,1,0].equals(arr), "array doesn't equal a copy of itself");
  assert(![0,0,1].equals(arr), "array equals an array with different elements");
});
