function initMap(coords) {
	
	var mapDiv = document.getElementById('map');
	map = new google.maps.Map(mapDiv, {
		  center: {lat: parseFloat(coords[1]), lng: parseFloat(coords[2])},
		  zoom: 10
	});
	
	markers = [];
	infowindow = new google.maps.InfoWindow({
			content: ""
	});
	
	google.maps.event.addListenerOnce(map, "idle", function() {
			map.setZoom(16);
	});
}

function moveMap(latLng) {
	
	map.panTo(latLng);
	google.maps.event.addListenerOnce(map, "idle", function() {
			map.setZoom(16);
	});
	
}

function setMarker(latLng, name, info) {
	
	//console.log(info);
	
	m = new google.maps.Marker({
		map: map,
		position: {lat: parseFloat(latLng[1]), lng: parseFloat(latLng[0])},
		draggable: false,
		title: name,
		animation: google.maps.Animation.DROP,
		data: info
	});
	
	
	
	//for(var i = 0; i < markers.length; i++) {
		//google.maps.event.clearInstanceListeners(markers[i]);
	//m.addListener("click", function() {
			//$("#stops").html("<p>" + this.data + "</p>");
			//console.log(this.data);
			//$("#stops").slideDown(500);
	//});
	//}	
	//markers.push(m);
}

function setInfo(mark, info) {
	mark.addListener("click", function() {
			infowindow.close();
			infowindow = new google.maps.InfoWindow({
					content: info,
			});
			infowindow.open(map, marker);
	});
}

function closeWindows() {
	for(var i = 0; i < windows.length; i++) {
		windows[i].close();
	}
}

function clearMarkers() {
	for(var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	
	markers = [];
}
