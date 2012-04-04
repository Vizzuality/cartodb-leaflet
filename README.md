
# What is the CartoDB library for Leaflet?

This library allows you to use your own CartoDB tables with Laeflet.


# Creating an example

You will need to load these files to run the library:

  - [Leaflet library](http://github.com/CloudMade/Leaflet/blob/master/dist/leaflet.js)
  - [Leaflet css theme](http://github.com/CloudMade/Leaflet/tree/master/dist/leaflet.css)
  - [Wax for Leaflet](http://mapbox.com/wax/) 
  - [CartoDB library for Leaflet](https://github.com/Vizzuality/cartodb-leaflet/blob/gh-pages/cartodb-leaflet.js)

Html(*):

```html
<link rel="stylesheet" href="http://code.leafletjs.com/leaflet-0.3.1/leaflet.css" />
<link rel="stylesheet" href="http://code.leafletjs.com/leaflet-0.3.1/leaflet.ie.css" />
<script type="text/javascript" src="http://code.leafletjs.com/leaflet-0.3.1/leaflet.js"></script>
<script type="text/javascript" src="wax.leaflet.min.js"></script>
<script type="text/javascript" src="cartodb-leaflet.js"></script>
```
* We strongly recommend to use the library files we have in this repository, they are fully tested.



# Using the library

Using the library is really easy. It accepts the following parameters to manage the behavior of your CartoDB layers:


<table>
<tr>
<td><b>Parameter name</b></td>
<td><b>Description</b></td>
<td><b>Required</b></td>
</tr>

<tr>
<td>map_canvas</td>
<td>The DOM element id for the map.</td>
<td>Yes</td>
</tr>

<tr>
<td>map</td>
<td>The Leaflet Map object.</td>
<td>Yes</td>
</tr>

<tr>
<td>username</td>
<td>Your CartoDB user name.</td>
<td>Yes</td>
</tr>

<tr>
<td>table_name</td>
<td>Your CartoDB table name.</td>
<td>Yes</td>
</tr>

<tr>
<td>query</td>
<td>A SQL query.</td>
<td>Yes</td>
</tr>

<tr>
<td>infowindow</td>
<td>If you want to add interactivity to the layer, showing the info window.</td>
<td>No</td>
</tr>

<tr>
<td>tile_style</td>
<td>If you want to add other style to the layer.</td>
<td>No</td>
</tr>

<tr>
<td>auto_bound</td>
<td>If you want to zoom in the area where the layer is positioned.</td>
<td>No</td>
</tr>

<tr>
<td>debug</td>
<td>If you want to debug the library, set to true.</td>
<td>No</td>
</tr>

</table>


# Usage notes

If you choose a CartoDB private table you'll need to [authenticate](http://developers.cartodb.com/api/authentication.html) beforehand. If you want to show specific columns in the info window (via the `infowindow` parameter), the columns must be in a query using `WHERE` clauses. Keep in mind the `cartodb_id` and `the_geom_webmercator` columns are required.

If you don't want to write the name of the table several times, you can use {{table_name}} in the `query`, `tile_style` and `infowindow` parameters. {{feature}} is required in the `infowindow` paramenter when you want to show specific information on it.

We strongly recommend the use of the files available in this repository. These are tested, and if you decide use updated ones, the library could not work.

# Example

Here's a [live example](http://vizzuality.github.com/cartodb-leaflet/)!

First of all create your map:

```javascript
var map = new L.Map('map_canvas');
var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
	cloudmadeAttrib = 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
	cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 18, attribution: cloudmadeAttrib});
map.addLayer(cloudmade);
```
  
And then add the cartodb layer:

```javascript
var cartodb_leaflet = new L.CartoDBLayer({
  map_canvas: 'map_canvas',
  map: map,
  user_name:'example',
  table_name: 'earthquakes',
  query: "SELECT * FROM {{table_name}}",
  tile_style: "#{{table_name}}{marker-fill:red}",
  infowindow: "SELECT cartodb_id,the_geom_webmercator,magnitude FROM {{table_name}} WHERE cartodb_id={{feature}}",
  auto_bound: true
});
```


# Functions
New funcionalities are coming, in the meantime you can use:

* update: It needs a parameter and a new value to work. Example: cartodb_leaflet.update({'query':'SELECT * FROM earthquakes WHERE cartodb_id>2'});
* destroy: Removes the cartodb layer from the map. Example: cartodb_leaflet.destroy();
* hide: Hide the cartodb layer from the map (For now, hide and destroy are the same, but will be replace in the future).
* show: Show again the cartodb layer in the map. Example: cartodb_leaflet.show();
* isVisible: Returns if cartodb layer is visible or not. Example: cartodb_leaflet.isVisible(); -> true | false
