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
});
