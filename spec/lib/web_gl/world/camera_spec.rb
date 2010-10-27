require 'spec_helper'

describe WebGL::World::Camera do
  def world; @world ||= WebGL::World.new; end
  subject { world.camera }
  
  context "with just position set" do
    before(:each) { subject.position = [0,0,10] }
    it "should produce js" do
      world.to_js.should == "(function(){var world=new World();world.camera.orient(world.camera.getView(),world.camera.getUp(),world.camera.getRight(),[0,0,10]);return world;})()"
    end
  end
end
