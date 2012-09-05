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
      e.clientX = 10;
      e.clientY = 10;
      $(div).trigger(e);

      cdb_layer.interaction.click(e,{x:100,y:100});
    });

    waits(500);

    runs(function () {
      expect(cdb_layer._bindWaxOnEvents).toHaveBeenCalled();
    });
  });


  it('If there is interaction defined, mouseover should work', function() {
    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });      

      spyOn(cdb_layer, '_bindWaxOnEvents');

      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });

    waits(500);

    runs(function () {
      expect(cdb_layer._bindWaxOnEvents).toHaveBeenCalled();
    });
  });


  it('If there is interaction defined, mouseout should work', function() {
    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });

      // Move map to a place without a feature
      map.setView([51.17934297928927, -28.828125], 6)

      spyOn(cdb_layer, '_bindWaxOffEvents');

      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      e.clientX = 10;
      e.clientY = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });

    waits(500);

    runs(function () {
      expect(cdb_layer._bindWaxOffEvents).toHaveBeenCalled();
    });
  });


  it('A click action should return data', function() {

    cdb_layer.setOptions({
      featureOver:  function(ev,latlng,pos,data) {},
      featureOut:   function() {},
      featureClick: function(ev,latlng,pos,data) {
        expect(latlng).not.toBeNull()
        expect(latlng.lat).toBeDefined();
        expect(latlng.lng).toBeDefined();
        expect(ev).not.toBeNull();
        expect(pos).not.toBeNull();
        expect(data).not.toBeNull();
        expect(data.cartodb_id).toBeDefined();
      }
    });      

    var e = new jQuery.Event("click");
    e.pageX = 10;
    e.pageY = 10;
    e.clientX = 10;
    e.clientY = 10;
    $(div).trigger(e);

    cdb_layer.interaction.click(e,{x:100,y:100});
  });


  it('A museover action should return data', function() {
    cdb_layer.setOptions({
      featureOver:  function(ev,latlng,pos,data) {
        expect(latlng).not.toBeNull()
        expect(latlng.lat).toBeDefined();
        expect(latlng.lng).toBeDefined();
        expect(ev).not.toBeNull();
        expect(pos).not.toBeNull();
        expect(data).not.toBeNull();
        expect(data.cartodb_id).toBeDefined();
      },
      featureOut:   function() {},
      featureClick: function(ev,latlng,pos,data) {}
    });      

    var e = new $.Event("mousemove");
    e.pageX = 10;
    e.pageY = 10;
    $(div).trigger(e);

    var pos = wax.u.eventoffset(e);
    cdb_layer.interaction.screen_feature(pos, function(feature) {
      if (feature) {
        bean.fire(cdb_layer.interaction, 'on', {
          parent: map,
          data: feature,
          formatter: null,
          e: e
        });
      } else {
        bean.fire(cdb_layer.interaction, 'off');
      }
    });
  });


  it('A mouseout action should arrive', function() {
    runs(function () {
      cdb_layer.setOptions({
        featureOver:  function(ev,latlng,pos,data) {},
        featureOut:   function() {},
        featureClick: function(ev,latlng,pos,data) {}
      });

      // Move map to a place without a feature
      map.setView([51.17934297928927, -28.828125], 6)

      spyOn(cdb_layer.options, 'featureOut');

      var e = new $.Event("mousemove");
      e.pageX = 10;
      e.pageY = 10;
      $(div).trigger(e);

      var pos = wax.u.eventoffset(e);
      cdb_layer.interaction.screen_feature(pos, function(feature) {
        if (feature) {
          bean.fire(cdb_layer.interaction, 'on', {
            parent: map,
            data: feature,
            formatter: null,
            e: e
          });
        } else {
          bean.fire(cdb_layer.interaction, 'off');
        }
      });
    });

    waits(500);

    runs(function () {
      expect(cdb_layer.options.featureOut).toHaveBeenCalled();
    });
  });

});