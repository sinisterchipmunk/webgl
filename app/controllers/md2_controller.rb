class Md2Controller < ApplicationController
  def show
    render :json => Model3D.find(params[:id]).to_json
  end
end
