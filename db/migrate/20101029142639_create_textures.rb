class CreateTextures < ActiveRecord::Migration
  def self.up
    create_table :textures do |t|
      t.string :path

      #t.timestamps
    end
  end

  def self.down
    drop_table :textures
  end
end
