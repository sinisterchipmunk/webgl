class WebGL::World
  class Camera
    attr_accessor :right, :up, :view, :position, :look_at
    
    def changed?
      orientation_changed? || position || look_at
    end
    
    def orientation_changed?
      right || up || view
    end
    
    def js_lookat(name)
      result = ""
      result.concat "#{name}.setPosition([#{position.join(",")}]);" if (position)
      result.concat "#{name}.lookAt([#{look_at.join(",")}]);" if look_at
      result
    end
    
    def js_orient(name)
      orientation = [view     || "#{name}.getView()",
                     up       || "#{name}.getUp()",
                     right    || "#{name}.getRight()",
                     position || "#{name}.getPosition()"]
      orientation.reject! { |c| c.nil? }
      orientation.collect! { |c| c.kind_of?(Array) ? "[#{c.join(",")}]" : c.to_s }
      
      "#{name}.orient(#{orientation.join(",")})"
    end
  end
  
  attr_reader :objects, :camera
  attr_accessor :scene
  delegate :<<, :to => :objects
  
  def initialize
    @objects = []
    @camera = WebGL::World::Camera.new
  end
  
  def to_js
    js = "(function(){var world=new World();"
    if camera.orientation_changed?
      js.concat "#{camera.js_orient('world.camera')};"
    elsif camera.changed?
      js.concat "#{camera.js_lookat('world.camera')};"
    end
    
    if @scene
      js.concat "world.scene = (#{@scene.to_js});"
    end
    
    objects.each { |obj| js.concat "world.addObject(#{obj.to_js});" }
#    objects.each { |obj| js.concat obj.to_js("function(obj) { world.addObject(obj); }") }
    js.concat "return world;"
    js.concat "})()"
    
    js
  end
end