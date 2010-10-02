class EngineTestsController < ApplicationController
  helper_method :dependencies, :shaders, :objects
  before_filter :add_all_shaders
  
  def index
  end
  
  def json_model
    dependencies << "objects/json3d"
  end

  def height_map
    dependencies << 'engine/heightmap' << 'tests/engine/heightmap'
  end

  def texture
    dependencies << 'objects/quad'
  end

  def camera
    dependencies << 'tests/engine/camera'
  end
  
  def interface
    dependencies << 'engine/heightmap'
  end
  
  def picking
    dependencies << 'tests/engine/world' << 'objects/quad' << "objects/sphere"
  end
  
  def dynamic_shader
    dependencies << "objects/quad" << "tests/engine/shader"
  end

  def core
    dependencies << "tests/engine/core"
  end
  
  def lighting
    dependencies << 'objects/quad' << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world'
  end
  
  def ruby_layer
    objects << WebGL::Quad.new(1, 1)
    objects << WebGL::Sphere.new(0.5)
    dependencies << 'objects/quad' << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' << "objects/renderable"
  end
  
  def renderable
    dependencies << 'objects/quad' << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' << "objects/renderable"
  end
  
  private
  def dependencies
    @dependencies ||= []
  end
  
  def objects
    @objects ||= []
  end
  
  def shaders
    @shaders ||= {}
  end
  
  def add_all_shaders
    ActiveSupport::Dependencies.autoload_paths.each do |path|
      Dir[File.join(path, "shaders/*")].each do |path|
        if File.directory?(path)
          name = path.sub(/.*\/shaders\/([^\/]+)\/?/, '\1')
          shaders[name] = WebGL::Shader.new(name)
        end
      end
    end
  end
end
