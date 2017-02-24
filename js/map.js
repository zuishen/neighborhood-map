var map;
var infowindow;
var bounds;
var service;
//var locat = {lat: 34.0223519, lng: -118.285117};
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 34.0223519, lng: -118.285117},
		zoom: 13
	});
	service = new google.maps.places.PlacesService(map);
	initialLoactions.forEach(function(item) {
		nearbySearch(item.location, myViewModel.categories);
	});

	infowindow = new google.maps.InfoWindow();
	bounds = new google.maps.LatLngBounds();
}

function nearbySearch(location, types) {
	service.nearbySearch({
		location: location,
		radius: '1000',
		types: types
	}, callback);
}

function callback(results, status) {
	//console.log(results);
	if (status === google.maps.places.PlacesServiceStatus.OK) {
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i]);
		}
	}
	map.fitBounds(bounds);
}

function createMarker(place) {
	// TODO: create a marker using place (JSON object from result)
  	var placeLoc = place.geometry.location;
  	var marker = new google.maps.Marker({
	    map: map,
	    position: place.geometry.location,
	    animation: google.maps.Animation.DROP
  	});
  	bounds.extend(marker.position);
  	var index = myViewModel.addMarker(marker, place.name, place.vicinity);
  	google.maps.event.addListener(marker, 'click', function() {
    	myViewModel.showInfoWindow(myViewModel.getLocation(index));
  	});
}

function toggleBounce(marker) {
  	if (marker.getAnimation() !== null) {
    	marker.setAnimation(null);
  	} else {
    	marker.setAnimation(google.maps.Animation.BOUNCE);
  	}
}