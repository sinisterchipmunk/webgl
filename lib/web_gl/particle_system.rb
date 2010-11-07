class WebGL::ParticleSystem
  attr_reader :name
  
  def initialize(name)
    @name = name
  end
  
  def source
    @source ||= read_source.gsub(/;(\n*)\z/, '')
  end
  
  def source_file
    find_source_file
  end
  
  def to_json(*a)
    "((function() { return (#{source}); })())"
  end
  
  private
  def local_filename
    File.join("particle_systems", "#{@name}.js")
  end
  
  def read_source
    path = find_source_file || raise(WebGL::MissingFile, "File not found: #{local_filename}")
    File.read(path)
  end
  
  def find_source_file
    file = local_filename

    ActiveSupport::Dependencies.autoload_paths.each do |path|
      if File.exist?(full_path = File.join(path, file))
        return full_path
      end
    end
    false
  end
end
