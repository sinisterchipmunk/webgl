class Md2Controller < ApplicationController
  def show
    render :json => Model.find_by_name(params[:id]).md2.to_json
  end
end
