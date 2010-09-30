require 'spec_helper'
  
describe WebGL::Shader do
  subject { WebGL::Shader.new('test-shader') }
  
  it "should set its name" do
    subject.name.should == "test-shader"
  end
  
  it "should find the vertex shader source" do
    subject.vertex_source.should == "(DUMMY VERTEX SOURCE)"
  end
  
  it "should find the fragment shader source" do
    subject.fragment_source.should == "(DUMMY FRAGMENT SOURCE)"
  end
    
  it "should return full filename on #vertex_source_file" do
    subject.vertex_source_file.should == File.join(SUPPORT_ROOT, "/shaders/test-shader/vertex.glsl")
  end
    
  it "should return full filename on #fragment_source_file" do
    subject.fragment_source_file.should == File.join(SUPPORT_ROOT, "/shaders/test-shader/fragment.glsl")
  end

  context "given a missing filename" do
    subject { WebGL::Shader.new('nonexistent') }
    
    it "should still have a name" do
      subject.name.should == "nonexistent"
    end
    
    it "should raise an error searching for vertex source" do
      proc { subject.vertex_source }.should raise_error(WebGL::MissingShaderFile)
    end

    it "should raise an error searching for fragment source" do
      proc { subject.fragment_source }.should raise_error(WebGL::MissingShaderFile)
    end
    
    it "should return false on #vertex_source_file" do
      subject.vertex_source_file.should == false
    end
    
    it "should return false on #fragment_source_file" do
      subject.fragment_source_file.should == false
    end
  end
end
