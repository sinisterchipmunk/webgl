require 'spec_helper'

# the JS is in flux, so these tests are in a frequent (if not constant) state of failure. Need a better way to test.

describe WebGL::World do
  context "given objects" do
    before(:each) { subject << WebGL::Quad.new(1,2) }
    
    it "should contain objects" do
      subject.objects.size.should == 1
    end
    
#    it "should produce javascript" do
#      subject.to_js.should == "(function(){var world=new World();world.addObject(new Quad(1,2));return world;})()"
#    end
  end
  
  it "should interface with camera" do
    subject.camera.should be_kind_of(WebGL::World::Camera)
  end
  
  context "manipulating camera" do
    before(:each) do
      subject.camera.right    = [ 1,0, 0]
      subject.camera.up       = [ 0,1, 0]
      subject.camera.view     = [ 0,0,-1]
      subject.camera.position = [10,0,10]
    end
    
#    it "should produce javascript" do
#      subject.to_js.should == "(function(){var world=new World();world.camera.orient([0,0,-1],[0,1,0],[1,0,0],[10,0,10]);return world;})()"
#    end
  end
end
