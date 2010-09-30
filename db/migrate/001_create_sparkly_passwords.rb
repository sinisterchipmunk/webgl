class CreateSparklyPasswords < ActiveRecord::Migration
  def self.up
    create_table :passwords do |t|
      t.string :secret
      t.string :salt
      
      t.string :persistence_token   # the token stored in cookies to persist the user's session
      t.string :single_access_token # used to authenticate a user for a single request. This is not persisted.
      t.string :perishable_token    # used in confirming an account, usually via email
      
      t.references :authenticatable, :polymorphic => true
      t.timestamps
    end
  end

  def self.down
    drop_table :passwords
  end
end
