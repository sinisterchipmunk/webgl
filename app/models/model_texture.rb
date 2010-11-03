class ModelTexture < ActiveRecord::Base
  belongs_to :texture
  belongs_to :model
end
