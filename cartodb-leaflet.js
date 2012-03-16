/**
 * @name cartodb-leaflet for Leaflet
 * @version 0.32 [March 9, 2012]
 * @author: xavijam@gmail.com
 * @fileoverview <b>Author:</b> xavijam@gmail.com<br/> <b>Licence:</b>
 *               Licensed under <a
 *               href="http://opensource.org/licenses/mit-license.php">MIT</a>
 *               license.<br/> This library lets you to use CartoDB with Leaflet.
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
   * 		tile_style		-			If you want to add other style to the layer
   *		infowindow		-			If you want to see infowindows when click in a geometry (opcional - default = false)
   *		auto_bound		-			Let cartodb auto-bound-zoom in the map (opcional - default = false)
   */
   
  L.CartoDBLayer = function (params) {
    
    this.params = params;

    if (this.params.auto_bound) 	autoBound(this.params);			// Bounds? CartoDB does it.
    
    //if (this.params.infowindow) {
		  addWaxCartoDBTiles(this.params)
		//} else {
		  //addSimpleCartoDBTiles(this.params);											// Always add cartodb tiles, simple or with wax.
		//}
	  
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
	        if (params.debug) throw('Error getting table bounds: ' + msg);
	      }
	    });
	  }
	  
	  // Add cartodb tiles to the map
	  function addSimpleCartoDBTiles(params) {

	  	// Then add the cartodb tiles
      var tile_style = (params.tile_style)? encodeURIComponent(params.tile_style.replace(/\{\{table_name\}\}/g,params.table_name)) : ''
        , query = encodeURIComponent(params.query.replace(/\{\{table_name\}\}/g,params.table_name));

		  // Add the cartodb tiles
		  var cartodb_url = 'http://' + params.user_name + '.cartodb.com/tiles/' + params.table_name + '/{z}/{x}/{y}.png?sql=' + query +'&style=' + tile_style
		  	, cartodb_layer = new L.TileLayer(cartodb_url,{scheme: 'xyz',attribution:'CartoDB'});

		  params.layer = cartodb_layer;
			params.map.addLayer(cartodb_layer,false);
	  }
	  
	  // Add cartodb tiles to the map
	  function addWaxCartoDBTiles(params) {
      // interaction placeholder
      params.tilejson = generateTileJson(params);

			params.waxOptions = {
        callbacks: {
          out: function(){
	          $('body').css({cursor:'default'});
          },
          over: function(feature, div, opt3, evt){
	          $('body').css({cursor:'pointer'});
          },
          click: function(feature, div, op3, evt) {
	          var container_point = params.map.mouseEventToLayerPoint(evt)
	          	, latlng = params.map.layerPointToLatLng(container_point);

	          params.popup.setLatLng(latlng);
						params.popup.setContent(feature);
						params.map.openPopup(params.popup);
          }
        },
        clickAction: 'location'
      };

			params.layer = new wax.leaf.connector(params.tilejson);

      params.map.addLayer(params.layer,false);

      if (params.infowindow) {
     		params.interaction = wax.leaf.interaction(params.map, params.tilejson, params.waxOptions);
     		params.popup = new L.CartoDBInfowindow(params);
      }
	  }


    // Generate tile json for wax
    function generateTileJson(params) {
      var core_url = 'http://' + params.user_name + '.cartodb.com';  
      var base_url = core_url + '/tiles/' + params.table_name + '/{z}/{x}/{y}';
      var tile_url = base_url + '.png';
      var grid_url = base_url + '.grid.json';
      
      // SQL?
      if (params.query) {
        var query = 'sql=' + encodeURIComponent(params.query.replace(/\{\{table_name\}\}/g,params.table_name));
        tile_url = wax.util.addUrlData(tile_url, query);
        grid_url = wax.util.addUrlData(grid_url, query);
      }

      // STYLE?
      if (params.tile_style) {
        var style = 'style=' + encodeURIComponent(params.tile_style.replace(/\{\{table_name\}\}/g,params.table_name));
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
   


	  // Update tiles & interactivity layer;
    L.CartoDBLayer.prototype.update = function(changes) {
      // Hide the infowindow
      if (this.params.popup) 
        this.params.popup._close();

			// What do we support change? - tile_style | query | infowindow
			if (typeof changes == 'object') {
				for (var param in changes) {

	      	if (param != "tile_style" && param != "query" && param != "infowindow") {
		      	if (this.params.debug) {
		      		throw("Sorry, you can't update " + param);
		      	} else {
		      		return;
		      	}
		      } else {
		      	this.params[param] = changes[param];
		      }					
				}

			} else {
				if (this.params.debug) {
      		throw("This method only accepts a javascript object");
      	} else {
      		return;
      	}
			}

      // Destroy layer
      this.destroy();

      // Add new one updated
      if (this.params.infowindow)
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
      infowindow_sql = this.options.infowindow.replace('{{feature}}',this._feature);
    }

    // Replace {{table_name}} for table name
    infowindow_sql = encodeURIComponent(infowindow_sql.replace(/\{\{table_name\}\}/g,this.options.table_name));

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
    		if (that.options.debug) throw('Error retrieving infowindow variables: ' + msg);
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





















/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */

L.TileLayer = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		subdomains: 'abc',
		errorTileUrl: '',
		attribution: '',
		opacity: 1,
		scheme: 'xyz',
		continuousWorld: false,
		noWrap: false,
		zoomOffset: 0,
		zoomReverse: false,

		unloadInvisibleTiles: L.Browser.mobile,
		updateWhenIdle: L.Browser.mobile,
		reuseTiles: false
	},

	initialize: function (url, options) {
		L.Util.setOptions(this, options);

		this._url = url;

		var subdomains = this.options.subdomains;

		if (typeof subdomains === 'string') {
			this.options.subdomains = subdomains.split('');
		}
	},

	onAdd: function (map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();

		// create an image to clone for tiles
		this._createTileProto();

		// set up events
		map.on('viewreset', this._resetCallback, this);
		map.on('moveend', this._update, this);

		if (!this.options.updateWhenIdle) {
			this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
			map.on('move', this._limitedUpdate, this);
		}

		this._reset();
		this._update();
	},

	onRemove: function (map) {
		map._panes.tilePane.removeChild(this._container);

		map.off('viewreset', this._resetCallback, this);
		map.off('moveend', this._update, this);

		if (!this.options.updateWhenIdle) {
			map.off('move', this._limitedUpdate, this);
		}

		this._container = null;
		this._map = null;
	},

	getAttribution: function () {
		return this.options.attribution;
	},

	setOpacity: function (opacity) {
		this.options.opacity = opacity;

		if (this._map) {
			this._updateOpacity();
		}

		// stupid webkit hack to force redrawing of tiles
		var i,
			tiles = this._tiles;

		if (L.Browser.webkit) {
			for (i in tiles) {
				if (tiles.hasOwnProperty(i)) {
					tiles[i].style.webkitTransform += ' translate(0,0)';
				}
			}
		}
	},

	_updateOpacity: function () {
		L.DomUtil.setOpacity(this._container, this.options.opacity);
	},

	_initContainer: function () {
		var tilePane = this._map._panes.tilePane,
			first = tilePane.firstChild;

		if (!this._container || tilePane.empty) {
			this._container = L.DomUtil.create('div', 'leaflet-layer');

			if (this._insertAtTheBottom && first) {
				tilePane.insertBefore(this._container, first);
			} else {
				tilePane.appendChild(this._container);
			}

			if (this.options.opacity < 1) {
				this._updateOpacity();
			}
		}
	},

	_resetCallback: function (e) {
		this._reset(e.hard);
	},

	_reset: function (clearOldContainer) {

		var key,
			tiles = this._tiles;

		for (key in tiles) {
			if (tiles.hasOwnProperty(key)) {
				this.fire('tileunload', {tile: tiles[key]});
			}
		}

		this._tiles = {};

		if (this.options.reuseTiles) {
			this._unusedTiles = [];
		}

		if (clearOldContainer && this._container) {
			this._container.innerHTML = "";
		}

		this._initContainer();
	},

	_update: function (e) {

		if (this._map._panTransition && this._map._panTransition._inProgress) { return; }

		var bounds   = this._map.getPixelBounds(),
		    zoom     = this._map.getZoom(),
		    tileSize = this.options.tileSize;

		if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
			return;
		}

		var nwTilePoint = new L.Point(
				Math.floor(bounds.min.x / tileSize),
				Math.floor(bounds.min.y / tileSize)),
			seTilePoint = new L.Point(
				Math.floor(bounds.max.x / tileSize),
				Math.floor(bounds.max.y / tileSize)),
			tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

		this._addTilesFromCenterOut(tileBounds);

		if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
			this._removeOtherTiles(tileBounds);
		}
	},

	_addTilesFromCenterOut: function (bounds) {
		var queue = [],
			center = bounds.getCenter();


		var j, i;
		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				if (!((i + ':' + j) in this._tiles)) {
					queue.push(new L.Point(i, j));
				}
			}
		}

		if (queue.length == 0) {return;}

		// load tiles in order of their distance to center
		queue.sort(function (a, b) {
			return a.distanceTo(center) - b.distanceTo(center);
		});

		var fragment = document.createDocumentFragment();

		
		this._loaded = false;
		//this.fire('loading');

		this._tilesToLoad = queue.length;

		var k, len;
		for (k = 0, len = this._tilesToLoad; k < len; k++) {
			this._addTile(queue[k], fragment);
		}

		this._container.appendChild(fragment);
	},

	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key, tile;

		for (key in this._tiles) {
			if (this._tiles.hasOwnProperty(key)) {
				kArr = key.split(':');
				x = parseInt(kArr[0], 10);
				y = parseInt(kArr[1], 10);

				// remove tile if it's out of bounds
				if (x < bounds.min.x || x > bounds.max.x || y < bounds.min.y || y > bounds.max.y) {
					this._removeTile(key);
				}
			}
		}
	},

	_removeTile: function (key) {
		var tile = this._tiles[key];

		this.fire("tileunload", {tile: tile, url: tile.src});

		if (tile.parentNode === this._container) {
			this._container.removeChild(tile);
		}
		if (this.options.reuseTiles) {
			this._unusedTiles.push(tile);
		}

		tile.src = L.Util.emptyImageUrl;

		delete this._tiles[key];
	},

	_addTile: function (tilePoint, container) {
		var tilePos = this._getTilePos(tilePoint),
			zoom = this._map.getZoom(),
		    key = tilePoint.x + ':' + tilePoint.y,
		    limit = Math.pow(2, this._getOffsetZoom(zoom));

		// wrap tile coordinates
		if (!this.options.continuousWorld) {
			if (!this.options.noWrap) {
				tilePoint.x = ((tilePoint.x % limit) + limit) % limit;
			} else if (tilePoint.x < 0 || tilePoint.x >= limit) {
				this._tilesToLoad--;
				return;
			}

			if (tilePoint.y < 0 || tilePoint.y >= limit) {
				this._tilesToLoad--;
				return;
			}
		}

		// get unused tile - or create a new tile
		var tile = this._getTile();
		L.DomUtil.setPosition(tile, tilePos);

		this._tiles[key] = tile;

		if (this.options.scheme === 'tms') {
			tilePoint.y = limit - tilePoint.y - 1;
		}

		this._loadTile(tile, tilePoint, zoom);

		container.appendChild(tile);
	},

	_getOffsetZoom: function (zoom) {
		var options = this.options;
		zoom = options.zoomReverse ? options.maxZoom - zoom : zoom;
		return zoom + options.zoomOffset;
	},

	_getTilePos: function (tilePoint) {
		var origin = this._map.getPixelOrigin(),
			tileSize = this.options.tileSize;

		return tilePoint.multiplyBy(tileSize).subtract(origin);
	},

	// image-specific code (override to implement e.g. Canvas or SVG tile layer)

	getTileUrl: function (tilePoint, zoom) {
		var subdomains = this.options.subdomains,
			index = (tilePoint.x + tilePoint.y) % subdomains.length,
			s = this.options.subdomains[index];

		return L.Util.template(this._url, L.Util.extend({
			s: s,
			z: this._getOffsetZoom(zoom),
			x: tilePoint.x,
			y: tilePoint.y
		}, this.options));
	},

	_createTileProto: function () {
		var img = this._tileImg = L.DomUtil.create('img', 'leaflet-tile');
		img.galleryimg = 'no';

		var tileSize = this.options.tileSize;
		img.style.width = tileSize + 'px';
		img.style.height = tileSize + 'px';
	},

	_getTile: function () {
		if (this.options.reuseTiles && this._unusedTiles.length > 0) {
			var tile = this._unusedTiles.pop();
			this._resetTile(tile);
			return tile;
		}
		return this._createTile();
	},

	_resetTile: function (tile) {},

	_createTile: function () {
		var tile = this._tileImg.cloneNode(false);
		tile.onselectstart = tile.onmousemove = L.Util.falseFn;
		return tile;
	},

	_loadTile: function (tile, tilePoint, zoom) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		tile.src     = this.getTileUrl(tilePoint, zoom);
	},

	_tileOnLoad: function (e) {
		var layer = this._layer;

		this.className += ' leaflet-tile-loaded';

		layer.fire('tileload', {
			tile: this,
			url: this.src
		});


		layer._tilesToLoad--;
		if (!layer._tilesToLoad) {
			layer._loaded = true;
			layer.fire('load');
		} else {
			layer._loaded = false;
			layer.fire('loading');
		}
	},

	_tileOnError: function (e) {
		var layer = this._layer;

		layer.fire('tileerror', {
			tile: this,
			url: this.src
		});

		var newUrl = layer.options.errorTileUrl;
		if (newUrl) {
			this.src = newUrl;
		}
	}
});

