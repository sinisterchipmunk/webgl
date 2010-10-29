class CreateModelTextures < ActiveRecord::Migration
  def self.up
    create_table :model_textures do |t|
      t.references :creature
      t.references :texture

      t.timestamps
    end
  end

  def self.down
    drop_table :model_textures
  end
end
