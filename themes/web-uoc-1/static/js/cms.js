
$(document).ready(function(){

    //Gets config type to adapt cms in frontend
    $.get("/admin/config.yml", function(configyml){
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
            var repo = configyml.slice(configyml.indexOf("repo: ")+6);
            repo = repo.slice(0, repo.indexOf("\n"));
            window.cms.base_url = configyml.slice(configyml.indexOf("base_url: ")+10);
            window.cms.base_url = window.cms.base_url.slice(0, window.cms.base_url.indexOf("\n"));

            window.cms.repo = repo;

            $("*[data-netlify-identity-button]").css("display","none"); //hides netlify identity login button
        }
    });

    //CMS management
    var getUrlParams = function(prop) {
        var params = {};
        var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
        var definitions = search.split( '&' );

        definitions.forEach( function( val, key ) {
            var parts = val.split( '=', 2 );
            params[ parts[ 0 ] ] = parts[ 1 ];
        } );

        return ( prop && prop in params ) ? params[ prop ] : params;
    }

    if(getUrlParams("cms")==="true"){

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
    }
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
                alert('section exists!');
            },
            401: function(xhr) {
                alert('not logged!');
            }
        },
        success: function (data, status) {
            if(files.length===0){
                alert("section created!");                
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

    if(langs){
        langs = langs.split(",");
    }else{
        langs = [lang]
    }


    if(window.cms.type==="gitgateway" && $(".netlify-identity-button").first().text().toLowerCase()==="log in"){
        alert("not logged");
        return;
    }

    var path = window.location.pathname || "";

    if(lang && path){
        path = path.replace("/"+lang+"/", "");
    }
    var newSection = $("#sectionName").val();

    if(!newSection){
        alert("No section!")
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
        token = sessionStorage.getItem("token");
        if(!token){
            githubAuth(function(){
                fnPush(sessionStorage.getItem("token"))
            });
        }else{
            fnPush(token)
        }
    }
    
}

/******************
   Git auth flow
   More info: https://github.com/netlify/netlify-cms/blob/190f9c261380b07b1d9800ac538f31a3fc04973c/src/lib/netlify-auth.js
*******************/
function githubAuth(cb){
    if(!sessionStorage.getItem('token')){
        window.cms.authWindow = window.open(
            "https://github.com/login/oauth/authorize?client_id=b135b68c2ba0bd0c422a",
            'NetlifyCMS Authorization',
            'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, ' +
            ('width=600, height=600, top=200, left=200);')
        );                    
        window.cms.authWindow.focus();                
    }else{
        console.log(sessionStorage.getItem('token'))
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
            sessionStorage.setItem('token', data.token);
            console.log(data.token);
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