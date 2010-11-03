after_initialize(function() {
  var img = new Image();
  img.onload = function() {
    logger.attempt("Height map tests", function() {
      var hm = new HeightMap(img);
  
      hm.onload = function() {
        if (hm.data.map.length != hm.width()*hm.depth())
          alert("hm.data.length<"+hm.data.map.length+"> should == hm.width<"+hm.width()+">*hm.depth<"+hm.depth()+">");
    
        hm.image = img;
        hm.scale = 0.5;
        hm.rebuild(WebGLContext.mostRecent);
        if (hm.scale != 0.5) alert("hm.scale should == 0.5");
      };
    });
  };
  img.src = "/images/rails.png";
});
