require 'spec_helper'

describe WebGL::Renderable do
  it "should have base_class Renderable" do
    subject.base_class.should == "Renderable"
  end
  
  it "should have no arguments" do
    subject.arguments.should be_empty
  end
  
  it "should produce 'new Renderable();'" do
    subject.to_js.should == "new Renderable(function(){},function(timechange){},function(){})"
  end
  
  it "should set initializer code" do
    subject.js_init = "1"
    subject.js_init.should == '1'
  end
  
  it "should set update code" do
    subject.js_update = "1"
    subject.js_update.should == '1'
  end
  
  it 'should set render code' do
    subject.js_render = '1'
    subject.js_render.should == '1'
  end
end
