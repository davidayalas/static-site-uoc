//Netlify identity widget
function login(){
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
}
login();

//CMS management
function getUrlParams( prop ) {
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


//Git management for new sections
function gitPut(url, data){
    console.log(url)
    $.ajax({
      'type': 'PUT',
      'url': url,
      'headers' : {
        'Authorization' : 'Bearer ' + netlifyIdentity.currentUser().token.access_token,
      },
      'dataType': 'json',
      'data': JSON.stringify({
          'message': 'new section',
          'content': window.btoa(data)
        })
    })
    .done(function( data ) {
        alert("OK!")
        console.log(data);
        $("#addSectionBlock").css("display", "none");
    })  
    .fail(function(err) {
        alert("exists!!")
        $("#addSectionBlock").css("display", "none");
        console.log(err)
    })   
}

function createSection(lang){
    var uploadURL ="/.netlify/git/github/contents/content/";
    var path = window.location.pathname || "";
    if(lang && path){
        path = path.replace("/"+lang+"/", "");
    }
    var newSection = $("#sectionName").val();

    if(!newSection){
        alert("No section!")
        return;
    }

    var create = function(){
        $.get("/admin/_index.md", function(data){
            data = data.replace("{{title}}",newSection).replace("{{lang}}",lang);
            gitPut(uploadURL + path + newSection + "/_index-" + lang + ".md", data);
        });
    }

    if(!netlifyIdentity.user){
        login(create);
    }else{
        netlifyIdentity.user.jwt().then();
        create();
    }
}