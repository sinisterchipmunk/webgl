require 'spec_helper'

describe Model do
  it "should load an MD2 model" do
    Model.first.md2.should be_kind_of(MD2)
  end
end