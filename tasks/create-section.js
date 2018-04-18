var fs = require('fs');
var path = require('path');

var taskfile = "./tasks/tasks.json";
var cmsDir = "./tasks/cms/";

var tasks = fs.readFileSync(taskfile).toString();

try{
  tasks = JSON.parse(tasks);
}catch(e){
  tasks = null;
}

if(tasks && tasks.route && tasks.folder){
	if(!fs.existsSync(tasks.route+tasks.folder)){
		console.log("Creating dir: " + tasks.route+tasks.folder)
		fs.mkdirSync(tasks.route+tasks.folder);
		fs.copyFileSync(cmsDir + "_index.md", tasks.route+tasks.folder + "/_index-ca.md");
		fs.copyFileSync(cmsDir + "_index.md", tasks.route+tasks.folder + "/_index-es.md");
		fs.copyFileSync(cmsDir + "_index.md", tasks.route+tasks.folder + "/_index-en.md");
	}
}
