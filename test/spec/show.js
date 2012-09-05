describe('Show funcionality', function() {
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


  it('If layer is visible, show shouldn\'t do anything', function() {

    cdb_layer.setOptions({ debug: false });

    cdb_layer.show();

    var $layer = $(div).find(".leaflet-layer")
      , opacity = cdb_layer.options.opacity;

    expect(cdb_layer.show).toThrow();

    cdb_layer.setOptions({ debug: true });

    expect(cdb_layer.options.visible).toBeTruthy();
    expect($layer.css("opacity")).toEqual(opacity.toString());
  });


  it('Shows layer after hide it', function() {
    runs(function () {
      cdb_layer.hide();
      setTimeout(function () {
        cdb_layer.show();
      }, 250);
    });

    waits(500);

    runs(function () {
      var $layer = $(div).find(".leaflet-layer")
        , opacity = cdb_layer.options.opacity;

      expect(cdb_layer.options.visible).toBeTruthy();
      expect($layer.css("opacity")).toEqual(opacity.toString());
    });
  });

  it('If hides layer and set an opacity greater than 0, layer shouln\'t be visible', function() {
    cdb_layer.hide();
    cdb_layer.setOpacity(0.2);
    expect(cdb_layer.options.visible).toBeFalsy();
  });
});