describe('Attribution option', function() {
  var div, map, cdb_layer;

  beforeEach(function() {
    div = document.createElement('div');
    map = L.map( div, {center: [51.505, -0.09],zoom: 13} );
    cdb_layer = new L.CartoDBLayer({
      map: map,
      user_name:"examples",
      table_name: 'earthquakes',
      query: "SELECT * FROM {{table_name}}",
      tile_style: "#{{table_name}}{marker-fill:#E25B5B}",
      attribution: "Vizzuality",
      opacity:1,
      interactivity: "cartodb_id, magnitude",
      featureOver: function(ev,latlng,pos,data) {},
      featureOut: function() {},
      featureClick: function(ev,latlng,pos,data) {},
      auto_bound: false,
      debug: true
    });

    map.addLayer(cdb_layer);
  });


  it('can have its content set', function() {
    expect($(div).find('.leaflet-control-attribution').text().length).toEqual(31);
  });

  it('if removes the layer, attribution should set again', function() {
    map.removeLayer(cdb_layer);
    expect($(div).find('.leaflet-control-attribution').text().length).toEqual(18);
  });

  it('if changes the attribution (), attribution should set again', function() {
    cdb_layer.setAttribution("CartoDB");
    expect($(div).find('.leaflet-control-attribution').text().length).toEqual(28);
  });

  it('if changes the attribution (setOptions), attribution should set again', function() {
    cdb_layer.setOptions({ attribution: "CartoDB" });
    expect($(div).find('.leaflet-control-attribution').text().length).toEqual(28);
  });

  it('if hides cartodb layer, attribution should keep as it is', function() {
    cdb_layer.hide()
    expect($(div).find('.leaflet-control-attribution').text().length).toEqual(31);
  });
});