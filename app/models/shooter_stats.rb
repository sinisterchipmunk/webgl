class ShooterStats < ActiveRecord::Base
  before_save do |record|
    record.accuracy = record.hits.to_f / record.shots_fired.to_f
  end
end
