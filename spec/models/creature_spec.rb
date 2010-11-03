require 'spec_helper'

describe Creature do
  it "should serialize orientation" do
    subject.orientation.to_json.should == "{}"
  end
  
  it "should store orientation" do
    subject.position = [0,1,0];
    subject.position.should == [0,1,0]
  end
  
  it "should deserialize successfully" do
    proc { Creature.first }.should_not raise_error(ActiveRecord::SerializationTypeMismatch)
  end
end
