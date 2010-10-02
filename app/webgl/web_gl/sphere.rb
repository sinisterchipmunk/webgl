class WebGL::Sphere < WebGL::Renderable
  argument :radius
  
  def initialize(radius)
    super("Sphere", radius)
    self.js_init = self.js_update = self.js_render = nil
  end
end
