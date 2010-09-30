RailsGame::Application.routes.draw do
  routes = proc do
    match '/:controller/:action'
  end
  
  instance_eval &routes
  scope "/~colin/rails-game" do
    instance_eval &routes
    instance_eval &(Auth.routing_proc)
  end
end
