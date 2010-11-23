class Creature < ActiveRecord::Base
#  serialize :orientation, WebGL::World::Camera
  serialize :position
  serialize :view
  serialize :right
  serialize :up
  
  belongs_to :actor
  belongs_to :ai, :class_name => "AI"
  belongs_to :scene, :polymorphic => true
  # attr_accessor :orientation
  # delegate :view, :up, :right, :position, :view=, :up=, :position=, :right=, :to => :orientation
  delegate :scale, :scale=, :to => :actor
  
  after_initialize do |record|
    record.name = record.name.blank? && record.actor ? record.actor.name : record.name
    record.orientation ||= WebGL::World::Camera.new
    record.update_orientation
  end
  
  before_validation do |record|
    record[:orientation] = record.orientation && YAML::dump(record.orientation)
    record.update_orientation
  end
  
  def orientation
    @orientation ||= self[:orientation] && YAML::load(self[:orientation] || "")
  end
  
  def orientation=(o)
    @orientation = o
  end
  
  def update_orientation
    orientation.view     = view.split.collect { |c| c.to_f }     if !view.blank?
    orientation.up       = up.split.collect { |c| c.to_f }       if !up.blank?
    orientation.right    = right.split.collect { |c| c.to_f }    if !right.blank?
    orientation.position = position.split.collect { |c| c.to_f } if !position.blank?
  end
  
  def to_js
    "Creature.instance(#{to_json(:include => { :actor => { :include => {:model => {:include => :textures}, :ai => {}} } })}.creature)".html_safe
  end
  
  alias_method :to_s, :to_js
end
