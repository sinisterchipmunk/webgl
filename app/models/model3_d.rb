# Describes a 3D model. Currently the only supported format is MD2.
#
# The methods of this class are designed to respond similarly to ActiveRecord models.
# That's not to imply that the models themselves are stored in the database (though
# they certainly could be) -- it's simply to give developers a familiar interface to
# work with.
#
# TODO one day we'll extract this into a module for inclusion into custom Rails models
class Model3D < MD2
  # Raised when the model file could not be found.
  class FileNotFound < LoadError
  end
  
  class << self
    def find(id)
      # sanitize id so that we don't expose the filesystem
      id = File.basename(id.to_s)
      
      path = File.join(WebGL.data_path, id, "#{id}.md2")
      raise Model3D::FileNotFound, "Could not find file: #{path}" unless File.file?(path)
      
      new(path)
    end
  end
end
