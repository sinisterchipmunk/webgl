class AI < ActiveRecord::Base
  has_many :actors
  validates_presence_of :name
  validates_uniqueness_of :name
  has_many :descendants, :foreign_key => 'base_id', :class_name => 'AI'
  belongs_to :base, :foreign_key => 'base_id', :class_name => 'AI'
  
  def to_js
    "AI.instance(#{attributes.to_json})"
  end
end
