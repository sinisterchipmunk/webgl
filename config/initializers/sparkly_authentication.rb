# This file sets up Sparkly Auth to work properly with Rails. It was generated
# by "script/generate sparkly config" and can be regenerated with that command, though 
# you may not want to actually do that if you've made changes to this file.
#
# You are also HIGHLY encouraged to check out the Auth::Configuration class documentation
# for a list of all the options you can set here. There are a LOT of them.
#
=begin
Auth.configure do |config|
  config.authenticate :user, :key => 'email'
    # Adds a model to be authenticated. See the Auth::Model class for information on
    # what options you can pass. Here are some common examples:
    #  
    #   config.authenticate :user, :accounts_controller => "users", :sessions_controller => "user_sessions"
    #   config.authenticate :user, :key => "login"
    #
    # By default, :key is "email" and the controllers are Sparkly's internal controllers.
    # (Don't forget you can also script/generate controllers or script/generate views to
    # remove the overhead of setting up your own.)
    #
  
  # You can also configure the various behaviors (as long as they support configurations):
  #  config.remember_me.token_theft_message =
  #      "Your account may have been hijacked recently! Verify that all settings are correct."
  #
  #  config.remember_me.duration = 6.months
  #
  # See the class documentation for the behaviors' configurations themselves for details
  # about these options. (For example, see Auth::Behaviors::RememberMe::Configuration for
  # the Remember Me configuration options.)
end
=end
