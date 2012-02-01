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

#### Required

* **map_canvas**:   The DOM element id where the map is
* **map**:          The Google map object create before
* **username**:     Your CartoDB user name
* **table_name**:   Your CartoDB table name
* **query**:        A query to experiment with

#### Optional:

* **map_key**:      If your table is private, you'll need the map_key parameter
* **infowindow**:   If you want to add interactivity to the layer, showing the infowindow (If you want to show specific columns, it must be a query, adding it 'WHERE cartodb_id={{feature}}', later it will be replace by the clicked cartodb_id. **cartodb_id** and **the_geom_webmercator** are REQUIRED parameters)
* **tile_style**:   If you want to add other style to the layer
* **autobound**:    If you want to zoom in the area where the layer is positioned
* **debug**:        If you want to debug the library, set to true

Note: If you choose a CartoDB private table you'll need to authenticate for using API methods.



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
        tile_style: "#test2{line-color:#719700;line-width:1;line-opacity:0.6;polygon-opacity:0.6;}",
        map_key: "6087bc5111352713a81a48491078f182a0541f6c",
    	infowindow: "SELECT cartodb_id,the_geom_webmercator,description FROM test2 WHERE cartodb_id={{feature}}",
    	auto_bound: true});


Functions
---------
New funcionalities are coming, in the meantime you can use:

* update: It needs a new query to work. Example: cartodb_leaflet.update('SELECT * FROM test WHERE cartodb_id>2');
* destroy: Removes the cartodb layer from the map. Example: cartodb_leaflet.destroy();
* hide: Hide the cartodb layer from the map (For now, hide and destroy are the same, but will be replace in the future).
* show: Show again the cartodb layer in the map. Example: cartodb_leaflet.show();
* isVisible: Returns if cartodb layer is visible or not. Example: cartodb_leaflet.isVisible(); -> true | false


[live example](http://vizzuality.github.com/cartodb-leaflet/)