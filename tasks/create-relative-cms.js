var fsloop = require('./looper')().fsloop;
var fs = require('fs');
var path = require('path');
var cmsConfig = null;

var cmsDir = "./static/admin/";
var cmsDestDir = "./static/admin/";
var cmsConfig = fs.readFileSync(cmsDir + "relative.yml").toString();

// creates /admin folder in every "section"
function createRelCms(directory){
  var dest = directory.replace("/content/", "/static/admin/").replace("\\content\\", "\\static\\admin\\");

  var folder = directory.slice(directory.indexOf("content")).replace(/\\/g,"/");
  var folderSection = "./" + directory.slice(directory.indexOf("content")).replace(/\\/g,"/");;

  if(fs.existsSync(dest)){
    deleteFolderRecursive(dest);
  }
  //fs.mkdirSync(dest);
  fs.mkdirSync(dest + "/");
  fs.copyFileSync(cmsDir + "index.html", dest + "/index.html");
  fs.writeFileSync(dest + "/config.yml", cmsConfig.replace(/{{folder}}/g, folder).replace(/{{folder_section}}/g, folderSection));  
}

//deletes folder if exists
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


//loops content folder
fsloop(
  "./content", 
  function(file){
    createRelCms(file);
  }, 
  null,
  function(err, message){
    if(err){
      console.log("error " + err);
      return;
    }
  }
)