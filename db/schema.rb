# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20101114083257) do

  create_table "actors", :force => true do |t|
    t.string  "name"
    t.integer "model_id"
    t.integer "ai_id"
  end

  create_table "ais", :force => true do |t|
    t.string  "name"
    t.integer "base_id"
  end

  create_table "comments", :force => true do |t|
    t.string   "name"
    t.text     "body"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "action"
  end

  create_table "creatures", :force => true do |t|
    t.string  "name"
    t.float   "scale"
    t.string  "orientation", :limit => 3000
    t.integer "actor_id"
  end

  create_table "model_textures", :force => true do |t|
    t.integer "model_id"
    t.integer "texture_id"
  end

  create_table "models", :force => true do |t|
    t.string "name"
  end

  create_table "passwords", :force => true do |t|
    t.string   "secret"
    t.string   "salt"
    t.string   "persistence_token"
    t.string   "single_access_token"
    t.string   "perishable_token"
    t.integer  "authenticatable_id"
    t.string   "authenticatable_type"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "shooter_stats", :force => true do |t|
    t.integer  "shots_fired"
    t.integer  "hits"
    t.integer  "misses"
    t.integer  "kills"
    t.decimal  "accuracy"
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "textures", :force => true do |t|
    t.string "path"
  end

  create_table "users", :force => true do |t|
    t.string   "email"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
