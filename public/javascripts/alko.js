function viewModel () {
	var self = this;

	self.beers = ko.observableArray([]);
	self.newBeers = ko.observableArray([]);
	self.beerlists = ko.observableArray();
	self.selectedList = ko.observable();
	self.rendered = ko.observable(false);
	self.activePage = ko.observable("main");
	self.showNewOnly = ko.observable(false);
	self.showBlackListed = ko.observable(false);

	self.filteredBeers = ko.observableArray();

	self.search = ko.observable("");

	var previous = { 'createdAt' : '', 'shownew' : '' };

	self.mapSelected = ko.computed(function() {
		if(self.beerlists().length > 0 && self.selectedList() !== undefined) {
			if(self.selectedList().createdAt() == previous.createdAt && self.showBlackListed() == previous.blacklisted) {
				return;
			}
			else {
				self.beers([]);
				self.rendered(false);

				previous.createdAt = self.selectedList().createdAt();
				previous.blacklisted = self.showBlackListed();

				self.changePage(0);

				ko.mapping.fromJS(self.selectedList().beers().filter(function(i) {
					if(i.IsNew() == true) return i;
				}), {}, self.newBeers);

				ko.mapping.fromJS(self.selectedList().beers().filter(function(i) {
					if(self.showBlackListed() == true) return i;
					if(i.Name().indexOf('Karjala') == -1 && i.Name().indexOf('Olvi') == -1 && i.Name().indexOf('Lapin Kulta') == -1 && i.Name().indexOf('Karhu') == -1 && i.Name().indexOf('Koff') == -1) {
						return i;
					}
				}), {}, self.beers);

			}
		}
	}).extend({ throttle: 1 });

	self.searchBeer = ko.computed(function() {
		if(self.beers().length > 0) {
			var search = self.search().trim().split(" ");
			console.log("searching");

			var filt = self.beers().filter(function(item) {
				for (var i = 0; i < search.length; i++) {
					var brewery = "";
					if (typeof item.ba == 'function' ) {
						brewery = item.ba()[0].brewery_name();
					}
					//console.log(brewery);
					var itemdata = item.Name().toLowerCase() + " " + brewery.toLowerCase();
					if (_.contains(itemdata, search[i].toLowerCase()))
						return item;
				}
			});

			self.changePage(0);

			ko.mapping.fromJS(filt, {}, self.filteredBeers);
		}

	}).extend({
		rateLimit: {
			method: "notifyWhenChangesStop", timeout: 500
		}
	});


	self.pages = ko.observableArray();

    self.calculatePages = ko.computed(function() {
    	var pages;
    	if(self.activePage() == 'main') pages = self.filteredBeers().length / 100;
    	if(self.activePage() == 'new') pages = self.newBeers().length / 100;
        //console.log("number of pages: " + pages);

        var temp = [];
        temp.length = Math.ceil(pages);
        ko.mapping.fromJS(temp, {}, self.pages);
    }).extend({ throttle : 1 });

    self.rangeBottom = ko.observable();
    self.rangeTop = ko.observable();
    self.activePaginationPage = ko.observable();


    self.changePage = function(page) {
        var step = 100;
        switch (page) {
            case 0:
                self.rangeBottom(0);
                self.rangeTop(step);
                self.activePaginationPage(0);
                break;
            case 1:
                self.rangeBottom(step);
                self.rangeTop(step * 2);
                self.activePaginationPage(1);
                break;
            case 2:
                self.rangeBottom(step * 2);
                self.rangeTop(step * 3);
                self.activePaginationPage(2);
                break;
            case 3:
                self.rangeBottom(step * 3);
                self.rangeTop(step * 4);
                self.activePaginationPage(3);
                break;
            case 4:
                self.rangeBottom(step * 4);
                self.rangeTop(step * 5);
                self.activePaginationPage(4);
                break;
            case 5:
                self.rangeBottom(step * 5);
                self.rangeTop(step * 6);
                self.activePaginationPage(5);
                break;
            case 6:
                self.rangeBottom(step * 6);
                self.rangeTop(step * 7);
                self.activePaginationPage(6);
                break;
            case 7:
                self.rangeBottom(step * 7);
                self.rangeTop(step * 8);
                self.activePaginationPage(7);
                break;
            case 8:
                self.rangeBottom(step * 8);
                self.rangeTop(step * 9);
                self.activePaginationPage(8);
                break;
            case 9:
                self.rangeBottom(step * 9);
                self.rangeTop(step * 10);
                self.activePaginationPage(9);
                break;

            default:
                self.rangeBottom(0);
                self.rangeTop(step);
                self.activePaginationPage(0);
                break;
        }
    }

    self.doneRendering = function(element, data) {
    	self.rendered(false);
    	if(self.filteredBeers().length > 0) {
	        if (self.filteredBeers()[self.filteredBeers().length - 1] === data) {
	        	//console.log("matches");
	        	setTimeout(function() {
	            	self.rendered(true);
	        	}, 0);


	        } else {
	        	//console.log("does not match");
	            //self.rendered(false);
	        }
	    }
	}

/*
	self.drawChart = function(beer) {
		var beer_id = beer.ProductId();

		var av_dates = [];
		var av_beers = [];
		var table = [];


		self.beerlists().forEach(function(v) {
			v.beers().forEach(function(i) {
				//console.log(i);
				if(i.ProductId() === beer_id) {
					var item = {};
					item.d = moment(i.createdAt()).format('D.M.');
					item.b = i.totalAvailable();
					table.unshift([item.d, item.b]);
					return;
				}
			});
		});


		table.unshift(['Päiväys', 'Määrä']);

		var data = new google.visualization.arrayToDataTable(table);

		var options = {
			lineWidth: 2,
			pointSize: 5,
			width: '100%',
			height: 240,
			legend: 'none',
			vAxis: {

				minValue: 0,
				gridlines: {
					color: '#ccc',
				},
			},
			animation: {
				duration: 1000,
				easing: 'in'
			},
			hAxis: {
				minValue: 0,
				gridlines: {
					color: '#ccc',
				},
				minorGridlines: {
					color: '#ccc',
				},
				viewWindow: {
					min: 0
				}
			},
			curveType: 'function',
			backgroundColor: 'transparent'
		};

		var chart = new google.visualization.LineChart(document.getElementById('_chart_' + beer_id));

		chart.draw(data, options);

	}

	self.chartCb = function() {

	}

*/
	$.get(
		'/getBeers',
		function(data) {
			console.log(data.beers);
			data.beers.forEach(function(v) {
				if (v.beers) {
					v.beers.sort(function(a, b) {
						if(a.Name > b.Name) return 1;
						if(a.Name < b.Name) return -1;
						else return 0;
					});

					v.beers.forEach(function(l) {
						l.availability.forEach(function(n) {
							n.StoreName = n.StoreName.replace("Jyväskylä", "");
							//console.log(n.StoreName);
						});
					});
				}

			});
			ko.mapping.fromJS(data.beers, {}, self.beerlists);
			//console.log(self.beerlists()[0].beers()[0].ba());
			ko.mapping.fromJS(data.beers[0], {}, self.selectedList);
		}
	);
}

$(document).ready(function() {
	window.vm = new viewModel();
	ko.applyBindings(vm, document.getElementById("main"));
	//google.setOnLoadCallback(vm.chartCb);
});
