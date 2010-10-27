# Superclass of all JavaScript renderable objects.
class WebGL::Renderable
  attr_accessor :base_class, :js_init, :js_render, :js_update
  
  class << self
    def arguments
      @arguments ||= []
    end
    
    def argument(name, default = :undefined)
      attr_accessor name
      arguments << [name, default]
    end
  end
  
  def initialize(base_class = "Renderable", *arguments)
    @base_class = base_class
    
    self.js_init = self.js_render = self.js_update = ''

    self.class.arguments.each do |arg|
      name, value = *arg
      value = arguments.shift if !arguments.empty?
      if value == :undefined
        raise "Not enough arguments! First missing argument is #{name}"
      end
      send(:"#{name}=", value)
    end
  end
  
  def to_js
    if js_render.blank?
      "new #{base_class}(#{js_arguments})"
    else
      "(function(){var r = new #{base_class}(#{js_arguments});r.render=#{js_render_function};return r;})()"
    end
  end
  
  def js_init_function
    function(js_init)
  end
  
  def js_update_function
    function(js_update, :timechange)
  end
  
  def js_render_function
    function(js_render, :context, :mode)
  end
  
  def function(body, *args)
    body.nil? ? nil : "function(#{args.join(',')}){#{body}}"
  end
  
  def arguments
    self.class.arguments.collect { |arg| send(arg[0]) }
  end
  
  def js_arguments
    args = arguments.inject { |prev, arg| prev.blank? ? arg.to_json : [prev, arg.to_json].join(",") }
    funcs = [js_init_function, js_update_function].reject { |e| e.nil? }.join(',')
    if !args.blank? && !funcs.blank?
      [funcs,args].join(',')
    elsif !args.blank?
      args
    else
      funcs
    end
  end
end
