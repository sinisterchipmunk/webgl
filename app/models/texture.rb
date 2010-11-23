class Texture < ActiveRecord::Base
  has_many :model_textures, :dependent => :destroy
  has_many :models, :through => :model_textures
  validates_presence_of :path
end
