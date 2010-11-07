module WebGL
  class Error < StandardError
    
  end
  
  class MissingFile < WebGL::Error
    
  end
  
  class MissingShaderFile < WebGL::MissingFile
    
  end
end
