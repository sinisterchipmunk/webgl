class AddScaleToModel < ActiveRecord::Migration
  def self.up
    add_column :models, :scale, :float, :default => 1.0
  end

  def self.down
    remove_column :models, :scale
  end
end
