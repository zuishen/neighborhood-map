var Location = function(data) {
	this.index = ko.observable(data.index)
	this.title = ko.observable(data.name);
};


var ViewModel = function() {
	var self = this;
	self.locationList = ko.observableArray([]);
	self.markers = [];


	self.addMarker = function(i, marker, name) {
		self.markers.push(marker);
		self.locationList.push(new Location({index: i, name: name}));
	};

	self.showInfoWindow = function(item) {
		//console.log(item);
		var marker = self.markers[item.index()];
		if (infowindow.marker != marker) {
			infowindow.setContent("<div>"+item.title()+"</div>");
			infowindow.open(map, marker);
			infowindow.addListener('closeclick', function() {
				infowindow.setPosition(null);
			});
		}
	};

	self.getLocation = function(i) {
		return self.locationList()[i];
	}

};

var myViewModel = new ViewModel();
ko.applyBindings(myViewModel);

