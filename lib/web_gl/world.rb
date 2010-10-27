class WebGL::World
  class Camera
    attr_accessor :right, :up, :view, :position
    
    def changed?
      right || up || view || position
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
  delegate :<<, :to => :objects
  
  def initialize
    @objects = []
    @camera = WebGL::World::Camera.new
  end
  
  def to_js
    js = "(function(){var world=new World();"
    if camera.changed?
      js.concat "#{camera.js_orient('world.camera')};"
    end
    objects.each { |obj| js.concat "world.addObject(#{obj.to_js});" }
    js.concat "return world;"
    js.concat "})()"
    
    js
  end
end