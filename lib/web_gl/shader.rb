class WebGL::Shader
  attr_reader :name
  
  def initialize(name)
    @name = name
  end
  
  def fragment_source
    @fragment_source ||= read_source("fragment")
  end
  
  def vertex_source
    @vertex_source   ||= read_source("vertex")
  end
  
  def fragment_source_file
    find_source_file("fragment")
  end
  
  def vertex_source_file
    find_source_file("vertex")
  end
  
  def to_json(*a)
    "new Shader({vertex_source:#{vertex_source.to_json}, fragment_source:#{fragment_source.to_json}})"
  end
  
  private
  def local_filename(which)
    File.join("shaders", @name, "#{which}.glsl")
  end
  
  def read_source(filename)
    path = find_source_file(filename) || raise(WebGL::MissingShaderFile, "File not found: #{local_filename(filename)}")
    File.read(path)
  end
  
  def find_source_file(filename)
    file = local_filename(filename)

    ActiveSupport::Dependencies.autoload_paths.each do |path|
      if File.exist?(full_path = File.join(path, file))
        return full_path
      end
    end
    false
  end
end
