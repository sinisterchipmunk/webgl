class AddTypeToCreatures < ActiveRecord::Migration
  def self.up
    add_column :creatures, :type, :string, :default => "Creature"
  end

  def self.down
    remove_column :creatures, :type
  end
end
