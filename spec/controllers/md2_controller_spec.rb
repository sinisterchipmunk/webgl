require 'spec_helper'

describe Md2Controller do

  describe "GET 'show'" do
    it "should be successful" do
      get 'show', :id => 'crafty'
      response.should be_success
    end
  end

end
