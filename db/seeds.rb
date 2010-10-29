# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ :name => 'Chicago' }, { :name => 'Copenhagen' }])
#   Mayor.create(:name => 'Daley', :city => cities.first)
crafty_texture  = Texture.create(:path => "/images/textures/crafty.png");
ogro_texture    = Texture.create(:path => "/images/textures/ogro.png");
laalaa_texture  = Texture.create(:path => "/images/textures/laalaa.png");
pknight_texture = Texture.create(:path => "/images/textures/pknight.png");

Creature.create([{:name => "Demo - Crafty",  :model_name => "crafty", :textures => [crafty_texture]}, 
                 {:name => "Demo - Laalaa",  :model_name => "laalaa", :textures => [laalaa_texture]},
                 {:name => "Demo - Ogro",    :model_name => "ogro",   :textures => [ogro_texture]},
                 {:name => "Demo - Pknight", :model_name => "pknight",:textures => [pknight_texture]},
               ])
