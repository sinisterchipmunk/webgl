class CommentsController < ApplicationController
  def create
    comment = Comment.new(params[:comment])
    if (comment.save)
      flash[:notice] = "Comment saved -- thanks!!!"
    else
      flash[:notice] = "Comment could not be saved, please try again"
    end
    redirect_to :controller => 'engine_tests', :action => (params[:comment] && params[:comment][:action] || "index")
  end
end
