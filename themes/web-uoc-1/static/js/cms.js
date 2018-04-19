/**
 * JavaScript Get URL Parameter
 * 
 * @param String prop The specific URL parameter you want to retreive the value for
 * @return String|Object If prop is provided a string value is returned, otherwise an object of all properties is returned
 */
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
        if(this.hostname===currentHost && this.href.indexOf("/admin/#/")===-1){
            this.href = this.href + "?cms=true";
        }
    })
    
    $("#cms-editor").css("display","block");
}

function test(){
    var uploadURL ="/.netlify/git/github/git/test";

    console.log(uploadURL);

    $.ajax({
      type: "POST",
      url: uploadURL,
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
          "content": "prova prova prova",
          "encoding": "utf-8"
        })
    })
    .done(function( data ) {
        console.log( data );
    })  .fail(function(err) {
           console.log(err)
    })   
}