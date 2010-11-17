class Creature < ActiveRecord::Base
#  serialize :orientation, WebGL::World::Camera
  belongs_to :actor
  belongs_to :scene, :polymorphic => true
  delegate :view, :up, :right, :position, :view=, :up=, :position=, :right=, :to => :orientation
  
  def name
    (name = super).blank? ? name : actor.name
  end
  
  after_initialize do |record|
    record.scale ||= 1
    record.orientation ||= WebGL::World::Camera.new
  end
  
  before_validation do |record|
    record[:orientation] = record.orientation && YAML::dump(record.orientation)
  end
  
  def orientation
    @orientation ||= self[:orientation] && YAML::load(self[:orientation])
  end
  
  def orientation=(o)
    @orientation = o
  end
  
  def to_js
    "Creature.instance(#{to_json(:include => { :actor => { :include => {:model => {:include => :textures}, :ai => {}} } })}.creature)".html_safe
  end
  
  alias_method :to_s, :to_js
end
