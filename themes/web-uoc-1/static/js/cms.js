$(document).ready(function(){

    //Gets config type to adapt cms in frontend
    $.get("/admin/config.yml", function(congifyml){
        if(!window.cms){
            window.cms = {};
        }
        if(congifyml.indexOf("name: git-gateway")>-1){
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
        }else if(congifyml.indexOf("name: github")>-1){
            window.cms.type = "github";
            var repo = congifyml.slice(congifyml.indexOf("repo: ")+6);
            repo = repo.slice(0, repo.indexOf(" "));
            window.cms.repo = repo;
            $("*[data-netlify-identity-button]").css("display","none");
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

    if($(".netlify-identity-button").first().text().toLowerCase()==="log in"){
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

    netlifyIdentity.currentUser().jwt().then();
    var token = netlifyIdentity.currentUser().token.access_token;
    
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