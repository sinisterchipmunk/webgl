RailsGame::Application.routes.draw do
  match '/md2/:id', :controller => 'md2', :action => 'show'
  match '/:controller/:action'
  root :controller => 'engine_tests', :action => 'index'
end
