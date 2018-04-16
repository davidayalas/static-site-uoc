var fs = require('fs');
var path = require('path');
var cmsConfig = null;

var cmsDir = "./tasks/cms/";

function createRelCms(directory){
  var dest = directory.replace("/content/", "/static/").replace("\\content\\", "\\static\\");
  var folder = directory.slice(directory.indexOf("content")).replace(/\\/g,"/");
  if(fs.existsSync(dest)){
    deleteFolderRecursive(dest);
  }
  fs.mkdirSync(dest);
  fs.mkdirSync(dest + "/admin");
  fs.copyFileSync(cmsDir + "index.html", dest + "/admin/index.html");
  fs.copyFileSync(cmsDir + "config.yml", dest + "/admin/config.yml");
  cmsConfig.replace("{{folder}}", folder);
}

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

var walk = function(dir, done) {
  cmsConfig = fs.readFileSync(cmsDir + "config.yml").toString();

  fs.readdir(dir, function(err, list) {
    if (err) return done(err);

    var pending = list.length;

    if (!pending) return done(null, "ok");

    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          createRelCms(file);
          walk(file, function(err, res) {
            if (!--pending) done(null, "ok");
          });
        } else {
          if (!--pending) done(null, "ok");
        }
      });
    });

  });
};

//Renames netlifycms language files with "-[lang].md" to ".[lang].md"
walk("./content", function(err, message){
  if(err){
    console.log("error " + err);
    return;
  }
})