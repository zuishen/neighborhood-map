/**
* @description Represents a single marker with basic info on map
* @constructor
* @param {object} data - The infomation about a location
* @param {number} data.index - The index of the assosicate marker
* @param {string} data.title - The name of the location
* @param {string} data.address - The address of the location 
*/
var Location = function(data) {
	this.index = ko.observable(data.index);
	this.title = ko.observable(data.name);
	this.address = data.address;
};


var ViewModel = function() {
	var self = this;

	// TODO: define constant value
	self.YELP_KEY = "PsvRnMIZQvIaO8ep4seiVA";
	self.YELP_TOKEN = "TU2sUM696U3dfao0Xm83w0yv-Uob4ihe";
	self.YELP_KEY_SECRET = "RmEDmlFW0g4oDK1z4CCWbeh_ylY";
	self.YELP_TOKEN_SECRET = "vq-fjHSA9fV8bTQTmUoatAxAe3U";
	self.YELP_URL = 'https://api.yelp.com/v2/search';

	// TODO: define properties
	self.locationList = ko.observableArray([]);
	self.markers = [];
	self.filter = [];   //save the index of markers after filter
	self.categories = ['restaurant', 'cafe', 'bar','food', 'store', 'park', 'mall'];
	self.category = ko.observable('Select Category');
	self.schools = initialLoactions;
	self.school = ko.observable('Select School');
	self.width = ko.observable($(window).width());
	self.isClick = ko.observable(self.width() > 1024 ? true : false);
	self.query = ko.observable('');
	self.list = ko.computed(function() {
		if (!self.query()) {
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), (location) => {
				return location.title().toLowerCase().indexOf(self.query().toLowerCase()) !== -1; 
			});
		}
	});

	self.isShowSchool = ko.computed(function() {
		// choose whether to show the clear button for school dropdown menu
		return self.school() !== 'Select School' ? 'inline-block' : 'none';
	});
	self.isShowCategory = ko.computed(function() {
		// choose whether to show the clear button for category dropdown menu
		return self.category() !== 'Select Category' ? 'inline-block' : 'none';
	});
	self.smallWidth = ko.computed(function() {
		//console.log(self.width());
		if (self.width() < 568) {
			return self.isClick() ? self.width() * -0.8 + 'px': '0';
		} else if (self.width() > 1024){
			return '0';
		} else {
			return self.isClick() ? '-330px' : '0';
		}
	});
	self.slideWidth = ko.computed(function() {
		if (self.width() < 568) {
			return self.isClick() ? self.width() * 0.8 + 'px' : '0';
		} else if (self.width > 1024) { 
			return self.isClick() ? '0' : '330px';
		}else{
			return self.isClick() ? '330px' : '0';
		}

	});


	// TODO: define behaviors

	self.slide = function() {
		self.isClick(!self.isClick());
		setTimeout(function() {
		  //your code to be executed after 0.301 second
		  google.maps.event.trigger(map, 'resize');
		}, 300);
	};

	self.search = function(value) {
		//console.log(self.filter());
		self.filter = [];

		self.locationList().forEach(function(item) {
			if(item.title().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
				self.filter.push(item.index());
			}
		});
		self.markers.forEach(function(marker) {
			marker.setMap(null);
		});
		self.filter.forEach(function(elem) {
			self.markers[elem].setMap(map);
		});
	};

	self.query.subscribe(self.search);

	self.nonce_generate = function() {
  		return (Math.floor(Math.random() * 1e12).toString());
	};

	/**
	* @description Send a ajax request to yelp server
	* @param {object} location - the location to get the detail place information
	*/
	self.showInfoWindow = function(location) {
		var tmpMarker = self.markers[location.index()];
		centerMarker(tmpMarker);
		toggleBounce(tmpMarker);
		//console.log(location.title());

		var yelpInfo = {
			name: 'Not available',
			phone: 'Not available', 
			rating: 'Not available', 
			ratingUrl: 'Not available'
		};
		var parameters = {
		    oauth_consumer_key: self.YELP_KEY,
		    oauth_token: self.YELP_TOKEN,
		    oauth_nonce: self.nonce_generate(),
		    oauth_timestamp: Math.floor(Date.now()/1000),
		    oauth_signature_method: 'HMAC-SHA1',
		    oauth_version : '1.0',
		    callback: 'cb',// This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
		    location: location.address.split(' ').join('+'),
		    term: location.title(),
		    cll: tmpMarker.position.lat + ',' + tmpMarker.position.lng
  		};

		var encodedSignature = oauthSignature.generate(
													'GET', 
													self.YELP_URL, 
													parameters, 
													self.YELP_KEY_SECRET, 
													self.YELP_TOKEN_SECRET
  												);

  		parameters.oauth_signature = encodedSignature;

		var settings = {
		    url: self.YELP_URL,
		    data: parameters,
		    // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", 
		    // invalidating our oauth-signature
		    cache: true,
		    dataType: 'jsonp',
		    success: function(yelpResults) {
			    // Do stuff with results
			    console.log(yelpResults);
			    if (yelpResults.businesses.length > 0) {
			    	yelpInfo.name = yelpResults.businesses[0].name || 'No place found';
			    	yelpInfo.phone = yelpResults.businesses[0].display_phone || 'No phone provided';
		    		yelpInfo.rating = yelpResults.businesses[0].rating || 'No rating available';
		    		yelpInfo.ratingUrl = yelpResults.businesses[0].rating_img_url || 'Not availabe';
			    }
		    	self.makeInfoWindow(location, yelpInfo);
			},
		    error: function(xhr, status, error) {
		    	alert('Failed to get Yelp information!');
		    	self.makeInfoWindow(location, yelpInfo);
		    	//toggleBounce(self.markers[location.index()]);
		      	//console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
		    }
		};

		// Send AJAX query via jQuery library.
		$.ajax(settings);
	};
	/**
	* @description add the new marker to self.marks array and construct a new location
	*             and push it to self.locationList array
	* @param {object} marker - marker associate to google maps API
	* @param {string} name - the name of the location where this marker on 
	* @param {string} address - the address of this location
	* @return {number} i - the index of the marker and the location in arrays storing them
	*/
	self.addMarker = function(marker, name, address) {
		var i = self.markers.length;
		self.filter.push(i);
		self.markers.push(marker);
		self.locationList.push(new Location({index: i, name: name, address: address}));
		return i;
	};

	/**
	* @description Set the content of the infoWindow and show it on the specified marker
	* @param {object} locat - location object
	* @param {object} ypInfo - additional content to show on infoWindow  
	*/
	self.makeInfoWindow = function(locat, ypInfo) {
		var marker = self.markers[locat.index()];
    	if (infowindow.marker != marker) {
    		var tmp = (ypInfo.rating !== 'No rating available' ? "<img src='"+ ypInfo.ratingUrl + "' alt='"+ypInfo.rating+"'>" : ypInfo.rating);
			infowindow.setContent("<div>Name: " + locat.title() + "</div>"//"/"+ypInfo.name +"</div>"
				+ "<div>Address: "+ locat.address + "</div>"
				+ "<div>Phone: "+ ypInfo.phone + "</div>"
				+ "<div>Rating: " + tmp + "</div>"
			);
		}
		infowindow.open(map, marker);
		infowindow.addListener('closeclick', function() {
			infowindow.setPosition(null);
		});
		toggleBounce(marker);
	};
 
 	/**
 	* @description Actions when the item in category dropdown menu is selected
 	* @param {string} value - the content of the selected item (category name)
 	*/
	self.categorySelect = function(value) {
		self.category(value);
		self.clearLocations();
		// TODO: search the nearby of the selected school according to
		//       the value(selected category)
		initialLoactions.forEach(function(item) {
			if (item.title == self.school() || self.school() == 'Select School') {
				nearbySearch(item.location, [value]);
			}
		});
	};

	/**
 	* @description Actions when the item in school dropdown menu is selected
 	* @param {string} value - the content of the selected item (school name)
 	*/
	self.schoolSelect = function(value) {
		self.school(value.title);
		self.clearLocations();
		var cate = (self.category() === 'Select Category' ? self.categories : [self.category()]);
		// TODO: search the nearby of the selected school according to
		//       the value(selected category)
		self.schools.forEach(function(item) {
			if (item.title == value.title) {
				nearbySearch(item.location, cate);
			}
		});
	};

	self.getLocation = function(i) {
		// TODO: get the specific location using index
		return self.locationList()[i];
	};


	self.clearLocations = function() {
		// TODO: Delete all markers
		self.markers.forEach(function(marker) {
			marker.setMap(null);
		});
		// TODO: clear the marker array and location array
		self.markers = [];
		self.locationList([]);
		// TODO: Init a new map bounds
		bounds = new google.maps.LatLngBounds();
	};

	self.clearSchool = function() {
		// TODO: Actions when the clear button for school is clicked
		self.school('Select School');
		self.clearLocations();
		var cate = (self.category() === 'Select Category' ? self.categories : [self.category()]);
		initialLoactions.forEach(function(item) {
			nearbySearch(item.location, cate);
		});
	};

	self.clearCategory = function() {
		// TODO: Actions when the clear button for category is clicked
		self.category('Select Category');
		self.clearLocations();
		initialLoactions.forEach(function(item) {
			if (item.title == self.school() || self.school() == 'Select School') {
				nearbySearch(item.location, self.categories);
			}
		});
	};
};

var myViewModel = new ViewModel();
var $window = $(window);
$window.resize(function () {
    myViewModel.width($window.width());
});
ko.applyBindings(myViewModel);