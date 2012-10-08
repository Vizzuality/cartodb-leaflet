# What is the CartoDB library for Leaflet?

This library allows you to use your own CartoDB tables with Laeflet.


# Using the library

Using the library is really easy. It accepts the following parameters to manage the behavior of your CartoDB layers:

<table>
<tr>
<td><b>Parameter name</b></td>
<td><b>Description</b></td>
<td><b>Type</b></td>
<td><b>Callback variables</b></td>
<td><b>Required</b></td>
</tr>

<tr>
<td>map</td>
<td>The Leaflet Map object.</td>
<td>Object</td>
<td></td>
<td>Yes</td>
</tr>

<tr>
<td>username</td>
<td>Your CartoDB user name.</td>
<td>String</td>
<td></td>
<td>Yes</td>
</tr>

<tr>
<td>table_name</td>
<td>Your CartoDB table name.</td>
<td>String</td>
<td></td>
<td>Yes</td>
</tr>

<tr>
<td>query</td>
<td>A SQL query.</td>
<td>String</td>
<td></td>
<td>Yes</td>
</tr>

<tr>
<td>opacity</td>
<td>If you want to change the opacity of the CartoDB layer.</td>
<td>Number</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>interactivity</td>
<td>If you want to add interactivity to the layer without making requests.</td>
<td>String (columns separated by commas)</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>featureOver</td>
<td>A callback when hovers in a feature</td>
<td>Function</td>
<td>
  <b>event:</b> Mouse event object<br/>
  <b>latlng:</b> The LatLng leaflet object where was clicked<br/>
  <b>pos:</b> Object with x and y position in the DOM map element<br/>
  <b>data:</b> The CartoDB data of the clicked feature with the `interactivity` param.
</td>
<td>No (But only will work with `interactivity` specified)</td>
</tr>

<tr>
<td>featureOut</td>
<td>A callback when hovers out a feature</td>
<td>Function</td>
<td></td>
<td>No (But only will work with `interactivity` specified)</td>
</tr>

<tr>
<td>featureClick</td>
<td>A callback when clicks in a feature</td>
<td>Function</td>
<td>
  <b>event:</b> Mouse event object<br/>
  <b>latlng:</b> The LatLng leaflet object where was clicked<br/>
  <b>pos:</b> Object with x and y position in the DOM map element<br/>
  <b>data:</b> The CartoDB data of the clicked feature with the `interactivity` param.
</td>
<td>No (But only will work with `interactivity` specified)</td>
</tr>

<tr>
<td>attribution</td>
<td>Set the layer attribution.</td>
<td>String</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>tile_style</td>
<td>If you want to add other style to the layer.</td>
<td>String</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>auto_bound</td>
<td>If you want to zoom in the area where the layer is positioned.</td>
<td>Boolean</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>debug</td>
<td>If you want to debug the library, set to true.</td>
<td>Boolean</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>tiler_protocol</td>
<td>Tiler protocol (opcional - default = 'http').</td>
<td>No</td>
<td></td>
</tr>

<tr>
<td>tiler_domain</td>
<td>Tiler domain (opcional - default = 'cartodb.com').</td>
<td></td>
<td>No</td>
<td></td>
</tr>

<tr>
<td>tiler_port</td>
<td>Tiler port as a string (opcional - default = '80').</td>
<td></td>
<td>No</td>
<td></td>
</tr>

<tr>
<td>sql_protocol</td>
<td>SQL API protocol (opcional - default = 'http').</td>
<td>String</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>sql_domain</td>
<td>SQL API domain (opcional - default = 'cartodb.com').</td>
<td>String</td>
<td></td>
<td>No</td>
</tr>

<tr>
<td>sql_port</td>
<td>SQL API port as a string (opcional - default = '80').</td>
<td>String</td>
<td></td>
<td>No</td>
</tr>

</table>


# Usage notes

If you want to get a feature clicked || hover data (via the `interactivity` parameter), the columns must be in a string separated by commas.
If you don't want to write the name of the table several times, you can use {{table_name}} in the `query` or `tile_style` parameters.
We strongly recommend the use of the files available in this repository. These are tested, and if you decide use updated ones, the library could not work.


# Creating an example


Here's [live example](http://vizzuality.github.com/cartodb-leaflet/examples/custom-popup.html)!


First of all add the necessary script and css files:

```html
<link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.4.4/leaflet.css" />
<!--[if IE]><link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.4.4/leaflet.ie.css" /><![endif]-->
<link  href="css/cartodb-leaflet.css" rel="stylesheet" type="text/css">
<script src="http://cdn.leafletjs.com/leaflet-0.4.4/leaflet.js"></script>
<script type="text/javascript" src="js/wax.leaf.min.js"></script>
<script type="text/javascript" src="dist/cartodb-leaflet-min.js"></script>
<script type="text/javascript" src="dist/cartodb-popup.js"></script>
```
* We strongly recommend to use the library files we have in this repository, they are fully tested.


When the document is loaded, start creating the map:

```javascript
var map = new L.Map('map');
var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
	cloudmadeAttrib = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
	cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttrib});
map.addLayer(cloudmade);
```
  
After that, create the CartoDB layer:

```javascript
var cartodb_leaflet = new L.CartoDBLayer({
  map: map,
  user_name:'examples',
  table_name: 'earthquakes',
  query: "SELECT * FROM {{table_name}}",
  tile_style: "#{{table_name}}{marker-fill:red}",
  interactivity: "cartodb_id, magnitude",
  featureClick: function(ev, latlng, pos, data) {alert(data)},
  featureOver: function(){},
  featureOut: function(){},
  attribution: "CartoDB",
  auto_bound: true
});
```

And finally add it to the map:

```javascript
map.addLayer(cartodb_leaflet);
```


# Functions
New funcionalities are coming, in the meantime you can use:


- **removeLayer**: Removes the cartodb layer from the map.
    Example: ```map.removeLayer(cartodb_leaflet);```
- **hide**: Hide the cartodb layer from the map.
    Example: ```cartodb_leaflet.hide();```
- **show**: Show again the cartodb layer in the map.
    Example: ```cartodb_leaflet.show();```
- **setInteraction**: Set the interaction of your layer to true or false.
    Example: ```cartodb_leaflet.setInteraction(false);```
- **setAttribution**: Set the layer attribution.
    Example: ```cartodb_leaflet.setAttribution("CartoDB");```
- **setOpacity**: Change the opacity of the CartoDB layer.
    Example: ```cartodb_leaflet.setOpacity(0.3);```
- **setQuery**: Change the query parameter for the layer
    Example: ```cartodb_leaflet.setQuery("SELECT * FROM {{table_name}} WHERE cartodb_id > 10");```
- **setStyle**: Change the style of the layer tiles
    Example: ```cartodb_leaflet.setStyle("#{{table_name}}{marker-fill:blue}");```
- **isVisible**: Get the visibility of the layer
    Example: ```cartodb_leaflet.isVisible();```
- **isAdded**: Returns if the layer is already added to the map
    Example: ```cartodb_leaflet.isAdded();```    
- **setInteractivity**: Change the columns you want to get data (it needs to reload the tiles)
    Example: ```cartodb_leaflet.setInteractivity("cartodb_id, the_geom, magnitude");```
- **setBounds**: Set bounds in the map using a new query or the default one
    Example: ```cartodb_leaflet.setBounds(); || cartodb_leaflet.setBounds("SELECT * FROM {{table_name}} WHERE cartodb_id < 100");```
- **setOptions**: Change any parameter at the same time refreshing the tiles once
    Example: ```cartodb_leaflet.setOptions({query: "SELECT * FROM {{table_name}} WHERE cartodb_id<100", interactivity: "cartodb_id,the_geom,magnitude"});```
- **setLayerOrder**: _Not available yet_ -> Waiting for this ticket fixed: https://github.com/CloudMade/Leaflet/issues/505