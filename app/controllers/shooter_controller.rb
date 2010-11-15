class ShooterController < ApplicationController
  include WebGL
  layout "engine_bare"
  
  def index
    dependencies << "objects/cube" << "objects/md2" << "objects/line"
    @hiscore = ShooterStats.new
  end
  
  def create
    hiscore = ShooterStats.new(params[:shooter_stats])
    hiscore.save
    
    @scores = ShooterStats.find(:all, :order => "kills DESC, accuracy DESC, shots_fired ASC")
    respond_to do |fmt|
      fmt.js { render :action => "scores" }
      fmt.html
    end
  end
  
  def scores
    @scores = ShooterStats.find(:all, :order => "kills DESC, accuracy DESC, shots_fired ASC")
  end
end