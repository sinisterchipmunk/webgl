after_initialize(function() {
  var img = new Image();
  img.onload = function() {
    var hm = new HeightMap(gl, img);
  
    if (hm.data.length != hm.width()*hm.depth()) alert("hm.data.length should == hm.width*hm.depth");
    
    hm.rebuild(img, {scale:0.5});
    if (hm.scale != 0.5) alert("hm.scale should == 0.5");
  };
  img.src = "http://localhost/~colin/rails-game/images/rails.png";
});
