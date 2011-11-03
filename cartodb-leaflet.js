/**
 * @name cartodb-leaflet for Leaflet
 * @version 0.1 [November 3, 2011]
 * @author: xavijam@gmail.com
 * @fileoverview <b>Author:</b> xavijam@gmail.com<br/> <b>Licence:</b>
 *               Licensed under <a
 *               href="http://opensource.org/licenses/mit-license.php">MIT</a>
 *               license.<br/> This library lets you use CartoDB with Leaflet.
 *                 
 */
 
 
 
if (typeof(L.CartoDBLayer) === "undefined") {
  /**
   * @params {}
   *    map_canvas    -     Leaflet canvas id (necesary for showing the infowindow)
   *		map						-			Your Leaflet map
   *   	user_name 		-		 	CartoDB user name
   *   	table_name 		-			CartoDB table name
   *    query					-			If you want to apply any sql sentence to the table...
   *		infowindow		-			If you want to see infowindows when click in a geometry (opcional - default = false)
   *		auto_bound		-			Let cartodb auto-bound-zoom in the map (opcional - default = false)
   */
   
  L.CartoDBLayer = function (params) {
    
    var defaults = params;
    
    if (params.infowindow) {
		  addWaxCartoDBTiles(params)
		} else {
		  addSimpleCartoDBTiles(params);											// Always add cartodb tiles, simple or with wax.
		}
		if (params.auto_bound) 	autoBound(params);						// Bounds? CartoDB does it.
	  
	  
	  // Zoom to cartodb geometries
	  function autoBound(params) {
			// Zoom to your geometries
		  $.ajax({
			  method:'get',
		    url: 'http://'+params.user_name+'.cartodb.com/api/v1/sql/?q='+escape('select ST_Extent(the_geom) from '+ params.table_name)+'&callback=?',
		    dataType: 'jsonp',
		    success: function(result) {
		      if (result.rows[0].st_extent!=null) {
		        var coordinates = result.rows[0].st_extent.replace('BOX(','').replace(')','').split(',');
		  
		        var coor1 = coordinates[0].split(' ');
		        var coor2 = coordinates[1].split(' ');
		  			
		        // Check bounds
		        if (coor1[0] >  180 || coor1[0] < -180 || coor1[1] >  90 || coor1[1] < -90 
			        || coor2[0] >  180 || coor2[0] < -180 || coor2[1] >  90  || coor2[1] < -90) {
		          coor1[0] = '-30';
		          coor1[1] = '-50'; 
		          coor2[0] = '110'; 
		          coor2[1] =  '80'; 
		        }

		  			var pos1 = new L.LatLng(parseFloat(coor1[1]),parseFloat(coor1[0]));
		  			var pos2 = new L.LatLng(parseFloat(coor2[1]),parseFloat(coor2[0]));
		  			var bounds = new L.LatLngBounds(pos1,pos2);
		        params.map.fitBounds(bounds);
		      }
		  
		    },
		    error: function(e) {}
		  });	    
	  }
	  

	  
	  // Add cartodb tiles to the map
	  function addSimpleCartoDBTiles(params) {
		  // Add the cartodb tiles
		  var cartodb_url = 'http://' + params.user_name + '.cartodb.com/tiles/' + params.table_name + '/{z}/{x}/{y}.png?sql='+params.query,
    			cartodb_layer = new L.TileLayer(cartodb_url);
			params.map.addLayer(cartodb_layer);
	  }
	  
	  
	  // Add cartodb tiles to the map
	  function addWaxCartoDBTiles(params) {
      // interaction placeholder
      params.tilejson = generateTileJson();

			params.waxOptions = {
        callbacks: {
          out: function(){
	          $('body').css({cursor:'default'});
          },
          over: function(feature, div, opt3, evt){
	          $('body').css({cursor:'pointer'});
          },
          click: function(feature){
	          $.ajax({
					 	  method:'get',
							url: 'http://'+ params.user_name +'.cartodb.com/api/v1/sql/?q='+escape('select *,ST_AsGeoJSON(ST_PointOnSurface(the_geom),6) as cdb_centre from '+ params.table_name + ' where cartodb_id=' + feature)+'&callback=?',
							dataType: 'jsonp',
							success: function(result) {
								var latlng = transformGeoJSON(result.rows[0].cdb_centre);
								params.popup.setLatLng(latlng);
								params.popup.setContent('<strong>cartodb_id:</strong>  '+feature);

								params.map.openPopup(params.popup);
							},
							error: function(e) {}
						});
          }
        },
        clickAction: 'location'
      };

			var wax_tile = new wax.leaf.connector(params.tilejson);
      params.map.addLayer(new wax.leaf.connector(params.tilejson));
     	params.interaction = wax.leaf.interaction(params.map, params.tilejson, params.waxOptions);
     	
     	params.popup = new L.Popup();

	  }
    
    
    function generateTileJson() {
      var core_url = 'http://' + params.user_name + '.cartodb.com';  
      var base_url = core_url + '/tiles/' + params.table_name + '/{z}/{x}/{y}';
      var tile_url = base_url + '.png?';
      var grid_url = base_url + '.grid.json';
      
      // SQL?
      if (params.query) {
        var query = 'sql=' + params.query;
        tile_url = wax.util.addUrlData(tile_url, query);
        grid_url = wax.util.addUrlData(grid_url, query);
      }
      
      // Build up the tileJSON
      // TODO: make a blankImage a real 'empty tile' image
      return {
        blankImage: 'blank_tile.png', 
        tilejson: '1.0.0',
        scheme: 'xyz',
        tiles: [tile_url],
        grids: [grid_url],
        tiles_base: tile_url,
        grids_base: grid_url,
        formatter: function(options, data) {
            return data.cartodb_id;
        }
      };
    }
    
    function transformGeoJSON(str) {
	    var json = JSON.parse(str);
	    return new L.LatLng(json.coordinates[1],json.coordinates[0]);
	  }
	  
  };

}