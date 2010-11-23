class AddSceneToCreatures < ActiveRecord::Migration
  def self.up
    add_column :creatures, :scene_id, :integer
    add_column :creatures, :scene_type, :string
  end

  def self.down
    remove_column :creatures, :scene_type
    remove_column :creatures, :scene_id
  end
end
