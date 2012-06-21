
/**
 * @name cartodb-popup
 * @version 1.1 [June 21, 2012]
 * @author: jmedina@vizzuality.com
 * @fileoverview <b>Author:</b> jmedina@vizzuality.com<br/> <b>Licence:</b>
 *               Licensed under <a
 *               href="http://opensource.org/licenses/mit-license.php">MIT</a>
 *               license.<br/> This library lets you to use a new Popup with Leaflet.
 *                 
 */


L.CartoDBPopup = L.Class.extend({
  includes: L.Mixin.Events,

  options: {
    minWidth: 50,
    maxWidth: 300,
    maxHeight: null,
    autoPan: true,
    closeButton: true,
    offset: new L.Point(58, 2),
    autoPanPadding: new L.Point(5, 5),
    className: ''
  },

  /**
   * Initialize the CartoDB Popup
   * @params {options} Object with popup options
   * @params {source} Object with source
   */
  initialize: function (options, source) {
    L.Util.setOptions(this, options);

    this._source = source;
  },

  /**
   * When map adds the popup
   * @params {map} Leaflet map
   */
  onAdd: function (map) {
    this._map = map;

    if (!this._container) {
      this._initLayout();
    }
    this._updateContent();

    this._container.style.opacity = '0';
    map._panes.popupPane.appendChild(this._container);

    map.on('viewreset', this._updatePosition, this);

    if (map.options.closePopupOnClick) {
      map.on('preclick', this._close, this);
    }

    this._update();
    this._container.style.opacity = '1';
  },

  /**
   * When map removes the popup
   * @params {options} Object with popup options
   */
  onRemove: function (map) {
    map._panes.popupPane.removeChild(this._container);

    L.Util.falseFn(this._container.offsetWidth);

    map.off('viewreset', this._updatePosition, this)
       .off('preclick', this._close, this);

    this._container.style.opacity = '0';

    this._map = null;
  },

  /**
   * Set the correct position for the popup
   * @params {latlng} A new Leaflet LatLng object
   */
  setLatLng: function (latlng) {
    this._latlng = latlng;
    this._update();
    return this;
  },

  /**
   * Adds new content to the popup
   * @params {content} It should be a string or an object
   */
  setContent: function (content) {
    this._content = content;
    this._update();
    return this;
  },

  /**
   * Close the popup (private)
   */
  _close: function () {
    var map = this._map;

    if (map) {
      map._popup = null;

      var div = this._container
        , that = this;
    
      emile(div,{
        bottom: '-=' + 10 + 'px',
        opacity: 0,
        duration: 100,
        after: function() {
          map
            .removeLayer(that)
            .fire('popupclose', {popup: that});
        }
      });
    }
  },
 
  /**
   * Create the default content for the popup (private)
   */
  _initLayout: function () {
    var prefix = 'cartodb-popup',
      container = this._container = L.DomUtil.create('div', prefix + ' ' + this.options.className),
      closeButton;

    L.DomEvent.addListener(container, 'mousedown', L.DomEvent.stopPropagation);
    L.DomEvent.addListener(container, 'touchend', L.DomEvent.stopPropagation);

    if (this.options.closeButton) {
      closeButton = this._closeButton = L.DomUtil.create('a', prefix + '-close-button', container);
      closeButton.href = '#close';
      closeButton.innerHTML = 'x';

      L.DomEvent.addListener(closeButton, 'click', this._onCloseButtonClick, this);
      L.DomEvent.addListener(closeButton, 'touchend', this._onCloseButtonClick, this);
      L.DomEvent.disableClickPropagation(closeButton);
    }

    var wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
    L.DomEvent.addListener(this._wrapper, 'click', L.DomEvent.stopPropagation);
    L.DomEvent.disableClickPropagation(wrapper);

    this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);
    L.DomEvent.addListener(this._contentNode, 'mousewheel', L.DomEvent.stopPropagation);

    this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
    this._tip = L.DomUtil.create('div', prefix + '-tip', this._tipContainer);
  },


  /**
   * Update the popup (position, content, place,...)
   */
  _update: function () {
    if (!this._map) { return; }

    this._container.style.visibility = 'hidden';

    this._updateContent();
    this._updateLayout();
    this._updatePosition();

    this._container.style.opacity = 0;
    this._container.style.visibility = "visible";

    emile(this._container,{
      opacity: 1,
      duration: 200
    });

    this._adjustPan();
  },

  /**
   * Update the content (private)
   */
  _updateContent: function () {
    if (!this._content) { return; }

    if (typeof this._content === 'string') {
      this._contentNode.innerHTML = this._content;
    } else {
      this._contentNode.innerHTML = '';
      var html = '';
      for(var column in this._content) {
        if (column == "cartodb_id") {
          this._tipContainer.innerHTML = '<label>id: <strong>'+this._content[column]+'</strong></label>';
        } else {
          html += '<label>' + column + '</label>';
          html += '<p class="'+((this._content[column]!=null && this._content[column]!='')?'':'empty')+'">'+(this._content[column] || 'empty')+'</p>';
        }
      }
      this._contentNode.innerHTML = html;
    }
    this.fire('contentupdate');
  },

  /**
   * Update the layout (private)
   */
  _updateLayout: function () {
    var container = this._contentNode;

    container.style.width = '';
    container.style.whiteSpace = 'nowrap';

    var width = container.offsetWidth;
    width = Math.min(width, this.options.maxWidth);
    width = Math.max(width, this.options.minWidth);

    container.style.width = (width + 1) + 'px';
    container.style.whiteSpace = '';

    container.style.height = '';

    var height = container.offsetHeight,
      maxHeight = this.options.maxHeight,
      scrolledClass = ' leaflet-popup-scrolled';

    if (maxHeight && height > maxHeight) {
      container.style.height = maxHeight + 'px';
      container.className += scrolledClass;
    } else {
      container.className = container.className.replace(scrolledClass, '');
    }

    this._containerWidth = this._container.offsetWidth;
  },

  /**
   * Update the position (private)
   */
  _updatePosition: function () {
    var pos = this._map.latLngToLayerPoint(this._latlng);

    this._containerBottom = -pos.y - this.options.offset.y;
    this._containerLeft = pos.x - Math.round(this._containerWidth / 2) + this.options.offset.x;

    this._container.style.bottom = this._containerBottom + 'px';
    this._container.style.left = this._containerLeft + 'px';
  },

  /**
   * Adjust the pan of the map when opens the popup (private)
   */
  _adjustPan: function () {
    if (!this.options.autoPan) { return; }

    var map = this._map,
      containerHeight = this._container.offsetHeight,
      containerWidth = this._containerWidth,

      layerPos = new L.Point(
        this._containerLeft,
        -containerHeight - this._containerBottom),

      containerPos = map.layerPointToContainerPoint(layerPos),
      adjustOffset = new L.Point(0, 0),
      padding      = this.options.autoPanPadding,
      size         = map.getSize();

    if (containerPos.x < 0) {
      adjustOffset.x = containerPos.x - padding.x;
    }
    if (containerPos.x + containerWidth > size.x) {
      adjustOffset.x = containerPos.x + containerWidth - size.x + padding.x;
    }
    if (containerPos.y < 0) {
      adjustOffset.y = containerPos.y - padding.y;
    }
    if (containerPos.y + containerHeight > size.y) {
      adjustOffset.y = containerPos.y + containerHeight - size.y + padding.y;
    }

    if (adjustOffset.x || adjustOffset.y) {
      map.panBy(adjustOffset);
    }
  },

  /**
   * Handler when popup is clicked for closing it (private)
   */
  _onCloseButtonClick: function (e) {
    this._close();
    L.DomEvent.stop(e);
  }
});

/*!
  * emile.js (c) 2009 - 2011 Thomas Fuchs
  * Licensed under the terms of the MIT license.
  */
!function(a){function A(a,b){a=typeof a=="string"?document.getElementById(a):a,b=z(b);var c={duration:b.duration,easing:b.easing,after:b.after};delete b.duration,delete b.easing,delete b.after;if(e&&typeof c.easing!="function")return y(a,b,c);var d=q(b,function(a,b){a=r(a);return p(a)in h&&g.test(b)?[a,b+"px"]:[a,b]});x(a,d,c)}function z(a){var b={};for(var c in a)b[c]=a[c],c=="after"&&delete a[c];return b}function y(a,b,c){var d=[],f=[],i=c.duration||1e3,j=c.easing||"ease-out",k="";i=i+"ms",a.addEventListener(l,function m(){a.setAttribute("style",k),c.after&&c.after(),a.removeEventListener(l,m,!0)},!0),setTimeout(function(){var c;for(c in b)b.hasOwnProperty(c)&&d.push(r(c)+" "+i+" "+j);for(c in b){var f=p(c)in h&&g.test(b[c])?b[c]+"px":b[c];b.hasOwnProperty(c)&&(a.style[p(c)]=f)}k=a.getAttribute("style"),d=d.join(","),a.style[e+"Transition"]=d},10)}function x(a,b,c,d){c=c||{};var e=w(b),f=a.currentStyle?a.currentStyle:getComputedStyle(a,null),g={},h=+(new Date),i,j=c.duration||200,k=h+j,l,m=c.easing||function(a){return-Math.cos(a*Math.PI)/2+.5};for(i in e)g[i]=v(f[i]);l=setInterval(function(){var b=+(new Date),f,i=b>k?1:(b-h)/j;for(f in e)a.style[f]=e[f].f(g[f].v,e[f].v,m(i))+e[f].u;b>k&&(clearInterval(l),c.after&&c.after(),d&&setTimeout(d,1))},10)}function w(a){var c,d={},e=k.length,f;b.innerHTML='<div style="'+a+'"></div>',c=b.childNodes[0].style;while(e--)(f=c[k[e]])&&(d[k[e]]=v(f));return d}function v(a){var b=parseFloat(a),c=a?a.replace(/^[\-\d\.]+/,""):a;return isNaN(b)?{v:c,f:u,u:""}:{v:b,f:s,u:c}}function u(a,b,c){var d=2,e,f,g,h=[],i=[];while((e=3)&&(f=arguments[d-1])&&d--)if(t(f,0)=="r"){f=f.match(/\d+/g);while(e--)h.push(~~f[e])}else{f.length==4&&(f="#"+t(f,1)+t(f,1)+t(f,2)+t(f,2)+t(f,3)+t(f,3));while(e--)h.push(parseInt(t(f,1+e*2,2),16))}while(e--)g=~~(h[e+3]+(h[e]-h[e+3])*c),i.push(g<0?0:g>255?255:g);return"rgb("+i.join(",")+")"}function t(a,b,c){return a.substr(b,c||1)}function s(a,b,c){return(a+(b-a)*c).toFixed(3)}function r(a){if(a.toUpperCase()===a)return a;return a.replace(/([a-zA-Z0-9])([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()}function q(a,b){return o(a,function(a,c){var d=b?b(c,a):[c,a];return d[0]+":"+d[1]+";"}).join("")}function p(a){return a.replace(/-(.)/g,function(a,b){return b.toUpperCase()})}function o(a,b,c){var d=[],e;for(e in a)d.push(b.call(c,a[e],e,a));return d}var b=document.createElement("div"),c=["webkit","Moz","O"],d=3,e,f,g=/\d+$/,h={},i="backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor color fontWeight lineHeight opacity outlineColor zIndex",j="top bottom left right borderWidth borderBottomWidth borderLeftWidth borderRightWidth borderTopWidth borderSpacing borderRadius marginBottom marginLeft marginRight marginTop width height maxHeight maxWidth minHeight minWidth paddingBottom paddingLeft paddingRight paddingTop fontSize wordSpacing textIndent letterSpacing outlineWidth outlineOffset",k=(i+" "+j).split(" ");while(d--)f=c[d],b.style.cssText="-"+f.toLowerCase()+"-transition-property:opacity;",typeof b.style[f+"TransitionProperty"]!="undefined"&&(e=f);var l=/^w/.test(e)?"webkitTransitionEnd":"transitionend";for(var m=j.split(" "),n=m.length;n--;)h[m[n]]=1;var B=a.emile;A.noConflict=function(){a.emile=B;return this},a.emile=A}(this)
