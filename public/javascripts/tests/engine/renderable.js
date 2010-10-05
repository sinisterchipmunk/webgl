logger.attempt('unit tests', function() {
  logger.level = Logger.DEBUG;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('id', 'test-canvas');
  var context = new WebGLContext(canvas);
  context.stopRendering();

  var renderable = new Renderable();
  renderable.setGLBuffer(context, 'a-buffer', [1]);
  assert_equal([1], renderable.getGLBuffer(context, 'a-buffer'));
  
  renderable.setGLVertexBuffer(context, [1,2,3]);
  assert_equal([1,2,3], renderable.getGLVertexBuffer(context));
});
