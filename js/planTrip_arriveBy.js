//PlanTrip-arriveBy.js
//audrey henry

/*I decided to put this into its own file for now, as I don't want to clog up the busForm.js file.*/

function getTrips_arriveBy(origin, destination, date, time){
	var arriveByRequest = new google.maps.DirectionsService;
	var directionsDisplay = new google.maps.DirectionsRenderer;
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 7, center: {lat: 47.6588, lng: -117.4260}
        });
    directionsDisplay.setMap(map);
	var D = combineDateTime(date, time);
	arriveByRequest.route({origin: origin, destination: destination, travelMode: 'TRANSIT', 
	transitOptions: {arrivalTime: D, modes: ['BUS'], routingPreference: 'LESS_WALKING'}, provideRouteAlternatives: Boolean(1)}, function(response, status){
		if(status === 'OK'){
			var now = new Date();
			//If we're looking for times today, take out all of the routes that have already left.
			if(now.toDateString() === D.toDateString()){				
				for(var i = 0; i < response.routes.length; i++){
					if(response.routes[i].legs[0].departure_time < now){
						response.routes.splice(i, 1);
					}
				}
			}
			//Take out any outliers that arrive 3 hours before the desired time
			for(var i = 0; i < response.routes.length; i++){
				var routeArrivalTime = response.routes[i].legs[response.routes[i].legs.length - 1].arrival_time;
				var test = (D - new Date(routeArrivalTime.value)) / (1000*60*60);
				if(((D - new Date(routeArrivalTime.value)) / (1000*60*60)) > 3){
					response.routes.splice(i, 1);
				}
			}
			$("#map").show();
			google.maps.event.trigger(map, 'resize');
			directionsDisplay.setDirections(response);
			$("#routes").empty();
			for(var j = 0; j < response.routes.length; j++){
				$("#routes").append(makeRoutes(response,j));
			}
			$("#routesList").show();
			
			$(".pRoutesRow").click(function(){
				var v = $.parseJSON($(this).attr("value"));
				directionsDisplay.setDirections(v);
			});
		} else{
			window.alert("Error: Unable to retrieve the data.");
		}
	});
}
