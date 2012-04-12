/**
 * @name cartodb-leaflet for Leaflet
 * @version 0.4 [April 12, 2012]
 * @author: jmedina@vizzuality.com
 * @fileoverview <b>Author:</b> jmedina@vizzuality.com<br/> <b>Licence:</b>
 *               Licensed under <a
 *               href="http://opensource.org/licenses/mit-license.php">MIT</a>
 *               license.<br/> This library lets you to use CartoDB with Leaflet.
 *                 
 */
 
 
if (typeof(L.CartoDBLayer) === "undefined") {

  L.CartoDBLayer = L.Class.extend({
    
    includes: L.Mixin.Events,

    options: {
      query:      "SELECT * FROM {{table_name}}",
      opacity:    0.99,
      infowindow: false,
      auto_bound: false,
      debug:      false
    },

    /**
     * Initialize CartoDB Layer
     * @params {Object}
     *    map_canvas    -     Leaflet canvas id (necesary for showing the infowindow)
     *    map           -     Your Leaflet map
     *    user_name     -     CartoDB user name
     *    table_name    -     CartoDB table name
     *    query         -     If you want to apply any sql sentence to the table...
     *    opacity       -     If you want to change the opacity of the CartoDB layer
     *    tile_style    -     If you want to add other style to the layer
     *    infowindow    -     If you want to see infowindows when click in a geometry (opcional - default = false)
     *    auto_bound    -     Let cartodb auto-bound-zoom in the map (opcional - default = false)
     */
    initialize: function (options) {
      // Set options
      L.Util.setOptions(this, options);
      
      // Bounds? CartoDB does it
      if (options.auto_bound)
        this._setBounds();

      // Add cartodb logo, yes sir!
      this._addWadus(); 
    },

    /**
     * When Leaflet adds the layer... go!
     * @params {map}
     */
    onAdd: function(map) {
      if (!this.options.infowindow) {
        this._addSimple();
      } else {
        this._addInteraction();
      }
    },


    /**
     * When removes the layer, destroy interactivity and infowindow if they exist
     */
    onRemove: function(map) {
      this._remove();
    },


    /**
     * Change opacity of the layer
     * @params {Integer} New opacity
     */
    setOpacity: function(opacity) {
      this.layer.setOpacity(opacity);
    },


    /**
     * Change query of the tiles
     * @params {str} New sql for the tiles
     */
    setQuery: function(sql) {
      // Set the new value to the layer options
      this.options.query = sql;
      this._update();
    },


    /**
     * Change style of the tiles
     * @params {style} New carto for the tiles
     */
    setStyle: function(style) {
      // Set the new value to the layer options
      this.options.tile_style = style;
      this._update();
    },


    /**
     * Change infowindow of the features
     * @params {Boolean | String} New sql or activation for infowindow
     */
    setInfowindow: function(value) {

      // Set the new value to the layer options
      this.options.infowindow = value;

      if (!value) {
        this.setInteraction(false);
      } else {
        if (this.popup) {
          // If there is alreay a popup, just change the `infowindow` value
          this.popup.options.infowindow = value;
        } else {
          // If not, create a new one
          this._createPopup();
        }
      }
    },


    /**
     * Change layer index
     * @params {Integer} New position for the layer
     */
    setLayerOrder: function(position) {
      /*
        Waiting fot this ticket:
          https://github.com/CloudMade/Leaflet/issues/505
      */
    },


    /**
     * Active or desactive interaction
     * @params {Boolean} Choose if wants interaction or not
     */
    setInteraction: function(bool) {
      if (this.interaction) {
        if (bool) {
          this.interaction.on('on');
        } else {
          this.interaction.off('off');
        }
      }
    },


    /**
     * Change infowindow of the features
     * @params {Boolean | String} New sql or activation for infowindow
     */
    hide: function(value) {
      this.setOpacity(0);
      this.setInteraction(false);
    },


    /**
     * Change infowindow of the features
     * @params {Boolean | String} New sql or activation for infowindow
     */
    show: function(value) {
      this.setOpacity(this.options.opacity);
      this.setInteraction(true);
    },



    /*
     * PRIVATE METHODS
     */

    /**
     * Remove CartoDB layer
     */
    _remove: function() {
      // Remove interaction
      this.setInteraction(false);

      // Close and delete popup if exists
      if (this.popup) {
        this.popup._close();
        this.options.map.removeLayer(this.popup);  
      }

      // Remove layer
      this.options.map.removeLayer(this.layer);
    },


    /**
     * Update CartoDB layer
     */
    _update: function() {
      // First remove old layer
      this._remove();

      // Create the new updated one
      if (!this.options.infowindow) {
        this._addSimple();
      } else {
        this._addInteraction();
      }
    },


    /**
     * Zoom to cartodb geometries
     */
    _setBounds: function() {
      var self = this;
      reqwest({
        url:'http://'+this.options.user_name+'.cartodb.com/api/v1/sql/?q='+escape('select ST_Extent(the_geom) from '+ this.options.table_name),
        type: 'jsonp',
        jsonpCallback: 'callback',
        success: function(result) {
          if (result.rows[0].st_extent!=null) {
            var coordinates = result.rows[0].st_extent.replace('BOX(','').replace(')','').split(',');
            var coor1 = coordinates[0].split(' ');
            var coor2 = coordinates[1].split(' ');

            var lon0 = coor1[0];
            var lat0 = coor1[1];
            var lon1 = coor2[0];
            var lat1 = coor2[1];

            var minlat = -85.0511;
            var maxlat =  85.0511;
            var minlon = -179;
            var maxlon =  179;

            /* Clamp X to be between min and max (inclusive) */
            var clampNum = function(x, min, max) {
              return x < min ? min : x > max ? max : x;
            }

            lon0 = clampNum(lon0, minlon, maxlon);
            lon1 = clampNum(lon1, minlon, maxlon);
            lat0 = clampNum(lat0, minlat, maxlat);
            lat1 = clampNum(lat1, minlat, maxlat);

            var sw = new L.LatLng(lat0, lon0);
            var ne = new L.LatLng(lat1, lon1);
            var bounds = new L.LatLngBounds(sw,ne);
            self.options.map.fitBounds(bounds);
          }
        },
        error: function(e,msg) {
          if (this.options.debug) throw('Error getting table bounds: ' + msg);
        }
      });
    },


    /**
     * Add Cartodb logo
     */
    _addWadus: function() {
      if (!document.getElementById('cartodb_logo')) {
        var cartodb_link = document.createElement("a");
        cartodb_link.setAttribute('id','cartodb_logo');
        cartodb_link.setAttribute('style',"position:absolute; bottom:8px; left:8px; display:block;");
        cartodb_link.setAttribute('href','http://www.cartodb.com');
        cartodb_link.setAttribute('target','_blank');
        cartodb_link.innerHTML = "<img src='http://cartodb.s3.amazonaws.com/static/new_logo.png' alt='CartoDB' title='CartoDB' />";
        document.getElementById(this.options.map_canvas).appendChild(cartodb_link);  
      }
    },


    /**
     * Add simple cartodb tiles to the map
     */
    _addSimple: function () {

      // Then add the cartodb tiles
      var tile_style = (this.options.tile_style)? encodeURIComponent(this.options.tile_style.replace(/\{\{table_name\}\}/g,this.options.table_name)) : ''
        , query = encodeURIComponent(this.options.query.replace(/\{\{table_name\}\}/g,this.options.table_name));

      // Add the cartodb tiles
      var cartodb_url = 'http://' + this.options.user_name + '.cartodb.com/tiles/' + this.options.table_name + '/{z}/{x}/{y}.png?sql=' + query +'&style=' + tile_style;
      this.layer = new L.TileLayer(cartodb_url,{attribution:'CartoDB', opacity: this.options.opacity});

      this.options.map.addLayer(this.layer,false);
    },


    /**
     * Add interaction cartodb tiles to the map
     */
    _addInteraction: function () {
      
      var self = this;

      // interaction placeholder
      this.tilejson = this._generateTileJson();
      this.layer = new wax.leaf.connector(this.tilejson);

      this.options.map.addLayer(this.layer,false);

      this.interaction = wax.leaf.interaction()
        .map(this.options.map)
        .tilejson(this.tilejson)
        .on('on',function(o) {self._bindWaxEvents(self.options.map,self.popup,o)})
        .on('off', function(o){
          document.body.style.cursor = "default"; 
        });

      this._createPopup();
    },


    /**
     * Create the popup
     */
    _createPopup: function() {
      this.popup = new L.CartoDBPopup(this.options);
    },


    /**
     * Bind events for wax interaction
     * @param {Object} Layer map object
     * @param {Object} CartoDB Popup object
     * @param {Event} Wax event
     */
    _bindWaxEvents: function(map,popup,o) {

      switch (o.e.type) {            
        case 'mousemove': document.body.style.cursor = "pointer";
                          break;
        case 'mouseup':   var container_point = map.mouseEventToLayerPoint(o.e)
                            , latlng = map.layerPointToLatLng(container_point);

                          popup.setLatLng(latlng);
                          popup.setContent(o.data.cartodb_id);
                          map.openPopup(popup);

                          break;
        default:          break;
      }
    },


    /**
     * Generate tilejson for wax
     * @return {Object} Options for L.TileLayer
     */
    _generateTileJson: function () {
      var core_url = 'http://' + this.options.user_name + '.cartodb.com';  
      var base_url = core_url + '/tiles/' + this.options.table_name + '/{z}/{x}/{y}';
      var tile_url = base_url + '.png';
      var grid_url = base_url + '.grid.json';
      
      // SQL?
      if (this.options.query) {
        var query = 'sql=' + encodeURIComponent(this.options.query.replace(/\{\{table_name\}\}/g,this.options.table_name));
        tile_url = this._addUrlData(tile_url, query);
        grid_url = this._addUrlData(grid_url, query);
      }

      // STYLE?
      if (this.options.tile_style) {
        var style = 'style=' + encodeURIComponent(this.options.tile_style.replace(/\{\{table_name\}\}/g,this.options.table_name));
        tile_url = this._addUrlData(tile_url, style);
        grid_url = this._addUrlData(grid_url, style);
      }
      
      // Build up the tileJSON
      return {
        blankImage: 'blank_tile.png', 
        tilejson: '1.0.0',
        scheme: 'xyz',
        tiles: [tile_url],
        grids: [grid_url],
        tiles_base: tile_url,
        grids_base: grid_url,
        opacity: this.options.opacity,
        formatter: function(options, data) {
            return data.cartodb_id;
        }
      };
    },



    /*
     * HELPER FUNCTIONS
     */

    /**
     * Parse URI
     * @params {String} Tile url
     * @return {String} URI parsed
     */    
    _parseUri: function (str) {
      var o = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
          name:   "queryKey",
          parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
          strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
          loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
      },
      m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
      uri = {},
      i   = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });
      return uri;
    },


    /**
     * Appends callback onto urls regardless of existing query params
     * @params {String} Tile url
     * @params {String} Tile data
     * @return {String} Tile url parsed
     */
    _addUrlData: function (url, data) {
        url += (this._parseUri(url).query) ? '&' : '?';
        return url += data;
    }
  });
}





////////////////////////
// CartoDB Infowindow //
////////////////////////

L.CartoDBPopup = L.Class.extend({
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
		emile(div,{
      bottom: '+=' + 10 + 'px',
      opacity: 1,
      duration: 200
		});
		this._opened = true;
	},


	_close: function() {
		if (this._opened) {
			var div = this._container
				, that = this;
		
			emile(div,{
	      bottom: '-=' + 10 + 'px',
	      opacity: 0,
	      duration: 100,
	      after: function() {
	      	div.style.visibility = "hidden";
	      	that._map.removeLayer(that);
	      }
			});

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

    reqwest({
	    url:'http://'+ this.options.user_name +'.cartodb.com/api/v1/sql/?q='+infowindow_sql,
    	type: 'jsonp',
	    jsonpCallback: 'callback',
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



/*!
  * Reqwest! A general purpose XHR connection manager
  * (c) Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function(a,b){typeof module!="undefined"?module.exports=b():typeof define=="function"&&define.amd?define(a,b):this[a]=b()}("reqwest",function(){function handleReadyState(a,b,c){return function(){a&&a[readyState]==4&&(twoHundo.test(a.status)?b(a):c(a))}}function setHeaders(a,b){var c=b.headers||{},d;c.Accept=c.Accept||defaultHeaders.accept[b.type]||defaultHeaders.accept["*"],!b.crossOrigin&&!c[requestedWith]&&(c[requestedWith]=defaultHeaders.requestedWith),c[contentType]||(c[contentType]=b.contentType||defaultHeaders.contentType);for(d in c)c.hasOwnProperty(d)&&a.setRequestHeader(d,c[d])}function generalCallback(a){lastValue=a}function urlappend(a,b){return a+(/\?/.test(a)?"&":"?")+b}function handleJsonp(a,b,c,d){var e=uniqid++,f=a.jsonpCallback||"callback",g=a.jsonpCallbackName||"reqwest_"+e,h=new RegExp("((^|\\?|&)"+f+")=([^&]+)"),i=d.match(h),j=doc.createElement("script"),k=0;i?i[3]==="?"?d=d.replace(h,"$1="+g):g=i[3]:d=urlappend(d,f+"="+g),win[g]=generalCallback,j.type="text/javascript",j.src=d,j.async=!0,typeof j.onreadystatechange!="undefined"&&(j.event="onclick",j.htmlFor=j.id="_reqwest_"+e),j.onload=j.onreadystatechange=function(){if(j[readyState]&&j[readyState]!=="complete"&&j[readyState]!=="loaded"||k)return!1;j.onload=j.onreadystatechange=null,j.onclick&&j.onclick(),a.success&&a.success(lastValue),lastValue=undefined,head.removeChild(j),k=1},head.appendChild(j)}function getRequest(a,b,c){var d=(a.method||"GET").toUpperCase(),e=typeof a=="string"?a:a.url,f=a.processData!==!1&&a.data&&typeof a.data!="string"?reqwest.toQueryString(a.data):a.data||null,g;return(a.type=="jsonp"||d=="GET")&&f&&(e=urlappend(e,f),f=null),a.type=="jsonp"?handleJsonp(a,b,c,e):(g=xhr(),g.open(d,e,!0),setHeaders(g,a),g.onreadystatechange=handleReadyState(g,b,c),a.before&&a.before(g),g.send(f),g)}function Reqwest(a,b){this.o=a,this.fn=b,init.apply(this,arguments)}function setType(a){var b=a.match(/\.(json|jsonp|html|xml)(\?|$)/);return b?b[1]:"js"}function init(o,fn){function complete(a){o.timeout&&clearTimeout(self.timeout),self.timeout=null,o.complete&&o.complete(a)}function success(resp){var r=resp.responseText;if(r)switch(type){case"json":try{resp=win.JSON?win.JSON.parse(r):eval("("+r+")")}catch(err){return error(resp,"Could not parse JSON in response",err)}break;case"js":resp=eval(r);break;case"html":resp=r}fn(resp),o.success&&o.success(resp),complete(resp)}function error(a,b,c){o.error&&o.error(a,b,c),complete(a)}this.url=typeof o=="string"?o:o.url,this.timeout=null;var type=o.type||setType(this.url),self=this;fn=fn||function(){},o.timeout&&(this.timeout=setTimeout(function(){self.abort()},o.timeout)),this.request=getRequest(o,success,error)}function reqwest(a,b){return new Reqwest(a,b)}function normalize(a){return a?a.replace(/\r?\n/g,"\r\n"):""}function serial(a,b){var c=a.name,d=a.tagName.toLowerCase(),e=function(a){a&&!a.disabled&&b(c,normalize(a.attributes.value&&a.attributes.value.specified?a.value:a.text))};if(a.disabled||!c)return;switch(d){case"input":if(!/reset|button|image|file/i.test(a.type)){var f=/checkbox/i.test(a.type),g=/radio/i.test(a.type),h=a.value;(!f&&!g||a.checked)&&b(c,normalize(f&&h===""?"on":h))}break;case"textarea":b(c,normalize(a.value));break;case"select":if(a.type.toLowerCase()==="select-one")e(a.selectedIndex>=0?a.options[a.selectedIndex]:null);else for(var i=0;a.length&&i<a.length;i++)a.options[i].selected&&e(a.options[i])}}function eachFormElement(){var a=this,b,c,d,e=function(b,c){for(var e=0;e<c.length;e++){var f=b[byTag](c[e]);for(d=0;d<f.length;d++)serial(f[d],a)}};for(c=0;c<arguments.length;c++)b=arguments[c],/input|select|textarea/i.test(b.tagName)&&serial(b,a),e(b,["input","select","textarea"])}function serializeQueryString(){return reqwest.toQueryString(reqwest.serializeArray.apply(null,arguments))}function serializeHash(){var a={};return eachFormElement.apply(function(b,c){b in a?(a[b]&&!isArray(a[b])&&(a[b]=[a[b]]),a[b].push(c)):a[b]=c},arguments),a}var context=this,win=window,doc=document,old=context.reqwest,twoHundo=/^20\d$/,byTag="getElementsByTagName",readyState="readyState",contentType="Content-Type",requestedWith="X-Requested-With",head=doc[byTag]("head")[0],uniqid=0,lastValue,xmlHttpRequest="XMLHttpRequest",isArray=typeof Array.isArray=="function"?Array.isArray:function(a){return a instanceof Array},defaultHeaders={contentType:"application/x-www-form-urlencoded",accept:{"*":"text/javascript, text/html, application/xml, text/xml, */*",xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript",js:"application/javascript, text/javascript"},requestedWith:xmlHttpRequest},xhr=win[xmlHttpRequest]?function(){return new XMLHttpRequest}:function(){return new ActiveXObject("Microsoft.XMLHTTP")};return Reqwest.prototype={abort:function(){this.request.abort()},retry:function(){init.call(this,this.o,this.fn)}},reqwest.serializeArray=function(){var a=[];return eachFormElement.apply(function(b,c){a.push({name:b,value:c})},arguments),a},reqwest.serialize=function(){if(arguments.length===0)return"";var a,b,c=Array.prototype.slice.call(arguments,0);return a=c.pop(),a&&a.nodeType&&c.push(a)&&(a=null),a&&(a=a.type),a=="map"?b=serializeHash:a=="array"?b=reqwest.serializeArray:b=serializeQueryString,b.apply(null,c)},reqwest.toQueryString=function(a){var b="",c,d=encodeURIComponent,e=function(a,c){b+=d(a)+"="+d(c)+"&"};if(isArray(a))for(c=0;a&&c<a.length;c++)e(a[c].name,a[c].value);else for(var f in a){if(!Object.hasOwnProperty.call(a,f))continue;var g=a[f];if(isArray(g))for(c=0;c<g.length;c++)e(f,g[c]);else e(f,a[f])}return b.replace(/&$/,"").replace(/%20/g,"+")},reqwest.compat=function(a,b){return a&&(a.type&&(a.method=a.type)&&delete a.type,a.dataType&&(a.type=a.dataType),a.jsonpCallback&&(a.jsonpCallbackName=a.jsonpCallback)&&delete a.jsonpCallback,a.jsonp&&(a.jsonpCallback=a.jsonp)),new Reqwest(a,b)},reqwest})
/*!
  * emile.js (c) 2009 - 2011 Thomas Fuchs
  * Licensed under the terms of the MIT license.
  */
!function(a){function A(a,b){a=typeof a=="string"?document.getElementById(a):a,b=z(b);var c={duration:b.duration,easing:b.easing,after:b.after};delete b.duration,delete b.easing,delete b.after;if(e&&typeof c.easing!="function")return y(a,b,c);var d=q(b,function(a,b){a=r(a);return p(a)in h&&g.test(b)?[a,b+"px"]:[a,b]});x(a,d,c)}function z(a){var b={};for(var c in a)b[c]=a[c],c=="after"&&delete a[c];return b}function y(a,b,c){var d=[],f=[],i=c.duration||1e3,j=c.easing||"ease-out",k="";i=i+"ms",a.addEventListener(l,function m(){a.setAttribute("style",k),c.after&&c.after(),a.removeEventListener(l,m,!0)},!0),setTimeout(function(){var c;for(c in b)b.hasOwnProperty(c)&&d.push(r(c)+" "+i+" "+j);for(c in b){var f=p(c)in h&&g.test(b[c])?b[c]+"px":b[c];b.hasOwnProperty(c)&&(a.style[p(c)]=f)}k=a.getAttribute("style"),d=d.join(","),a.style[e+"Transition"]=d},10)}function x(a,b,c,d){c=c||{};var e=w(b),f=a.currentStyle?a.currentStyle:getComputedStyle(a,null),g={},h=+(new Date),i,j=c.duration||200,k=h+j,l,m=c.easing||function(a){return-Math.cos(a*Math.PI)/2+.5};for(i in e)g[i]=v(f[i]);l=setInterval(function(){var b=+(new Date),f,i=b>k?1:(b-h)/j;for(f in e)a.style[f]=e[f].f(g[f].v,e[f].v,m(i))+e[f].u;b>k&&(clearInterval(l),c.after&&c.after(),d&&setTimeout(d,1))},10)}function w(a){var c,d={},e=k.length,f;b.innerHTML='<div style="'+a+'"></div>',c=b.childNodes[0].style;while(e--)(f=c[k[e]])&&(d[k[e]]=v(f));return d}function v(a){var b=parseFloat(a),c=a?a.replace(/^[\-\d\.]+/,""):a;return isNaN(b)?{v:c,f:u,u:""}:{v:b,f:s,u:c}}function u(a,b,c){var d=2,e,f,g,h=[],i=[];while((e=3)&&(f=arguments[d-1])&&d--)if(t(f,0)=="r"){f=f.match(/\d+/g);while(e--)h.push(~~f[e])}else{f.length==4&&(f="#"+t(f,1)+t(f,1)+t(f,2)+t(f,2)+t(f,3)+t(f,3));while(e--)h.push(parseInt(t(f,1+e*2,2),16))}while(e--)g=~~(h[e+3]+(h[e]-h[e+3])*c),i.push(g<0?0:g>255?255:g);return"rgb("+i.join(",")+")"}function t(a,b,c){return a.substr(b,c||1)}function s(a,b,c){return(a+(b-a)*c).toFixed(3)}function r(a){if(a.toUpperCase()===a)return a;return a.replace(/([a-zA-Z0-9])([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()}function q(a,b){return o(a,function(a,c){var d=b?b(c,a):[c,a];return d[0]+":"+d[1]+";"}).join("")}function p(a){return a.replace(/-(.)/g,function(a,b){return b.toUpperCase()})}function o(a,b,c){var d=[],e;for(e in a)d.push(b.call(c,a[e],e,a));return d}var b=document.createElement("div"),c=["webkit","Moz","O"],d=3,e,f,g=/\d+$/,h={},i="backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color fontWeight lineHeight opacity outlineColor zIndex",j="top bottom left right borderWidth borderBottomWidth borderLeftWidth borderRightWidth borderTopWidth borderSpacing borderRadius marginBottom marginLeft marginRight marginTop width height maxHeight maxWidth minHeight minWidth paddingBottom paddingLeft paddingRight paddingTop fontSize wordSpacing textIndent letterSpacing outlineWidth outlineOffset",k=(i+" "+j).split(" ");while(d--)f=c[d],b.style.cssText="-"+f.toLowerCase()+"-transition-property:opacity;",typeof b.style[f+"TransitionProperty"]!="undefined"&&(e=f);var l=/^w/.test(e)?"webkitTransitionEnd":"transitionend";for(var m=j.split(" "),n=m.length;n--;)h[m[n]]=1;var B=a.emile;A.noConflict=function(){a.emile=B;return this},a.emile=A}(this)
