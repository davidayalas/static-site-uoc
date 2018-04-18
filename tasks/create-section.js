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

if(tasks && tasks.directory && tasks.folder){
	var folder = dir+"content/"+tasks.directory+tasks.folder;
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
 
		git
			.raw(
				 ["config", "user.name", "netlify-hugo"]
			)
			.raw(
				 ["config", "user.email", "netlify-hugo@netlify.com"]
			)
			//.pull(remote, "master")
			//.add(dir+"/*")
			.add(folder+"/*")
			.add(path.join(__dirname, "../", taskfile))
			.commit("new section!")
			//.push(remote, "master", "--force");
			.raw(
				 ["push", remote, "master", "--force"]
			)

	}
}