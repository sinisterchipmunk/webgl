require 'web_gl/errors'

module WebGL
  module_function
  
  autoload :Shader, 'web_gl/shader'
  autoload :ParticleSystem, 'web_gl/particle_system'
  autoload :Renderable, 'web_gl/renderable'
  autoload :World, 'web_gl/world'
  autoload :Controller, "web_gl/controller"
  
  def data_path
    @data_path ||= File.join(Rails.root, "app/webgl/models")
  end
  
  def data_path=(path)
    @data_path = path
  end
  
  def self.included(base)
    if base.ancestors.include?(ApplicationController)
      base.send(:include, WebGL::Controller::InstanceMethods)
      base.send :helper_method, :dependencies, :shaders, :objects, :world, :particle_systems
      base.send :before_filter, :add_all_shaders
      base.send :before_filter, :add_particle_systems
      (WebGL::Controller::InstanceMethods.public_instance_methods - Object.public_instance_methods).each do |method|
        base.send :hide_action, method
      end
    end
  end
end
