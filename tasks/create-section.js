var fs = require('fs');
var path = require('path');

var dir = path.join(__dirname, '../')

const git = require('simple-git')(dir);

var taskfile = "./tasks/tasks.json";
var cmsDir = "./tasks/cms/";
var tasks = fs.readFileSync(taskfile).toString();

try{
  tasks = JSON.parse(tasks);
}catch(e){
  tasks = null;
}

console.log(tasks)

if(tasks && tasks.directory && tasks.folder){
	var folder = dir+"content/"+tasks.directory+tasks.folder;
	console.log(folder)
	if(!fs.existsSync(folder)){
		console.log("Creating dir: " + folder)
		var files = [
			folder + "/_index-ca.md",
			folder + "/_index-es.md",
			folder + "/_index-en.md"
		];

		fs.mkdirSync(folder);

		files.map(function(file){
			fs.copyFileSync(cmsDir + "_index.md", file);
		})

		tasks.directory = "";
		tasks.folder = "";
		fs.writeFileSync(taskfile, JSON.stringify(tasks));

		//GIT PUSH
		const USER = process.env.GIT_USER;
		const PASS = process.env.GIT_PWD;
		const REPO = process.env.GIT_REPO;
		const remote = `https://${USER}:${PASS}@${REPO}`;

		try{
			//git.addRemote('netlify', remote)
		}catch(e){}


		git
			.pull()
			.add(dir+"/*")
			.commit("new section!")
			.push("netlify", "master", ["--force"]);
	}
}


