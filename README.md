CartoDB library for LeafletJS
============================
Use your own CartoDB tables in a leaflet map.


Adding the library
------------------
Use the library is really easy, and you will only need:

* Your CartoDB user name
* Choose a table to play with
* Do a query
* And make your table public


Params
------
The library accepts certain params to manage the cartodb layer:

* map_canvas (required): 	The DOM element id where the map is
* map (required): 				The leaflet map object create before
* username (required): 		Your CartoDB user name
* table_name (required): 	Your CartoDB table name
* query (required): 			A query to experiment with
* infowindow:							If you want to add interactivity to the layer, showing the infowindow
* autobound:							If you want to zoom in the area where the layer is positioned


Example
-------
First of all create your map:

	var map = new L.Map('map_canvas');
	var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
	    cloudmadeAttrib = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
	    cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttrib});
			map.addLayer(cloudmade);
  
And then add the cartodb layer:

	var cartodb_leaflet = new L.CartoDBLayer({
    	map_canvas: 'map_canvas',
    	map: map,
    	user_name:'xavijam',
    	table_name: 'test2',
    	query: "SELECT * FROM test2",
    	infowindow: true,
    	auto_bound: true});


[live example](http://vizzuality.github.com/cartodb-leaflet/)