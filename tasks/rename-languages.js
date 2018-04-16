var fs = require('fs');
var path = require('path');
var siteLanguages = ["ca", "es", "en"];

function renameFile(_old, _new){
  fs.rename(_old, _new, function(err) {
      if(err){
        console.log('Error: ' + err);
      }
  });
}

var walk = function(dir, done) {
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);

    var pending = list.length;

    if (!pending) return done(null, "ok");

    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            if (!--pending) done(null, "ok");
          });
        } else {
          //rename file
          var pos = -1;
          for(var l=0, ls=siteLanguages.length; l<ls; l++){
            pos = file.indexOf("-"+siteLanguages[l]+".md");
            if(pos>-1){
              renameFile(file, file.slice(0,pos)+"."+siteLanguages[l]+".md");
            }
          }
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