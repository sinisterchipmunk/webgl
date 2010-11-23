class AddAiIdToCreature < ActiveRecord::Migration
  def self.up
    add_column :creatures, :ai_id, :integer
  end

  def self.down
    remove_column :creatures, :ai_id
  end
end
