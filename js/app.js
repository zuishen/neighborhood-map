var Location = function(data) {
	this.index = ko.observable(data.index)
	this.title = ko.observable(data.name);
	this.address = data.address;
};


var ViewModel = function() {
	var self = this;
	self.locationList = ko.observableArray([]);
	self.markers = [];
	self.categories = ['food', 'park', 'store'];
	self.category = ko.observable('Select Category');
	self.isShow = ko.computed(function() {
		return self.category() !== 'Select Category' ? 'inline-block' : 'none'; 
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
		    radius_filter: '300',
		    limit: '30',
		    //term: 'food',
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
			    var i = -1;
			    yelpResults.businesses.forEach(function(item) {
			    	if (item.name.replace('&', 'and').includes(location.title()) || location.title().includes(item.name.replace('&', 'and'))) {
			    		i = yelpResults.businesses.indexOf(item);
			    	}
					console.log(item.name);
			    });
			    console.log(yelpResults);
			    
			    if (yelpResults.businesses.length > 0 && i != -1) {
			    	yelpInfo.name = yelpResults.businesses[i].name;
			    	yelpInfo.phone = yelpResults.businesses[i].display_phone;
		    		yelpInfo.rating = yelpResults.businesses[i].rating;
		    		yelpInfo.ratingUrl = yelpResults.businesses[i].rating_img_url;
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

	self.addMarker = function(i, marker, name, address) {
		self.markers.push(marker);
		self.locationList.push(new Location({index: i, name: name, address: address}));
	};

	self.makeInfoWindow = function(locat, ypInfo) {
		var marker = self.markers[locat.index()];

    	if (infowindow.marker != marker) {
			infowindow.setContent("<div>Name: " + locat.title() + "/"+ypInfo.name +"</div>"
				+ "<div>Address: "+ locat.address + "</div>"
				+ "<div>Phone: "+ ypInfo.phone + "</div>" 
				+ "<div>Rating: <img src='"+ ypInfo.ratingUrl + "' alt='"+ypInfo.rating+"/5.0'></div>"
			);
		}
		infowindow.open(map, marker);
		infowindow.addListener('closeclick', function() {
			infowindow.setPosition(null);
		});
	};
 
	self.categorySelect = function(value) {
		self.category(value);
		self.clearLocations();
		nearbySearch(locat, [value]);
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
	};

	self.clearCategory = function() {
		self.category('Select Category');
		self.clearLocations();
		nearbySearch(locat, self.categories);
	};
};

var myViewModel = new ViewModel();
ko.applyBindings(myViewModel);

