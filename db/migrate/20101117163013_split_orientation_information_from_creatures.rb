class SplitOrientationInformationFromCreatures < ActiveRecord::Migration
  def self.up
    add_column :creatures, :position, :string
    add_column :creatures, :view, :string
    add_column :creatures, :up, :string
    add_column :creatures, :right, :string
    # remove_column :creatures, :orientation
  end

  def self.down
    # add_column :creatures, :orientation, :string
    remove_column :creatures, :position
    remove_column :creatures, :view
    remove_column :creatures, :up
    remove_column :creatures, :right
  end
end
