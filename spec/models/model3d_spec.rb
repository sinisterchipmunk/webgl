require 'spec_helper'

describe Model3D do
  it "should load an MD2 model" do
    Model3D.find('crafty').should be_kind_of(MD2)
  end
end