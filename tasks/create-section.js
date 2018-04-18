var fs = require('fs');
var path = require('path');

var taskfile = "./tasks/tasks.json";
var contentDir = "./content/";

var tasks = fs.readFileSync(taskfile).toString();

try{
  tasks = JSON.parse(tasks);
}catch(e){
  tasks = null;
}

console.log(tasks)

if(tasks){
  if(!fs.existsSync(contentDir+tasks.absfolder)){
      fs.mkdirSync(contentDir+tasks.absfolder);
  }
}
