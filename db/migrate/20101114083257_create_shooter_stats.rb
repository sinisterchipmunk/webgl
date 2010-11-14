class CreateShooterStats < ActiveRecord::Migration
  def self.up
    create_table :shooter_stats do |t|
      t.integer :shots_fired
      t.integer :hits
      t.integer :misses
      t.integer :kills
      t.decimal :accuracy
      t.string :name

      t.timestamps
    end
  end

  def self.down
    drop_table :shooter_stats
  end
end
