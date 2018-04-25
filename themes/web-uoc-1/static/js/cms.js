$(document).ready(function(){

    //Gets config type to adapt cms in frontend
    $.get("/admin/config.yml?" + (+new Date()), function(configyml){
        if(!window.cms){
            window.cms = {};
        }

        //check if git gateway or github auth
        if(configyml.indexOf(" name: git-gateway")>-1){
            console.log("netlify identity - gitgateway auth mode");
            window.cms.type = "gitgateway";

            //Netlify identity widget
            if(window.netlifyIdentity){
                window.netlifyIdentity.on("init", user => {
                    if (!user) {
                        window.netlifyIdentity.on("login", (user) => {
                            //document.location.href = "/admin/";
                            document.location.href = "?cms=true";
                        });
                    }
                });
            }
        }else if(configyml.indexOf(" name: github")>-1){
            console.log("github auth mode");
            window.cms.type = "github";

            var getConfigKey = function(data, key){
                if(data.indexOf(key + ": ")===-1){
                    console.log(key + " not set at CMS config.yml");
                    return null;
                }
                var key = data.slice(data.indexOf(key + ": ")+(key + ": ").length);
                key = key.slice(0, key.indexOf("\n"));
                return key.replace("\r","");
            }

            window.cms.repo = getConfigKey(configyml, "repo");
            window.cms.base_url = getConfigKey(configyml, "base_url");
            window.cms.client_id = getConfigKey(configyml, "client_id");

            $("*[data-netlify-identity-button]").css("display","none"); //hides netlify identity login button
        }

        console.log("loading cms objects...");

        var currentHost = window.location.host;
        var path = window.location.pathname;
        path = path.split("/").filter(function(value){
            if(value){
                return value;
            }
        });
        
        if(currentHost.indexOf(":")>-1){
            currentHost = currentHost.slice(0, currentHost.indexOf(":"));
        }

        //attach cms=true param to internal links
        $("a").each(function() {
            if(this.hostname===currentHost && this.href.indexOf("/admin/#/")===-1 && this.href.indexOf("?cms=true")===-1){
                this.href = this.href + "?cms=true";
            }
        })

        $("#cms-editor").css("display","block");
        $(".cmsPreview").css("display","block");


        //MODAL INFO WINDOW
        window.cms.modal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['overlay', 'button', 'escape'],
            closeLabel: "Close",
            //cssClass: ['custom-class-1', 'custom-class-2'],
            onOpen: function() {
                console.log('modal open');
            },
            onClose: function() {
                console.log('modal closed');
            },
            beforeClose: function() {
                return true; // close the modal
            }
        });
    });
})

//Git management for new sections
function gitPut(files, token){
    var gitEndpoint ="/.netlify/git/github/contents/content/";

    if(window.cms.type==="github"){
        var gitEndpoint ="https://api.github.com/repos/"+window.cms.repo+"/contents/content/";
    }

    var file;
    if(files.length){
        file = files.shift();
    }

    if(!file){
        return;
    }
    var url = gitEndpoint + file[0];

    $.ajax({
        'type': 'PUT',
        'url': url,
        'headers' : {
        'Authorization' : 'Bearer ' + token,
        },
        'dataType': 'json',
        'data': JSON.stringify({
          'message': 'new section',
          'content': window.btoa(file[1])
        }),
        statusCode: {
            422: function(xhr) {
                window.cms.modal.setContent('<h1>Section exists</h1>');
                window.cms.modal.open();
            },
            401: function(xhr) {
                window.cms.modal.setContent('<h1>You are not logged</h1>');
                window.cms.modal.open();
            }
        },
        success: function (data, status) {
            if(files.length===0){
                window.cms.modal.setContent('<h1>Section has been created... Wait until site is rebuild...</h1>');
                window.cms.modal.open();
            }else{
                gitPut(files, token);
            }
        },
        error: function (xhr, desc, err) {
            console.log("error: " + xhr.status + " " + desc);
            gitPut(files, token);
        } 
    })
}

function createSection(lang, langs){

    window.cms.modal.setContent('<button class="btn btn-lg btn-warning"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span></button>');
    window.cms.modal.open();

    if(langs){
        langs = langs.split(",");
    }else{
        langs = [lang]
    }

    if(window.cms.type==="gitgateway" && $(".netlify-identity-button").first().text().toLowerCase()==="log in"){
        window.cms.modal.setContent('<h1>You are not logged</h1>');
        window.cms.modal.open();
        return;
    }

    var path = window.location.pathname || "";

    if(lang && path){
        path = path.replace("/"+lang+"/", "");
    }
    var newSection = $("#sectionName").val();
    if(!newSection){
        window.cms.modal.setContent('<h1>Inform section name</h1>');
        window.cms.modal.open();
        return;
    }

    var fnPush = function(token){
        $.get("/admin/_index.md", function(data){
            if(langs.length){
                var files = [];
                langs.map(function(v){
                    data = data.replace("{{title}}",newSection).replace("{{lang}}",v);
                    files.push([
                        path + newSection + "/_index-" + v + ".md",
                        data
                    ]);
                })
                //gitPut(path + newSection + "/_index-" + v + ".md", data, token);
                gitPut(files, token);
            }
        });
    }

    var token = "";

    //get token from gitgateway or github
    if(window.cms.type==="gitgateway"){
        netlifyIdentity.currentUser().jwt().then();
        token = netlifyIdentity.currentUser().token.access_token;
        fnPush(token)
    }else if(window.cms.type==="github"){
        token = window.localStorage.getItem("netlify-cms-user") || {};
        token = (window.localStorage.getItem("netlify-cms-user") && window.localStorage.getItem("netlify-cms-user").token ? JSON.parse(window.localStorage.getItem("netlify-cms-user")).token || null) || window.localStorage.getItem("token");
        if(!token){
            githubAuth(function(){
                fnPush(window.localStorage.getItem("token"));
            });
        }else{
            fnPush(token)
        }
    }
    
}

/**********************************************************************************************************************
   
   Git Auth Flow
   More info: https://github.com/netlify/netlify-cms/blob/190f9c261380b07b1d9800ac538f31a3fc04973c/src/lib/netlify-auth.js

***********************************************************************************************************************/
function githubAuth(cb){
    if(!window.localStorage.getItem('token')){
        window.cms.authWindow = window.open(
            "https://github.com/login/oauth/authorize?client_id=" + window.cms.client_id,
            'NetlifyCMS Authorization',
            'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, ' +
            ('width=600, height=600, top=200, left=200);')
        );                    
        window.cms.authWindow.focus();                
    }else{
        //console.log(window.localStorage.getItem('token'))
    }
    window.addEventListener('message', access(cb), false);    
}

function authorization(cb){
    const fnAuth = (e) => {
        var data, err;
        if (e.origin !== window.cms.base_url) { return; }
        if (e.data.indexOf('authorization:github:success:') === 0) {
            data = JSON.parse(e.data.match(new RegExp('^authorization:github:success:(.+)$'))[1]);
            window.removeEventListener('message', fnAuth, false);
            window.localStorage.setItem('token', data.token);
            window.cms.authWindow.close();
            cb();
        }
        if (e.data.indexOf('authorization:github:error:') === 0) {
            console.log('Got authorization error');
            err = JSON.parse(e.data.match(new RegExp('^authorization:github:error:(.+)$'))[1]);
            window.removeEventListener('message', fnAuth, false);
            window.cms.authWindow.close();
        }
    };
    return fnAuth;
}

function access(cb){
    const fnAccess = (e) => {
      if (e.data === ('authorizing:github')){ //&& e.origin === window.cms.base_url) {
        window.removeEventListener('message', fnAccess, false);
        window.addEventListener('message', authorization(cb), false);
        return window.cms.authWindow.postMessage(e.data, e.origin);
      }
    };
    return fnAccess;
}