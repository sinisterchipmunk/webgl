# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ :name => 'Chicago' }, { :name => 'Copenhagen' }])
#   Mayor.create(:name => 'Daley', :city => cities.first)
Creature.transaction do
  crafty_texture  = Texture.create(:path => "/images/textures/crafty.png");
  ogro_texture    = Texture.create(:path => "/images/textures/ogro.png");
  laalaa_texture  = Texture.create(:path => "/images/textures/laalaa.png");
  pknight_texture = Texture.create(:path => "/images/textures/pknight.png");
  
  crafty_model  = Model.create(:name => "crafty",  :textures => [crafty_texture])
  ogro_model    = Model.create(:name => "ogro",    :textures => [ogro_texture])
  laalaa_model  = Model.create(:name => "laalaa",  :textures => [laalaa_texture])
  pknight_model = Model.create(:name => "pknight", :textures => [pknight_texture])
  
  base_ai = AI.create(:name => "Base Creature")
  
  crafty_actor  = Actor.create(:name => 'crafty',  :model => crafty_model,  :ai => base_ai)
  ogro_actor    = Actor.create(:name => 'ogro',    :model => ogro_model,    :ai => base_ai)
  laalaa_actor  = Actor.create(:name => 'laalaa',  :model => laalaa_model,  :ai => base_ai)
  pknight_actor = Actor.create(:name => 'pknight', :model => pknight_model, :ai => base_ai)
  
  Creature.create([{:name => "Demo - Crafty",  :actor => crafty_actor },
                   {:name => "Demo - Laalaa",  :actor => laalaa_actor },
                   {:name => "Demo - Ogro",    :actor => ogro_actor   },
                   {:name => "Demo - Pknight", :actor => pknight_actor},
                   {:name => "Ogro 2",         :actor => ogro_actor   }
                 ])
end
