class WebGL::Quad < WebGL::Renderable
  argument :width
  argument :height
  
  def initialize(width, height)
    super("Quad", width, height)
    self.js_init = self.js_update = self.js_render = nil
  end
end
