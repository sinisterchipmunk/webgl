function assert(cond, msg)
{
  try {
    if (!cond) { throw new Error(msg || "Assertion failed!"); }
  }
  catch (e) {
    logger.error(e+"\n\n"+e.stack);
  }
}

function assert_not_equal(not_expected, actual, message)
{
  try { if ((!not_expected.equals || !not_expected.equals(actual)) && not_expected != actual) return; }
  catch (e) { if (not_expected != actual) return; }
  
  message = message || "Expected <"+actual.toString()+"> to not equal <"+not_expected.toString()+">";
  assert(false, message);
}

function assert_equal(expected, actual, message)
{
  try { if (expected.equals && expected.equals(actual) || expected == actual) return; }
  catch (e) { if (expected == actual) return; }
  
  message = message || "Expected <"+actual.toString()+"> to equal <"+expected.toString()+">";
  assert(false, message);
}

function assert_false(cond, msg)
{
  assert(!cond, msg);
}

function assert_defined(obj, msg)
{
  assert(obj, msg || "Expected value to be defined");
}
