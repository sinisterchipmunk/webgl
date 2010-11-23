class RemoveScaleFromCreatures < ActiveRecord::Migration
  def self.up
    remove_column :creatures, :scale
  end

  def self.down
    add_column :creatures, :scale, :float, :default => 1.0
  end
end
