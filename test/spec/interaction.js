describe('Interaction funcionality', function() {
  var div, map, cdb_layer;

  beforeEach(function() {
    div = document.createElement('div');
    div.style.height = "100px";
    div.style.width = "100px";

    map = L.map( div, {center: [51.505, -0.09],zoom: 13} );

    cdb_layer = new L.CartoDBLayer({
      map: map,
      user_name:"examples",
      table_name: 'country_colors',
      attribution: "Vizzuality",
      interactivity: "cartodb_id",
      opacity:0.8,
      auto_bound: false,
      debug: true
    });

    map.addLayer(cdb_layer);
  });


  it('If there is no interaction defined, shouldn\'t work and failed', function() {
    // Fake a mouseover
    $(div).trigger('mouseover');
    expect(cdb_layer._bindWaxOnEvents).toThrow();

    // Fake a mouseout
    $(div).trigger('mouseout');
    expect(cdb_layer._bindWaxOffEvents).toThrow();
  });


  it('If there is interaction defined, click should work', function() {

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });      

      spyOn(cdb_layer, '_bindWaxOnEvents');

      var e = new jQuery.Event("click");
      e.pageX = 10;
      e.pageY = 10;
      $(div).trigger(e);

      cdb_layer.interaction.click(e,{x:100,y:100});
    });

    waits(1000);

    runs(function () {
      expect(cdb_layer._bindWaxOnEvents).toHaveBeenCalled();
    });
  });


  it('If there is interaction defined, mouseover should work', function() {

    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {
          //console.log(ev,latlng,pos,data);
        }
      });      

      var e = new jQuery.Event("click");
      e.pageX = 10;
      e.pageY = 10;
      $(div).trigger(e);

      cdb_layer.interaction.click(e,{x:100,y:100});
    });

    waits(250);

    runs(function () {
      
    });
  });

});