
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Oluttilanne' });
};

exports.getBeers = function(db, ba) {
	return function(req, res) {
		var beers = db.get('beers');

		beers.find({}, { sort: { createdAt: -1 }, limit: 2 }, function(err, doc) {
			if(doc)
				doc.forEach(function(v) {
                    if (v.beers) {
    					v.beers.forEach(function(o) {

    						if(!o.totalAvailable) {
    							var total = 0;
    							o.availability.forEach(function(i) {
    								if(parseInt(i.Amount, 10) > 0) {
    									total += parseInt(i.Amount, 10);
    								}
    							});
    							o.totalAvailable = total;

    						}
    					});
                    }
				});

 				res.send({'beers' : doc });
		});
	}
}

exports.downloadData = function(db, fs, http, moment, ba, override) {

	console.log("starting download");

	var beerdb = db.get('beers');
	beerdb.findOne({}, function(err, doc) {
		//console.log(doc);
		if(doc && override === false) {
			console.log("abort mission");
			return;
		}
		else {
			var date = moment().toJSON();
			saveBeerList(date);
		}
	});

	function download(url, cb) {
		var request = http.get(url, function(response) {
			response.setEncoding('utf8');
			var b = '';

			response.on("data", function(chunk) {
				b += chunk;
			});

			response.on("end", function() {
				var res = JSON.parse(b);
				cb(res);
			});
		});
	}

	function saveBeerList(date) {
		var beerlist = { 'createdAt': date, 'beers' : [] };

		download("http://www.alko.fi/api/find/products?Language=fi&Page=0&PageSize=500&ProductIds=&Query=&SingleGrape=false&Sort=0&Tags=%282872%29", function(d) {

			var beers = d.Results;
			//for(var v = 0; v < beers.length; v++) {
			//beers.forEach(function(v, index, array) {


			var count = beers.length - 1;
			var index = 0;
			//var total = 0;
			//console.log(beer);

			if(index == 0) iterate();

			function iterate() {
				var total = 0;
				var beer = beers[index];
				var url = "http://www.alko.fi/api/product/Availability?productId=" + beer.ProductId + "&cityId=jyväskylä&language=fi";
				download(url, function(data) {
					data.forEach(function(i) {
						if(parseInt(i.Amount, 10) >= 0) {
							total += parseInt(i.Amount, 10);
						}
					});

					beer.availability = data;
					beer.createdAt = date;
					beer.totalAvailable = total;
					beer.ba = {};

					ba.beerSearch(beer.Name, function(b) {
						if(b.length > 0) {
							ba.beerPage(b[0].beer_url, function(b_page) {
								/*beer.genre = b_page[0].beer_style;
								beer.brewery = b_page[0].brewery_name;
								beer.ba_score = b_page[0].ba_score;*/



								beer.ba = b_page;


								console.log(b_page);
								console.log(beer.ba);
								console.log("index " + index);

								//console.log(beer.ba_score);


								beerlist.beers.push(beer);
								index++;

								if(index < count) {
									return setTimeout(iterate, 50);
								}
								else if(index === count) {
									beerdb.insert(beerlist, function(err, doc) {
										if(!err) {
											console.log("finished beerlist update");
										}
									});
								}
							});
						}

						else {
							beerlist.beers.push(beer);
							index++;

							console.log("beer not found, skipping");

							if(index < count) {
								return setTimeout(iterate, 50);
							}
							else if(index === count) {
								beerdb.insert(beerlist, function(err, doc) {
									if(!err) {
										console.log("finished beerlist update");
									}
								});
							}
						}
					});

				});
			}
		});
	}
}
