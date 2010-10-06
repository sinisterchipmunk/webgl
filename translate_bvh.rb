require File.join(File.dirname(__FILE__), "config/environment")

skel = Bvh.import(File.join(File.dirname(__FILE__), ARGV[0]))

def translate_node(node)
  { name: node.name,
    offset: node.offset,
    joints: node.joints.collect { |joint| translate_node(joint) } }
end

def translate_frame(frame, frame_time)
  data = frame.channel_data
  first = data.shift
  
  result = {offset: [], rotations: [], time: frame_time}
  
  result[:offset] << first['Xposition'] << first['Yposition'] << first['Zposition']
  result[:rotations] << first['Xrotation'] << first['Yrotation'] << first['Zrotation']
  
  data.each do |dat|
    result[:rotations].concat [dat['Xrotation'], dat['Yrotation'], dat['Zrotation']]
  end

  result[:rotations].collect! { |r| r.nil? ? 0 : r } # end sites are nil, so make them 0 instead
  
  # convert rotations from degrees to radians
  result[:rotations].each_with_index do |value, index|
    result[:rotations][index] = value * Math::PI / 180
  end
  
  result
end

root = translate_node(skel.root)
keyframes = skel.frames.collect { |frame| translate_frame(frame, skel.frame_time) }

result = { bones: root, keyframes: keyframes, timeScale: 1, scale: 1 }

puts result.to_json
