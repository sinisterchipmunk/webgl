class EngineTestsController < ApplicationController
  layout :choose_layout
  include WebGL

  def mouse_weight
    dependencies << "control/mouse_weight"
  end
  
  def octree
    dependencies << "engine/heightmap" << "culling/octree" << "objects/sphere" << "objects/cube"
  end
  
  def video_texture
  end
  
  def index
  end
  
  def json_model
    dependencies << "objects/json3d"
  end

  def height_map
    dependencies << 'engine/heightmap' << 'tests/engine/heightmap'
  end

  def texture
  end

  def camera
    dependencies << 'tests/engine/camera'
    world.camera.position = [0,0,5]
  end
  
  def interface
    dependencies << 'engine/heightmap' << "objects/md2" << "objects/line" << "models/actor" <<
            "models/creature" << "models/ai" << "engine/animation" << "objects/axis"
    
    scene = HeightMap.new("/images/height.png",
                          :texture => { :path => "/images/textures/poormansgrass.png", :scale => 3 },
                          :magnitude => 4)
    
    # set the height map as the world scene
    world.scene = scene
    
    # add one of each Creature to the world.
    Creature.all.each_with_index do |creature, index|
      creature.scale = 0.25
      creature.position = [(index+1)*10,0,(index+1) *10]
      world << creature
    end
  end
  
  def picking
    dependencies << 'tests/engine/world' << "objects/sphere"
  end
  
  def dynamic_shader
    dependencies << "tests/engine/shader"
  end

  def core
    dependencies << "tests/engine/core"
  end
  
  def lighting
    dependencies << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world'
  end
  
  def ruby_layer
    #objects << WebGL::Quad.new(1, 1)
    objects << WebGL::Sphere.new(0.5)
    dependencies << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' <<
            "objects/renderable"
  end
  
  def renderable
    dependencies << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' <<
            "objects/renderable" << "tests/engine/renderable"
  end
  
  def particles
    dependencies << 'objects/sphere' << 'objects/json3d'
#    << 'objects/particle'
    dependencies << "systems/particle_generator"
    world.camera.position = [0,0,10]
#    world << WebGL::Particles::Generator.new
  end
  
  def multi_canvas
    dependencies << "objects/sphere" << "tests/engine/lighting" << 'tests/engine/world' <<
            "objects/renderable"
  end
  
  def orientation
    dependencies << "objects/axis"
    
    @quad = WebGL::Quad.new(3,3)

    world.camera.position = [10,10,10]
    world.camera.look_at = [0,0,0]
  end
  
  def skeleton
    dependencies << 'objects/skeleton' << 'tests/objects/skeleton'
  end
  
  def animation_editor
    
  end
  
  def md2
    dependencies << 'objects/md2' << 'tests/objects/md2'
  end
  
  def frustum
    dependencies << "objects/cube" << "objects/sphere" << "objects/point"
  end
  
  def creatures
    dependencies << "models/creature" << "objects/md2" << "engine/animation" << "models/actor" << "models/creature" <<
            "engine/animation" << "models/ai"
    
    world.camera.position = [0,0,10]
    
    ogro1 = Creature.find_by_name("Demo - Ogro") || raise("Couldn't find first Ogro instance!")
    ogro2 = Creature.find_by_name("Ogro 2") || raise("Couldn't find second Ogro instance!")
    
    ogro1.orientation.position = [-1.5,0,0] # note that this could just be saved in the db. I don't because I'm generating
    ogro2.orientation.position = [ 1.5,0,0] # different positions depending on the controller action. Yay for flexibility :)
    ogro2.orientation.view = [0,0,1];
    ogro2.orientation.up   = [0,1,0];
    ogro1.scale = 0.05 # ditto the above
    ogro2.scale = 0.05
    
    @creatures = [ ogro1, ogro2 ]
    
    world << ogro1
    world << ogro2
  end
  
  def webgl_text
    dependencies << "objects/cube"
  end
end
