RailsGame::Application.routes.draw do
  routes = proc do
    match '/:controller/:action'
  end
  
  scope "/~colin/rails-game" do
    instance_eval &routes
    instance_eval &(Auth.routing_proc)
  end

  instance_eval &routes
end
