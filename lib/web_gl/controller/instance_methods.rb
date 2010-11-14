module WebGL::Controller
  module InstanceMethods
    def world
      @world ||= WebGL::World.new
    end
    
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
    
    def particle_systems
      @particle_systems ||= begin
        hash = {}
        def hash.to_json(*a)
          ("{"+collect { |(key, particle_system)| key.to_json + ": "+particle_system.to_json }.join(",")+"}").html_safe
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
    
    def add_particle_systems
      ActiveSupport::Dependencies.autoload_paths.each do |path|
        Dir[File.join(path, "particle_systems/*.js")].each do |path|
          if File.file?(path)
            name = path.sub(/.*\/particle_systems\/([^\/]+)\.js/, '\1')
            particle_systems[name] = WebGL::ParticleSystem.new(name)
          end
        end
      end
    end
  end
end