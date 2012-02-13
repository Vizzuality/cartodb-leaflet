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
   * 		map_key				-			If your table is private, you'll need the map_key parameter
   * 		tile_style		-			If you want to add other style to the layer
   *		infowindow		-			If you want to see infowindows when click in a geometry (opcional - default = false)
   *		auto_bound		-			Let cartodb auto-bound-zoom in the map (opcional - default = false)
   */
   
  L.CartoDBLayer = function (params) {
    
    this.params = params;

    if (this.params.auto_bound) 	autoBound(this.params);			// Bounds? CartoDB does it.
    
    if (this.params.infowindow) {
		  addWaxCartoDBTiles(this.params)
		} else {
		  addSimpleCartoDBTiles(this.params);											// Always add cartodb tiles, simple or with wax.
		}
	  
	  this.params.visible = true,
	  this.params.active = true;
	  
	  // Zoom to cartodb geometries
	  function autoBound(params) {
			// Zoom to your geometries
			var that = this;

			$.ajax({
	      url:'http://'+params.user_name+'.cartodb.com/api/v1/sql/?q='+escape('select ST_Extent(the_geom) from '+ params.table_name),
	      dataType: 'jsonp',
	      timeout: 2000,
	      callbackParameter: 'callback',
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
	      error: function(e,msg) {
	        params.debug && console.debug('Error setting table bounds: ' + msg);
	      }
	    });
	  }
	  
	  // Add cartodb tiles to the map
	  function addSimpleCartoDBTiles(params) {
		  // Add the cartodb tiles
		  var cartodb_url = 'http://' + params.user_name + '.cartodb.com/tiles/' + params.table_name + '/{z}/{x}/{y}.png?sql=' + encodeURIComponent(params.query) +
		  	'&map_key=' + (params.map_key || '') + '&style=' + ((params.tile_style)?encodeURIComponent(params.tile_style):'')
		  	, cartodb_layer = new L.TileLayer(cartodb_url,{attribution:'CartoDB'});

		  params.layer = cartodb_layer;
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
          click: function(feature, div, op3, evt) {
	          var container_point = params.map.containerPointToLayerPoint(new L.Point(evt.clientX,evt.clientY));
	          var latlng = params.map.layerPointToLatLng(container_point);
	          params.popup.setLatLng(latlng);
						params.popup.setContent(feature);
						params.map.openPopup(params.popup);
          }
        },
        clickAction: 'location'
      };

			params.layer = new wax.leaf.connector(params.tilejson);
      params.map.addLayer(params.layer);
     	params.interaction = wax.leaf.interaction(params.map, params.tilejson, params.waxOptions);
     	params.popup = new L.CartoDBInfowindow(params);
	  }


    // Generate tile json for wax
    function generateTileJson() {
      var core_url = 'http://' + params.user_name + '.cartodb.com';  
      var base_url = core_url + '/tiles/' + params.table_name + '/{z}/{x}/{y}';
      var tile_url = base_url + '.png';
      var grid_url = base_url + '.grid.json';
      
      // SQL?
      if (params.query) {
        var query = 'sql=' + encodeURIComponent(params.query);
        tile_url = wax.util.addUrlData(tile_url, query);
        grid_url = wax.util.addUrlData(grid_url, query);
      }

      // MAP KEY?
      if (params.map_key) {
        var map_key = 'map_key=' + params.map_key;
        tile_url = wax.util.addUrlData(tile_url, map_key);
        grid_url = wax.util.addUrlData(grid_url, map_key);
      }

      // STYLE?
      if (params.tile_style) {
        var style = 'style=' + encodeURIComponent(params.tile_style);
        tile_url = wax.util.addUrlData(tile_url, style);
        grid_url = wax.util.addUrlData(grid_url, style);
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
   
   	// Function to transform GeoJSON to Leaflet coordinates 
    function transformGeoJSON(str) {
	    var json = JSON.parse(str);
	    return new L.LatLng(json.coordinates[1],json.coordinates[0]);
	  }
	  

	  // Update tiles & interactivity layer;
    L.CartoDBLayer.prototype.update = function(sql) {
    	this.params.query = sql;

      // Hide the infowindow
      if (this.params.popup) 
        this.params.popup._close();
      
      // Destroy layer
      this.destroy();

      // Add new one updated
      if (this.params.popup)
			  addWaxCartoDBTiles(this.params)
			else
			  addSimpleCartoDBTiles(this.params);
			
      this.params.active = true;
      this.params.visible = true;
    };

    // Destroy layers from the map
    L.CartoDBLayer.prototype.destroy = function() {
     	// First remove previous cartodb - tiles.
     	if (this.params.layer) {
     		this.params.map.removeLayer(this.params.layer);
     		delete this.params['layer'];
     	}

    	if (this.params.popup) {
        // Remove wax interaction
        this.params.interaction.remove();
        this.params.popup._close();
        delete this.params['interaction'];
        delete this.params['waxOptions'];
        delete this.params['tilejson'];
        delete this.params['popup'];
    	}

    	this.params.active = false;
    };

		
		// Hide layers from the map
    L.CartoDBLayer.prototype.hide = function() {
    	if (this.params.visible)
    		this.destroy();
    	this.params.visible = false;
    };
		    

    // Show layers from the map
    L.CartoDBLayer.prototype.show = function() {
      if (!this.params.visible || !this.params.active) {
        this.update(this.params.query);
      }
    };

    // CartoDB layer visible?
    L.CartoDBLayer.prototype.isVisible = function() {
    	return this.params.visible;
    };
  };
}


////////////////////////
// CartoDB Infowindow //
////////////////////////

L.CartoDBInfowindow = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minWidth: 50,
		maxWidth: 300,
		autoPan: true,
		closeButton: true,
		offset: new L.Point(58, 2),
		autoPanPadding: new L.Point(5, 5)
	},

	initialize: function(options) {
		L.Util.setOptions(this, options);
	},

	onAdd: function(map) {
		this._map = map;
		if (!this._container) {
			this._initLayout();
		}
		this._updateContent();

		this._container.style.opacity = '0';

		this._map._panes.popupPane.appendChild(this._container);
		this._map.on('viewreset', this._updatePosition, this);
		if (this._map.options.closePopupOnClick) {
			this._map.on('preclick', this._close, this);
		}
		this._update();
	},

	onRemove: function(map) {
		map._panes.popupPane.removeChild(this._container);
		map.off('viewreset', this._updatePosition, this);
		map.off('click', this._close, this);
	},

	setLatLng: function(latlng) {
		this._latlng = latlng;
		if (this._opened) {
			this._update();
		}
		return this;
	},

	setContent: function(feature) {
		this._feature = feature;
		if (this._opened) {
			this._update();
		}
		return this;
	},

	_open: function() {
		var div = this._container;
		div.style.opacity = 0;
		div.style.visibility = "visible";
		$(div).animate({
      bottom: '+=' + 10 + 'px',
      opacity: 1},
      200
		);
		this._opened = true;
	},


	_close: function() {
		if (this._opened) {
			var div = this._container
				, that = this;
		
			$(div).animate({
	      bottom: '-=' + 10 + 'px',
	      opacity: 0},
	      100,
	      function() {
	      	div.style.visibility = "hidden";
	      	that._map.removeLayer(that);
	      }
			);

			this._opened = false;
		}
	},
	
	_initLayout:function(){
		this._container=L.DomUtil.create("div","leaflet-popup");
		this._closeButton=L.DomUtil.create("a","leaflet-popup-close-button",this._container);
		this._closeButton.href="#close";
		this._closeButton.innerHTML="x";
		this._closeButton.onclick=L.Util.bind(this._onCloseButtonClick,this);
		L.DomEvent.disableClickPropagation(this._closeButton);
		this._wrapper=L.DomUtil.create("div","leaflet-popup-content-wrapper",this._container);
		L.DomEvent.disableClickPropagation(this._wrapper);
		this._contentNode=L.DomUtil.create("div","leaflet-popup-content",this._wrapper);
		this._tipContainer=L.DomUtil.create("div","leaflet-popup-tip-container",this._container);
	},

	_update: function() {
		var that = this
			, infowindow_sql = 'SELECT * FROM ' + this.options.table_name + ' WHERE cartodb_id=' + this._feature;
		
		this._container.style.visibility = 'hidden';

		// If the table is private, you can't run any api methods
    if (this.options.infowindow!=true) {
      infowindow_sql = encodeURIComponent(this.options.infowindow.replace('{{feature}}',this._feature));
    }
      

    $.ajax({
	    url:'http://'+ this.options.user_name +'.cartodb.com/api/v1/sql/?q='+infowindow_sql,
    	dataType: 'jsonp',
	    timeout: 2000,
	    callbackParameter: 'callback',
	    success: function(result) {
    		that._updateContent(result.rows[0]);
				that._updateLayout();
				that._updatePosition();
				that._container.style.visibility = '';
				that._adjustPan();
				that._open();
			},
    	error: function(e, msg) {
      	that.params_.debug && console.debug('Error retrieving infowindow variables: ' + msg)
      }
    });
	},

	_updateContent: function(variables) {
		if (!this._feature) return;
    
    var that = this;
    
	  // Remove the list items
	  this._contentNode.innerHTML = '';

		// Add new ones
		var content = '';
		 for (p in variables) {
		   if (p!='cartodb_id' && p!='the_geom_webmercator') {
		    content += '<label>'+p+'</label><p class="'+((variables[p]!=null && variables[p]!='')?'':'empty')+'">'+(variables[p] || 'empty')+'</p>';
		   }
		 }
	  this._contentNode.innerHTML = content;
	  
	  // Show cartodb-id
	  this._tipContainer.innerHTML = '<label>id: <strong>'+this._feature+'</strong></label>';
	},

	_updateLayout: function() {
		this._container.style.width = '';
		this._container.style.whiteSpace = 'nowrap';

		var width = this._container.offsetWidth;

		this._container.style.width = (width > this.options.maxWidth ? this.options.maxWidth : (width < this.options.minWidth ? this.options.minWidth : width ) ) + 'px';
		this._container.style.whiteSpace = '';

		this._containerWidth = this._container.offsetWidth;
	},

	_updatePosition: function() {
		var pos = this._map.latLngToLayerPoint(this._latlng);

		this._containerBottom = -pos.y - this.options.offset.y;
		this._containerLeft = pos.x - Math.round(this._containerWidth/2) + this.options.offset.x;

		this._container.style.bottom = this._containerBottom + 'px';
		this._container.style.left = this._containerLeft + 'px';
	},

	_adjustPan: function() {
		if (!this.options.autoPan) { return; }

		var containerHeight = this._container.offsetHeight,
			layerPos = new L.Point(
				this._containerLeft,
				-containerHeight - this._containerBottom),
			containerPos = this._map.layerPointToContainerPoint(layerPos),
			adjustOffset = new L.Point(0, 0),
			padding = this.options.autoPanPadding,
			size = this._map.getSize();

		if (containerPos.x < 0) {
			adjustOffset.x = containerPos.x - padding.x;
		}
		if (containerPos.x + this._containerWidth > size.x) {
			adjustOffset.x = containerPos.x + this._containerWidth - size.x + padding.x;
		}
		if (containerPos.y < 0) {
			adjustOffset.y = containerPos.y - padding.y;
		}
		if (containerPos.y + containerHeight > size.y) {
			adjustOffset.y = containerPos.y + containerHeight - size.y + padding.y;
		}

		if (adjustOffset.x || adjustOffset.y) {
			this._map.panBy(adjustOffset);
		}
	},

	_onCloseButtonClick: function(e) {
		this._close();
		L.DomEvent.stop(e);
	}
});