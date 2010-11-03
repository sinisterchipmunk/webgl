logger.attempt('unit tests', function() {
  logger.level = Logger.DEBUG;
  var canvas = document.createElement('canvas');
  canvas.setAttribute('id', 'test-canvas');
  var context = new WebGLContext(canvas);
  context.stopRendering();

  var renderable = new Renderable();
  renderable.mesh.setGLBuffer(context, 'a-buffer', [1]);
  assert_equal([1], renderable.mesh.getGLBuffer(context, 'a-buffer'));
  
  renderable.mesh.setGLVertexBuffer(context, [1,2,3]);
  assert_equal([1,2,3], renderable.mesh.getGLVertexBuffer(context));
});
