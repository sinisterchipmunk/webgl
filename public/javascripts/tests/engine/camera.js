function vectorTests()
{
  var vec;
  
  vec = [0,0,0];
  // equality
  assert_equal([0,0,0], vec);
  assert_not_equal([1], [NaN]);
  
  // normalization
  assert_equal([1], [3].normalize());
  assert_equal([2/Math.sqrt(2*2+2*2), 2/Math.sqrt(2*2+2*2)], [2,2].normalize());
  assert_equal([2/Math.sqrt(2*2+2*2+2*2), 2/Math.sqrt(2*2+2*2+2*2), 2/Math.sqrt(2*2+2*2+2*2)], [2,2,2].normalize());
  assert_equal([2/Math.sqrt(2*2+2*2+2*2+2*2), 2/Math.sqrt(2*2+2*2+2*2+2*2), 2/Math.sqrt(2*2+2*2+2*2+2*2), 2/Math.sqrt(2*2+2*2+2*2+2*2)],
                [2,2,2,2].normalize());
  
  // magnitude
  assert_equal(Math.sqrt(2*2+3*3), [2,3].magnitude());
  assert_equal(Math.sqrt(2*2+3*3+4*4), [2,3,4].magnitude());
  
  // cross product
  assert_equal([18,-11,19], [2,5,1].cross([-3,2,4]));
  
  // dot product
  assert_equal(4, [2,5].dot([-3,2]));
  
  // orthogonality
  assert([0,1,0].isOrthogonalWith([1,0,0]), "not orthogonal");
  
  // projection
  assert_equal([6/25, -8/25], [2,1].projectOnto([-3,4]));
  
  // distance
  assert_equal(Math.sqrt(2*2+2*2), [10,10].distanceFrom([12,12]));
  
  // scale
  assert_equal([2,2,2], [1,1,1].scale(2));
  assert_equal([4,4,4], [2,2,2].scale(2,2,2));
  
  // isNormal
  assert([1,0,0].isNormal(), "not normal");
  assert([2,3,4].normalize().isNormal(), "not normal");
  assert_false([2,3,4].isNormal(), "is normal");
  
  // negation
  assert_equal([-1,-1,-1], [1,1,1].negate());
  
  // multiplication
  assert_equal([4,6,8], [2,2,2].multiply(2,3,4));
  assert_equal([6,6,6], [2,2,2].multiply(3));
  
  // division
  assert_equal([1,1,1], [2,3,4].divide(2,3,4));
  assert_equal([1,1,1], [2,2,2].divide(2));

  // addition
  assert_equal([4,5,6], [2,2,2].plus(2,3,4));
  assert_equal([4,4,4], [2,2,2].plus(2));

  // subtraction
  assert_equal([0,-1,-2], [2,2,2].minus(2,3,4));
  assert_equal([0,0,0], [2,2,2].minus(2));
}

function matrixTests()
{
  var matrix;
  function test(expected, func) {
    matrix = Matrix.I(4);
    assert_equal(expected, func() || matrix);
  }
  
  test([0,0,0,1], function() { return matrix.toQuarternion(); });
  test([0.7071067811865476,0,0,0.7071067811865476], function() { return Matrix.create(
          [[  1,  0, 0, 0], [  0,  0,-1, 0],
           [  0,  1, 0, 0], [-10, 10, 0, 1]]).toQuarternion(); })
}

function cameraTests()
{
  // Two excellent resources that helped me along the way:
  //   http://www.cprogramming.com/tutorial/3d/rotationMatrices.html
  //   http://www.opengl.org/discussion_boards/ubbthreads.php?ubb=showflat&Number=237960
  
  var _cam = new Camera();
  
  assert_equal([0,0,0], _cam.getPosition());

  assert_equal([0,0,-1], _cam.getView());
  assert_equal([0,1,0], _cam.getUp());
  assert_equal([1,0,0], _cam.getRight());
  assert_equal([1,0,0,0,
                0,1,0,0,
                0,0,1,0,
                0,0,0,1], _cam.getMatrix().flatten());
  
  function camTest(expected_matrix, func) {
    func();
    assert_equal(expected_matrix, _cam.getMatrix().flatten());
    _cam.reset();
  }
  
  // X rotation
  camTest([ 1, 0, 0, 0,
            0, 0,-1, 0,
            0, 1, 0, 0,
            0, 0, 0, 1], function() { _cam.rotateView(Math.PI/2, 0); });
  
  // reset
  camTest([1, 0, 0, 0,
           0, 1, 0, 0,
           0, 0, 1, 0,
           0, 0, 0, 1], function() { _cam.rotateView(Math.PI/2, 0); _cam.reset(); });
  
  // Y rotation
  camTest([ 0, 0,-1, 0,
            0, 1, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 1], function() { _cam.rotateView(0, Math.PI/2); });
  
  // Z rotation
  camTest([ 0, 1, 0, 0,
           -1, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1], function() { _cam.rotateView(0, 0, Math.PI/2); });
  
  // lookAt
  camTest([1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           0,0,0,1], function() { _cam.lookAt(0, 0, -1); });
  
  // move diagonally
  camTest([1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           1,1,1,1], function() { _cam.move(-Math.sqrt(3), 1, 1, 1); });
  
  // move forward
  camTest([1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           0,0,1,1], function() { _cam.move(1); });

  // move backward
  camTest([1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           0,0,-1,1], function() { _cam.move(-1); });
  
  // strafe left
  camTest([1,0,0,0,
           0,1,0,0,
           0,0,1,0,
           1,0,0,1], function() { _cam.strafe(-1); });
  
  // strafe right
  camTest([ 1,0,0,0,
            0,1,0,0,
            0,0,1,0,
           -1,0,0,1], function() { _cam.strafe(1); });
  
  
  // move then strafe then X rotation
  camTest([ 1,  0, 0, 0,
            0,  0,-1, 0,
            0,  1, 0, 0,
          -10, 10, 0, 1], function() { _cam.move(10);
                                       _cam.strafe(10);
                                       _cam.rotateView(Math.PI/2, 0); });
  
  // translate then rotate
  camTest([1,     0,                  0,                 0,
           0,     0.923879532511287, -0.38268343236509,  0,
           0,     0.38268343236509,   0.923879532511287, 0,
          -5.85, -2.06649053477148,  -4.98894947556095,  1],
          
          function() {
            _cam.translateTo(5.85, 0, 5.4);
            _cam.rotateView(Math.PI/8, 0);
          });
}

after_initialize(function() {
  vectorTests();
  matrixTests();
  cameraTests();
});
