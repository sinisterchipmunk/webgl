class Creature < ActiveRecord::Base
  validates_uniqueness_of :name
  validates_presence_of :name
  validates_presence_of :model_name
  has_many :model_textures, :dependent => :destroy
  has_many :textures, :through => :model_textures
  
  # TODO: should these be AR attributes?
  attr_accessor :scale
  delegate :view, :up, :right, :position, :view=, :up=, :position=, :right=, :to => :orientation
  
  def orientation
    @orientation ||= WebGL::World::Camera.new
  end
  
  def model
    @model ||= Model3D.find(model_name)
  end
  
  def to_js(callback)
    "MD2.load("+model_name.to_json+", function(obj){#{js_for_init}(#{callback})(obj);});"
  end
  
  private
  def js_for_init
    js_for_textures + 
    js_for_scale +
    orientation.js_orient("obj.orientation") + ";"
  end
  
  def js_for_scale
    "obj.setScale(#{@scale || 1});"
  end
  
  def js_for_textures
    textures.collect do |texture|
      "obj.addTexture(new Texture(#{texture.path.to_json}));"
    end.join
  end
end
