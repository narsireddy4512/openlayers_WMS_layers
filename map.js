var map = new ol.Map({
  layers: [
      new ol.layer.Tile({
          source: new ol.source.OSM(),
      }),
      new ol.layer.Vector({
          source: new ol.source.Vector({
              format: new ol.format.GeoJSON(),
              url: function (extent) {
                  return 'http://localhost/geoserver/topp/wfs?' +
                      'service=WFS&version=2.0.0&request=GetFeature&typeNames=topp:states&' +
                      'outputFormat=application/json&srsname=EPSG:4326&' +
                      'bbox=' + extent.join(',') + ',EPSG:4326';
              },
              strategy: ol.loadingstrategy.bbox,
          }),
      }),
  ],
  target: 'map',
  view: new ol.View({
      center: [0, 0],
      zoom: 2,
  }),
});

var draw = new ol.interaction.Draw({
  source: vectorSource,
  type: 'Point', // or 'LineString', 'Polygon', etc.
});

map.addInteraction(draw);

var modify = new ol.interaction.Modify({
  source: vectorSource,
});

modify.on('modifyend', function (event) {
  var features = event.features.getArray();
  var formatWFS = new ol.format.WFS();
  var formatGML = new ol.format.GML({
      featureNS: 'topp',
      featureType: 'states',
  });

  var node = formatWFS.writeTransaction(features, null, null, formatGML);
  var payload = new XMLSerializer().serializeToString(node);

  // Send the WFS-T transaction to GeoServer
  fetch('http://localhost/geoserver/topp/wfs', {
      method: 'POST',
      headers: {
          'Content-Type': 'text/xml',
      },
      body: payload,
  })
  .then(response => response.text())
  .then(data => {
      // Handle the response from GeoServer
      console.log('Transaction successful', data);
  })
  .catch(error => {
      console.error('Error performing transaction', error);
  });
});

map.addInteraction(modify);
