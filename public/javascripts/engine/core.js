// note to self -- don't use 0, we might accidentally evaluate it as false / null
var FILL = 1;
var WIREFRAME = 2;
var RENDER_PICK = 3;

var after_initialize_callbacks = new Array();

var mouse = {};

function after_initialize(func) { after_initialize_callbacks.push(func); }

// Date#strftime
Date.ext={};Date.ext.util={};Date.ext.util.xPad=function(x,pad,r){if(typeof (r)=="undefined"){r=10}for(;parseInt(x,10)<r&&r>1;r/=10){x=pad.toString()+x}return x.toString()};Date.prototype.locale="en-GB";if(document.getElementsByTagName("html")&&document.getElementsByTagName("html")[0].lang){Date.prototype.locale=document.getElementsByTagName("html")[0].lang}Date.ext.locales={};Date.ext.locales.en={a:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],A:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],b:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],B:["January","February","March","April","May","June","July","August","September","October","November","December"],c:"%a %d %b %Y %T %Z",p:["AM","PM"],P:["am","pm"],x:"%d/%m/%y",X:"%T"};Date.ext.locales["en-US"]=Date.ext.locales.en;Date.ext.locales["en-US"].c="%a %d %b %Y %r %Z";Date.ext.locales["en-US"].x="%D";Date.ext.locales["en-US"].X="%r";Date.ext.locales["en-GB"]=Date.ext.locales.en;Date.ext.locales["en-AU"]=Date.ext.locales["en-GB"];Date.ext.formats={a:function(d){return Date.ext.locales[d.locale].a[d.getDay()]},A:function(d){return Date.ext.locales[d.locale].A[d.getDay()]},b:function(d){return Date.ext.locales[d.locale].b[d.getMonth()]},B:function(d){return Date.ext.locales[d.locale].B[d.getMonth()]},c:"toLocaleString",C:function(d){return Date.ext.util.xPad(parseInt(d.getFullYear()/100,10),0)},d:["getDate","0"],e:["getDate"," "],g:function(d){return Date.ext.util.xPad(parseInt(Date.ext.util.G(d)/100,10),0)},G:function(d){var y=d.getFullYear();var V=parseInt(Date.ext.formats.V(d),10);var W=parseInt(Date.ext.formats.W(d),10);if(W>V){y++}else{if(W===0&&V>=52){y--}}return y},H:["getHours","0"],I:function(d){var I=d.getHours()%12;return Date.ext.util.xPad(I===0?12:I,0)},j:function(d){var ms=d-new Date(""+d.getFullYear()+"/1/1 GMT");ms+=d.getTimezoneOffset()*60000;var doy=parseInt(ms/60000/60/24,10)+1;return Date.ext.util.xPad(doy,0,100)},m:function(d){return Date.ext.util.xPad(d.getMonth()+1,0)},M:["getMinutes","0"],p:function(d){return Date.ext.locales[d.locale].p[d.getHours()>=12?1:0]},P:function(d){return Date.ext.locales[d.locale].P[d.getHours()>=12?1:0]},S:["getSeconds","0"],u:function(d){var dow=d.getDay();return dow===0?7:dow},U:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=6-d.getDay();var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0)},V:function(d){var woy=parseInt(Date.ext.formats.W(d),10);var dow1_1=(new Date(""+d.getFullYear()+"/1/1")).getDay();var idow=woy+(dow1_1>4||dow1_1<=1?0:1);if(idow==53&&(new Date(""+d.getFullYear()+"/12/31")).getDay()<4){idow=1}else{if(idow===0){idow=Date.ext.formats.V(new Date(""+(d.getFullYear()-1)+"/12/31"))}}return Date.ext.util.xPad(idow,0)},w:"getDay",W:function(d){var doy=parseInt(Date.ext.formats.j(d),10);var rdow=7-Date.ext.formats.u(d);var woy=parseInt((doy+rdow)/7,10);return Date.ext.util.xPad(woy,0,10)},y:function(d){return Date.ext.util.xPad(d.getFullYear()%100,0)},Y:"getFullYear",z:function(d){var o=d.getTimezoneOffset();var H=Date.ext.util.xPad(parseInt(Math.abs(o/60),10),0);var M=Date.ext.util.xPad(o%60,0);return(o>0?"-":"+")+H+M},Z:function(d){return d.toString().replace(/^.*\(([^)]+)\)$/,"$1")},"%":function(d){return"%"}};Date.ext.aggregates={c:"locale",D:"%m/%d/%y",h:"%b",n:"\n",r:"%I:%M:%S %p",R:"%H:%M",t:"\t",T:"%H:%M:%S",x:"locale",X:"locale"};Date.ext.aggregates.z=Date.ext.formats.z(new Date());Date.ext.aggregates.Z=Date.ext.formats.Z(new Date());Date.ext.unsupported={};Date.prototype.strftime=function(fmt){if(!(this.locale in Date.ext.locales)){if(this.locale.replace(/-[a-zA-Z]+$/,"") in Date.ext.locales){this.locale=this.locale.replace(/-[a-zA-Z]+$/,"")}else{this.locale="en-GB"}}var d=this;while(fmt.match(/%[cDhnrRtTxXzZ]/)){fmt=fmt.replace(/%([cDhnrRtTxXzZ])/g,function(m0,m1){var f=Date.ext.aggregates[m1];return(f=="locale"?Date.ext.locales[d.locale][m1]:f)})}var str=fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g,function(m0,m1){var f=Date.ext.formats[m1];if(typeof (f)=="string"){return d[f]()}else{if(typeof (f)=="function"){return f.call(d,d)}else{if(typeof (f)=="object"&&typeof (f[0])=="string"){return Date.ext.util.xPad(d[f[0]](),f[1])}else{return m1}}}});d=null;return str};
// String#capitalize
String.prototype.capitalize = function() { return this.substring(0,1).toUpperCase()+this.substring(1,this.length); };
// Math#pow2 - find the nearest power of 2 for given number
//Math.pow2 = function(n) { return Math.pow(2, Math.round(Math.log(n) / Math.log(2))); };
//Math.pow2 = function(n) {
//  var m = n;
//  for(var i = 0; m > 1; i++) {
//    m = m >>> 1;
//  }
//  // Round to nearest power
//  if (n & 1 << i-1) { i++; }
//  return 1 << i;
//};
Math.pow2 = function(k) {
  if (k == 0)
    return 1;
  k--;
  for (var i=1; i < 64; i<<=1)
    k = k | k >> i;
  return k+1;
};


function instanceFor(klass, attributes)
{
  klass.instances = klass.instances || [];
  klass.instances[attributes.id] = klass.instances[attributes.id] || new klass(attributes);
  return klass.instances[attributes.id];
}

function Logger(name)
{
  var self = this;
  var buffer = "";
  
  self.name = name || "logger";
  self.autoupdate = true;
  self.level = Logger.INFO;
  
  function update() {
    if ($(self.name) && self.autoupdate)
    {
      var string = self.toString();
      if (string.length > 65536) string = string.substring(0, 65536);
      $(self.name).update(string);
    }
  }
  
  function getLine() {
    var e = new Error();
    var line;
    if (e.stack) line = e.stack.split("\n")[4];
    else line = "";
    line = line.substring(line.lastIndexOf("/")+1, line.length);
    line = line.split(":");
    while (line[0].length < 15) line[0] = " " + line[0];
    while (line[1] && line[1].length < 4)  line[1] = line[1] + " ";
    
    return line.join(":");
  }
  
  function format(level, message) { return self.name+"  " + new Date().strftime("%T") + "  "+level+"  "+getLine()+"  "+message; }

  function insert(level, message)
  {
    buffer = format(level, message).strip() + "\n" + buffer;
    update();
  }
  
  self.toString = function() { return buffer; };
  self.attempt = function(caption, func) {
    self.attempt.captions.push("'"+caption+"'");
    try {
      func();
    } catch(e) {
      // avoid double logging the error in the event that one #attempt was nested within another
      if (!e.attempted)
      {
        caption = self.attempt.captions.join(" =&gt; "); // 'outer' => 'inner'
        var msg = e.toString();
        if (e.stack) msg += "\n\n"+e.stack;
        self.error("During "+caption+": "+msg);
      }
      e.attempted = true;
      throw e;
    } finally {
      self.attempt.captions.pop(caption);
    }
  };
  
  self.attempt.captions = [];


  self.error= function(message) { if (self.level >= Logger.ERROR) insert("ERROR", message); };
  self.warn = function(message) { if (self.level >= Logger.WARN ) insert("WARN ", message); };
  self.info = function(message) { if (self.level >= Logger.INFO ) insert("INFO ", message); };
  self.debug= function(message) { if (self.level >= Logger.DEBUG) insert("DEBUG", message); };
}

Logger.WARN  = 1;
Logger.ERROR = 2;
Logger.INFO  = 3;
Logger.DEBUG = 4;

var logger = new Logger();

/*
 takes a series of paths (1 or more). Multiple paths can be required and loaded asynchronously,
 and the contents will be executed in order of appearance. Note that multiple calls to require()
 do not do this, so a single, consolidated call is more time-efficient than multiple calls.
 
 This method blocks until all files have been loaded, and throws an error if any file cannot
 be loaded.
 */
function load(paths)
{
  if (typeof(paths) == "string") paths = [paths];
  
  var retrieved = [];
  
  // We need to force this function to block until all files have been loaded, but we want to 
  // load the files themselves asynchronously. To do that, we'll go down both routes: we'll load
  // all files asynchronously, and while that's getting started we'll load them synchronously.
  // The catch is that we won't load files that have already been retrieved: we'll skip the first
  // one during async since we know we have to load it synchronously; after that, we'll check
  // the results of async after each sync request completes.

  var loadFile = function(xhr, index) {
    logger.debug("assign : "+index+" => "+paths[index]+"\n");
    if (xhr.status && xhr.status == 200) retrieved[index] = xhr.responseText;
    else
      retrieved[index] = 'throw new Error("Error: unexpected status "+'+
                                             xhr.status+
                                             '+" while loading file "+'+paths[index]+'); }';
  };
  
  var callback = function(response) {
    logger.debug("async complete : "+paths[response.request.index]+"\n");
    loadFile(response, response.request.index);
  };
    
  var options = {
    onSuccess: callback,
    onFailure: callback,
    evalJS: false,
    method: 'get'
  };
  
  var req;
  for (var i = 1; i < paths.length; i++)
  { // async requests
    logger.debug("begin async "+paths[i]+" ("+i+")\n");
    req = new Ajax.Request(paths[i], options);
    req.index = i;
  }
  
  var xhr;
  if (window.XMLHttpRequest) xhr = new XMLHttpRequest();
  else xhr = new ActiveXObject("Microsoft.XMLHTTP");
  for (var j = 0; j < paths.length; j++)
  { // sync requests
    logger.debug("begin sync "+paths[j]+" ("+j+") <ret: "+(typeof(retrieved[j]) == "undefined")+">\n");
    if (typeof(retrieved[j]) == "undefined") // already retrieved
    {
      req = new Ajax.Request(paths[i], options);
      req.index = i;
      xhr.open("GET", paths[j], false);
      xhr.send();
      logger.debug("sync complete : "+paths[j]+"\n");
      loadFile(xhr, j);
    }
  }
  
  // finally: load the files!
  for (var k = 0; k < paths.length; k++)
  {
    logger.info("Loading dependency: "+paths[k]);
    // this condition shouldn't be possible, plus, it tests true if the returned file is empty.
    // since an empty file has no eval result, it's fine to leave the condition in place -- but remove
    // the else.
    if (retrieved[k])
      window.eval(retrieved[k]);
    //else { throw new Error("Error: no data for file "+paths[k]); }
  }
}

/*
 takes a series of paths (1 or more). Multiple paths can be required and loaded asynchronously,
 and the contents will be executed in order of appearance. Note that multiple calls to require()
 do not do this, so a single, consolidated call is more time-efficient than multiple calls.
 
 does not require the same file twice; if a repeat is detected, it will be omitted.
 
 Prepends require.prefix to each file; this defaults to "/javascripts".
*/
function require(paths)
{
  if (typeof(paths) == "string") paths = [paths];
  require.paths = require.paths || "|";
  var fullpaths = [];
  
  for (var i = 0; i < paths.length; i++)
  {
    var path = paths[i];
  
    var fullpath = (require.prefix = require.prefix || "/javascripts");
    if (fullpath.lastIndexOf("/") != fullpath.length - 1) fullpath = fullpath + "/";
  
    if (path.indexOf("/") == 0) fullpath = fullpath + path.substring(1, path.length);
    else fullpath = fullpath + path;
  
    if (fullpath.indexOf(".js") != fullpath.length - 4) fullpath = fullpath + ".js";
    
    if (require.paths.indexOf("|"+fullpath+"|") != -1) continue; // already loaded
    require.paths = require.paths + fullpath+"|";
    fullpaths.push(fullpath);
  }
  
  load(fullpaths);
}

function initializationComplete() {
  logger.attempt("init callbacks", function() {
    for (var i = 0; i < after_initialize_callbacks.length; i++)
      after_initialize_callbacks[i](WebGLContext.mostRecent);
  });
}

function encodeToColor(number) {
  var g = (parseInt(number / 256));
  var r = (number % 256);
  // b and a are reserved
  
  // r and g together allow for 65536 indices
  // b is used as a key
  // if this isn't enough (!), perhaps (b / 16) could be used to allow 16*65536 indices.
  // a could cause problems with picking because it's done with readPixels() and so it can't be used here
  
  return [r, g, 255, 255];
}

function decodeFromColor(color) {
  var r = color[0], g = color[1];
  // b and a are reserved, see #encodeToColor
  
  var number = (g * 256) + r;
  return number;
}


try{
  Float32Array;
}catch(ex){
  Float32Array = WebGLFloatArray;
  Uint8Array = WebGLUnsignedByteArray;
}

// Dependencies
//require(["engine/vector",
//         "engine/assertions",
//         "engine/camera",
//         "engine/shader",
//         'engine/world',
//         "engine/lighting"
//        ]);
