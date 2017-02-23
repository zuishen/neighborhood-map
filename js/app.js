var Location = function(data) {
	this.index = ko.observable(data.index)
	this.title = ko.observable(data.name);
	this.address = data.address;
};


var ViewModel = function() {
	var self = this;
	self.locationList = ko.observableArray([]);
	self.markers = [];
	self.categories = ['restaurant', 'cafe', 'bar','book_store', 'bicycle_store'];
	self.category = ko.observable('Select Category');
	self.schools = initialLoactions;
	self.school = ko.observable('Select School');
	self.isShowCategory = ko.computed(function() {
		return self.category() !== 'Select Category' ? 'inline-block' : 'none'; 
	});
	self.isShowSchool = ko.computed(function() {
		return self.school() !== 'Select School' ? 'inline-block' : 'none'; 
	});

	self.YELP_KEY = "PsvRnMIZQvIaO8ep4seiVA";
	self.YELP_TOKEN = "TU2sUM696U3dfao0Xm83w0yv-Uob4ihe";
	self.YELP_KEY_SECRET = "RmEDmlFW0g4oDK1z4CCWbeh_ylY";
	self.YELP_TOKEN_SECRET = "vq-fjHSA9fV8bTQTmUoatAxAe3U";

	self.yelp_url = 'https://api.yelp.com/v2/search';


	self.nonce_generate = function() {
  		return (Math.floor(Math.random() * 1e12).toString());
	};

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
		    callback: 'cb',           // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
		    location: location.address.split(' ').join('+'),//'3601+Trousdale+Parkway,+Los Angeles',
		    //sort: '1',

		    term: location.title(),
		    cll: self.markers[location.index()].position.lat+','+self.markers[location.index()].position.lng
  		};

  		var encodedSignature = oauthSignature.generate('GET', self.yelp_url, parameters, self.YELP_KEY_SECRET, self.YELP_TOKEN_SECRET);
  		parameters.oauth_signature = encodedSignature;

		var settings = {
		    url: self.yelp_url,
		    data: parameters,
		    cache: true,                // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
		    dataType: 'jsonp',
		    success: function(yelpResults) {
			    // Do stuff with results
			  //   var i = -1;
			  //   yelpResults.businesses.forEach(function(item) {
			  //   	if (item.name.replace('&', 'and').includes(location.title()) || location.title().includes(item.name.replace('&', 'and'))) {
			  //   		i = yelpResults.businesses.indexOf(item);
			  //   	}
					// console.log(item.name);
			  //   });
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

	self.addMarker = function(marker, name, address) {
		var i = self.markers.length;
		self.markers.push(marker);
		self.locationList.push(new Location({index: i, name: name, address: address}));
		return i;
	};

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
 
	self.categorySelect = function(value) {
		self.category(value);
		self.clearLocations();
		//nearbySearch(locat, [value]);
		initialLoactions.forEach(function(item) {
			if (item.title == self.school() || self.school() == 'Select School') {
				nearbySearch(item.location, [value]);
			}
		});
	};

	self.schoolSelect = function(value) {
		self.school(value.title);
		self.clearLocations();
		var cate = (self.category() === 'Select Category' ? self.categories : [self.category()]);
		//nearbySearch(locat, [value]);
		self.schools.forEach(function(item) {
			if (item.title == value.title) {
				nearbySearch(item.location, cate);
			}
		});
	};

	self.getLocation = function(i) {
		return self.locationList()[i];
	};

	self.clearLocations = function() {
		self.markers.forEach(function(marker) {
			marker.setMap(null);	
		});
		self.markers = [];
		self.locationList([]);
		bounds = new google.maps.LatLngBounds();
	};

	self.clearSchool = function() {
		self.school('Select School');
		self.clearLocations();
		var cate = (self.category() === 'Select Category' ? self.categories : [self.category()]);
		initialLoactions.forEach(function(item) {
			nearbySearch(item.location, cate);
		});
	};

	self.clearCategory = function() {
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

