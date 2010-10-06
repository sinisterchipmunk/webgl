class EngineTestsController < ApplicationController
  layout :choose_layout
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
    dependencies << 'objects/quad' << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' << "objects/renderable" << "tests/engine/renderable"
  end
  
  def particles
    dependencies << 'objects/quad' << 'objects/sphere' << 'objects/json3d' << 'systems/particle_generator'
  end
  
  def multi_canvas
    dependencies << 'objects/quad' << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' << "objects/renderable"
  end
  
  def skeleton
    dependencies << 'objects/skeleton' << 'tests/objects/skeleton'
  end
  
  private
  def choose_layout
    params[:action] == "animation_editor" ? nil : "engine_tests"
  end
  
  def dependencies
    @dependencies ||= []
  end
  
  def objects
    @objects ||= []
  end
  
  def shaders
    @shaders ||= begin
      hash = {}
      def hash.to_json(*a)
        ("{"+collect { |(key, shader)| key.to_json + ": "+shader.to_json }.join(",")+"}").html_safe
      end
      hash
    end
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
