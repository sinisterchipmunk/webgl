#class Model3D < MD2
class Model < ActiveRecord::Base
  validates_presence_of :name
  validates_uniqueness_of :name
  has_many :actors, :dependent => :destroy
  has_many :model_textures, :dependent => :destroy
  has_many :textures, :through => :model_textures
  
  validate do |record|
    # sanitize name so that we don't expose the filesystem,
    # then make sure the file actually exists
    if !record.name.blank?
      record.name = File.basename(record.name)
      if !File.file?(path = record.path)
        record.errors.add_to_base("#{path} is not a file")
      end
    end
  end
  
  def md2
    MD2.new(path)
  end
  
  def path
    File.join(WebGL.data_path, name, "#{name}.md2")
  end
end
