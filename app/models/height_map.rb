# this really needs to be an ActiveRecord model...
class HeightMap
  def initialize(path, options = {})
    options ||= {}
    @path = path
    @options = options
  end
  
  def to_js(callback = nil)
    if callback
      "(#{callback})(#{js_for_map_function});"
    else
      js_for_map_function
    end
  end
  
  private
  def js_for_map_function
    "(function() { #{js_for_map} #{js_for_options} return map; })()"
  end
  
  def js_for_map
    "var map = new HeightMap(#{@path.to_json}, {magnitude:#{@options[:magnitude]}});"
  end
  
  def js_for_options
    @options.collect do |key, value|
      case key.to_s
        when 'texture'
          "map.mesh.addTexture(#{value[:path].to_json},{scale:#{value[:scale]}});"
#        when 'magnitude'
#          "map.setMagnitude(#{value});"
      end
    end.join
  end
end