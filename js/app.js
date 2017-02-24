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
	self.categories = ['restaurant', 'cafe', 'bar','book_store', 'bicycle_store'];
	self.category = ko.observable('Select Category');
	self.schools = initialLoactions;
	self.school = ko.observable('Select School');

	self.isShowSchool = ko.computed(function() {
		// choose whether to show the clear button for school dropdown menu
		return self.school() !== 'Select School' ? 'inline-block' : 'none';
	});
	self.isShowCategory = ko.computed(function() {
		// choose whether to show the clear button for category dropdown menu
		return self.category() !== 'Select Category' ? 'inline-block' : 'none';
	});


	// TODO: define behaviors

	self.nonce_generate = function() {
  		return (Math.floor(Math.random() * 1e12).toString());
	};

	/**
	* @description Send a ajax request to yelp server
	* @param {object} location - the location to get the detail place information
	*/
	self.showInfoWindow = function(location) {
		toggleBounce(self.markers[location.index()]);
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
		    cll: self.markers[location.index()].position.lat+','+self.markers[location.index()].position.lng
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
			    //console.log(yelpResults);
			    if (yelpResults.businesses.length > 0) {
			    	yelpInfo.name = yelpResults.businesses[0].name;
			    	yelpInfo.phone = yelpResults.businesses[0].display_phone;
		    		yelpInfo.rating = yelpResults.businesses[0].rating;
		    		yelpInfo.ratingUrl = yelpResults.businesses[0].rating_img_url;
			    }
		    	self.makeInfoWindow(location, yelpInfo);
			},
		    fail: function(xhr, status, error) {
		      	console.log("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
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
    		var tmp = (ypInfo.rating !== 'Not available' ? "<img src='"+ ypInfo.ratingUrl + "' alt='"+ypInfo.rating+"'>" : ypInfo.rating);
			infowindow.setContent("<div>Name: " + locat.title() + "/"+ypInfo.name +"</div>"
				+ "<div>Address: "+ locat.address + "</div>"
				+ "<div>Phone: "+ (ypInfo.phone === undefined ? 'Not available' : ypInfo.phone) + "</div>"
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
ko.applyBindings(myViewModel);