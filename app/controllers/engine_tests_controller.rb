class EngineTestsController < ApplicationController
  helper_method :dependencies, :shaders
  before_filter :add_all_shaders
  
  def index
  end

  def height_map
    dependencies << "engine/core" << 'engine/heightmap' << 'tests/engine/heightmap'
  end

  def texture
    dependencies << "engine/core" << 'objects/quad'
  end

  def camera
    dependencies << 'engine/vector' << 'engine/core' << 'engine/camera' << 'tests/engine/camera'
  end
  
  def interface
    dependencies << "engine/core" << 'engine/vector' << 'engine/heightmap' << 'engine/camera'
  end
  
  def picking
    dependencies << 'engine/core' << 'engine/world' << 'tests/engine/world' << 'engine/camera' << 'engine/vector'
    dependencies << 'objects/quad' << "engine/shader" << "objects/sphere"
  end
  
  def dynamic_shader
    dependencies << "engine/vector" << "engine/core" << "objects/quad" << "engine/shader" << "tests/engine/shader"
  end

  def core
    dependencies << "engine/core" << "tests/engine/core" << "engine/vector" << "engine/assertions"
  end
  
  def lighting
    dependencies << 'engine/core' << 'engine/world' << 'tests/engine/world' << 'engine/camera' << 'engine/vector'
    dependencies << 'objects/quad' << "engine/shader" << "objects/sphere" << "engine/lighting" << "tests/engine/lighting"
  end

  private
  def dependencies
    @dependencies ||= []
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
