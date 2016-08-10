
//getStopData.js
//ahenry
//comment
function getStop(lat, lon, submitDate, submitTime){
	if(!isNaN(lat) && !isNaN(lon)){
		$.getJSON("./services/stops.php", {lat: lat, lon:lon, r:250 }, function(data){
				
				// Paragraph version of parsing data 
				$("#stops").empty();
				$.each(data.stops, function(index, value) {
						//console.log(value);
						$("#stops").append("<h2>" + value.name + "</h2><input type=\"button\"" +
							" data-coords=\"" + value.geometry.coordinates + "\" value=\"View Map\"" + 
							" class=\"viewStopBtn ui mini blue button\"><br><table id=\"" + 
							jq_id(value.onestop_id) + "\" border=\"1\"" + " class=\"tblFindStops\">" +
							"<thead><th>Route</th><th>Time</th><th></th></thead><tbody></tbody></table>");
						
						$(".viewStopBtn").click(function() {
								var latLng = $(this).attr("data-coords");
								var t = latLng.split(",");
								
								initMap();
								moveMap(t);
								//google.maps.event.trigger(map, "resize");
								setMarker(t, stop.name);
						});
						
						getDepartures(value, submitDate, submitTime);
						
				});
				
		});
	}
	
}

function getDepartures(stop, submitDate, submitTime){
	
	var t = submitTime.split(":");
	var e = parseInt(t[0]) + 3;
	var res = submitTime + "," + e + ":" + t[1] + ":" + t[2];

	var tempTimeInterval = "13:00:00,15:00:00";
	
	$.ajax({
			method: "GET",
			url: "./services/schedule_stop_pairs.php", 
			data: 
				{ 
					origin_onestop_id: stop.onestop_id, 
					total: true, 
					date: submitDate, 
					origin_departure_between: tempTimeInterval
				},
			success: function(data) { 
						//console.log(data);
						buildRouteList(data, stop);
				},
			dataType: "json",
			async: false
	});
	
}

function getAllStops(route, submitDate) {
	if(!isNaN(route) && !isNaN(submitDate)) {
		$.getJSON("./services/schedule_stop_pairs.php", {
				route_onestop_id: route
			}, function(data){}); 
	}
}

function getAllDepartures(stop, submitDate) {
	
}

function buildRouteList(data, stop) {
	var dest;
	var pid;
	var rids = [];
	
	//console.log(stop);
	//console.log(data);
	
	$.each(data.schedule_stop_pairs, function(i, p) {
			if($.inArray(p.route_onestop_id, rids) < 0) {
				rids.push(p.route_onestop_id);
			}
	});
	
	//console.log($("#" + jq_id(stop.onestop_id)));
	
	$.each(stop.routes_serving_stop, function(i, route) {
			
			pid = jq_id(route.route_onestop_id);
			
			if($.inArray(pid, rids) != -1) {

				$.each(data.schedule_stop_pairs, function(j, pair) {
						if(pair.route_onestop_id == route.route_onestop_id) {
							dest = pair.trip_headsign;
						}
				});
				
				// Paragraph Version
				$.each(data.schedule_stop_pairs, function(j, pair) {
						if(pair.route_onestop_id == pid) {
							$("table#" + jq_id(stop.onestop_id) + " tbody").append("<tr><td>" + route.route_name + 
								": " + dest + "</td><td>" + convertTime(pair.origin_arrival_time) + "</td><td> " +
								"<input type=\"button\"" + " class=\"routeViewBtn  ui" +
								" mini blue button\" data-id=\"" + pid + "\" value=\"View Route\"></td></tr>");
						}
				});
			} // end if inArray
			
	}); // end .each(stop.routes)
	
	$(".routeViewBtn").click(function() {
			$("#stops").slideUp(500);
			$(".getRouteMenu").trigger("click");
			$("#allRoutes").val($("option[value=\"" + $(this).attr("data-id") + "\"]").val());
			$("#btnRouteSubmit").trigger("click");
	});
}

function jq_id(id) {
	var s = id.replace( /(:|\.|\[|\]|,)/g, "\\$1" );
	return s.replace( /~/g, "_");
}

function convertTime(time) { //credit to user HBP on StackOverflow for conversion code inspiration
  // Check correct time format and split into components
  time = time.toString().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice(1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join(''); // return adjusted time or original string
}
