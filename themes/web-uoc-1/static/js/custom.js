//require.config({paths:{jquery:"/js/jquery.min",bootstrap:"/js/bootstrap/js/bootstrap.min",videojs:"/js/player/video",appHome:"my_modules/appHome"},shim:{bootstrap:["jquery"],videojs:["jquery"],appHome:["jquery"]}}),require(["jquery","appHome","bootstrap","videojs"],function(o){var e=videojs("video1");appHome.init(e),myPlayer.cargarvideo(e),myPlayer.crearEnlaces("video1"),e.on("timeupdate",function(){e.currentTime()>=12&&e.currentTime()<=43?o(".vjs-bloque").fadeIn(2e3):o(".vjs-bloque").fadeOut(2e3)}),o(".modal.modal-bootstrap").on("shown.bs.modal",function(){e.pause()}),o(".modal.modal-bootstrap").on("show.bs.modal",function(){appHome.centerModals()}),o(".modal.modal-bootstrap").on("hidden.bs.modal",function(){e.play()}),o(window).resize(function(){appHome.centerModals()})});

var azSearchClient = null;

if(location.href.indexOf("/cercador")>-1){

	$(document).ready(function(){
		azSearchClient = AzureSearch({
			url: "https://cercador-uoc.search.windows.net",
			key:"C23267226BF662591CA1F4C1650F4F54"
		});


		// search the index (note that multiple arguments can be passed as an array)
		azSearchClient.search('proves', {search: "principis", top: 10}, function(err, results){
			console.log(results)
		});

		// suggest results based on partial input
		//azSearchClient.suggest('myindex', {search: "doc"}, function(err, results){
			// optional error, or an array of matching results
		//});	
	})

}