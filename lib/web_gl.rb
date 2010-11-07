require 'web_gl/errors'

module WebGL
  module_function
  
  autoload :Shader, 'web_gl/shader'
  autoload :ParticleSystem, 'web_gl/particle_system'
  autoload :Renderable, 'web_gl/renderable'
  autoload :World, 'web_gl/world'
  
  def data_path
    @data_path ||= File.join(Rails.root, "app/webgl/models")
  end
  
  def data_path=(path)
    @data_path = path
  end
end
