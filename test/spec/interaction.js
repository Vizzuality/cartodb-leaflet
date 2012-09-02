describe('Interaction funcionality', function() {
  var div, map, cdb_layer;

  beforeEach(function() {
    div = document.createElement('div');
    div.style.height = "100px";
    div.style.width = "100px";

    map = L.map( div, {center: [51.505, -0.09],zoom: 13} );
  });


  it('If there is no interaction defined, shouldn\'t work and failed', function() {

    cdb_layer = new L.CartoDBLayer({
      map: map,
      user_name:"examples",
      table_name: 'country_colors',
      query: "SELECT * FROM {{table_name}}",
      tile_style: "#{{table_name}}{marker-fill:#E25B5B}",
      attribution: "Vizzuality",
      interactivity: "cartodb_id",
      opacity:0.8,
      auto_bound: false,
      debug: true
    });

    map.addLayer(cdb_layer);

    // Fake a mouseover
    $(div).trigger('mouseover');
    expect(cdb_layer._bindWaxOnEvents).toThrow();

    // Fake a mouseout
    $(div).trigger('mouseout');
    expect(cdb_layer._bindWaxOffEvents).toThrow();
  });

  it('If there is interaction defined, should work', function() {

    runs(function () {
      cdb_layer = new L.CartoDBLayer({
        map: map,
        user_name:"examples",
        table_name: 'country_colors',
        attribution: "Vizzuality",
        interactivity: "cartodb_id",
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {},
        opacity:0.8,
        auto_bound: false,
        debug: true
      });

      map.addLayer(cdb_layer);

      $(div).trigger("mouseover", [50,50]);
      $(div).trigger("mouseover", [25,25]);
    });

    waits(2000);

    runs(function () {
      spyOn(cdb_layer, '_bindWaxOnEvents');
      // Fake a click
      $(div).find(".leaflet-container").trigger("click", [50,50]);
      expect(cdb_layer._bindWaxOnEvents).toHaveBeenCalled();
    });
  });

});