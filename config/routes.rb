RailsGame::Application.routes.draw do
  match '/:controller/:action'
  root :controller => 'engine_tests', :action => 'index'
end
