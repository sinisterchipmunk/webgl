module Webgl
  class ParticleSystemGenerator < Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)
    
    def create_particle_system
      template "particle_system.js.erb", "app/webgl/particle_systems/#{file_name}.js"
    end
  end
end
