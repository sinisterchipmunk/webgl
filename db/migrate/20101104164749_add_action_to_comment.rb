class AddActionToComment < ActiveRecord::Migration
  def self.up
    add_column :comments, :action, :string
  end

  def self.down
    remove_column :comments, :action
  end
end
