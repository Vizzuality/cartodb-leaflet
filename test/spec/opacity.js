describe('Opacity interaction', function() {
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
      opacity:0.8,
      interactivity: "cartodb_id, magnitude",
      featureOver: function(ev,latlng,pos,data) {},
      featureOut: function() {},
      featureClick: function(ev,latlng,pos,data) {},
      auto_bound: false,
      debug: true
    });

    map.addLayer(cdb_layer);
  });


  it('Layer opacity should be 0.8', function() {
    var $layer = $(div).find(".leaflet-layer")
      , opacity = cdb_layer.options.opacity;

    expect(cdb_layer.options.visible).toBeTruthy();
    expect($layer.css("opacity")).toEqual(opacity.toString());
  });


  it('Opacity shouldn\'t change if it is not visible', function() {
    cdb_layer.hide();
    cdb_layer.setOpacity(0.3);

    var $layer = $(div).find(".leaflet-layer")
      , opacity = cdb_layer.options.opacity;

    expect(cdb_layer.options.visible).toBeFalsy();
    expect($layer.css("opacity")).toEqual('0');
  });


  it('Opacity should change if layer is visible', function() {
    cdb_layer.setOpacity(0.3);

    var $layer = $(div).find(".leaflet-layer")
      , opacity = cdb_layer.options.opacity;

    expect(cdb_layer.options.visible).toBeTruthy();
    expect($layer.css("opacity")).toEqual('0.3');
  });


  it('If sets opacity to 0, the layer is still visible', function() {
    cdb_layer.setOpacity(0);

    var $layer = $(div).find(".leaflet-layer")
      , opacity = cdb_layer.options.opacity;

    expect(cdb_layer.options.visible).toBeTruthy();
    expect($layer.css("opacity")).toEqual('0');
  });
});