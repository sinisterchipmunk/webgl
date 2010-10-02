require 'spec_helper'

describe WebGL::Quad do
  subject { WebGL::Quad.new(1, 2) }
  
  it "should have base_class Quad" do
    subject.base_class.should == "Quad"
  end
  
  it "should have width 1" do
    subject.width.should == 1
  end
  
  it "should have height 2" do
    subject.height.should == 2
  end
  
  it "should produce a quad" do
    subject.to_js.should == 'new Quad(1,2)'
  end
end
