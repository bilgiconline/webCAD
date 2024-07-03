// js/main.js
var osmLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});

var bingRoadsLayer = new ol.layer.Tile({
    source: new ol.source.BingMaps({
        key: 'YOUR_BING_API_KEY',
        imagerySet: 'Road'
    })
});

var bingAerialLayer = new ol.layer.Tile({
    source: new ol.source.BingMaps({
        key: 'YOUR_BING_API_KEY',
        imagerySet: 'Aerial'
    })
});

var bingAerialWithLabelsLayer = new ol.layer.Tile({
    source: new ol.source.BingMaps({
        key: 'YOUR_BING_API_KEY',
        imagerySet: 'AerialWithLabels'
    })
});

var map = new ol.Map({
    target: 'map',
    view: new ol.View({
        center: ol.proj.fromLonLat([37.41, 8.82]),
        zoom: 4
    })
});

var layers = {
    'osm': osmLayer,
    'bing-road': bingRoadsLayer,
    'bing-aerial': bingAerialLayer,
    'bing-aerial-labels': bingAerialWithLabelsLayer
};
var extent = [0, 0, 43.47843864, 37.9335524];

var pngSource = new ol.source.ImageStatic({
    url: 'data/Z_50.tif',
    imageExtent: extent
});

var pngLayer = new ol.layer.Image({
    source: pngSource
});

map.addLayer(pngLayer);

map.getView().fit(extent, { size: map.getSize() });
document.getElementById('layer-select').addEventListener('change', function () {
    var selectedLayer = this.value;
    map.getLayers().setAt(0, layers[selectedLayer]);
});

var mousePositionControl = new ol.control.MousePosition({
    coordinateFormat: function(coordinate) {
        var x = coordinate[0] * 100000;
        var y = coordinate[1] * 100000;
        return ol.coordinate.toStringXY([x, y], 4);
    },
    projection: 'EPSG:4326', 
    className: 'custom-mouse-position',
    target: document.getElementById('mouse-position'),
    undefinedHTML: '&nbsp;'
});

map.addControl(mousePositionControl);

var source = new ol.source.Vector({ wrapX: false });
var vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2,
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33',
            }),
        }),
    }),
});
map.addLayer(vector);
var draw;
var selectedFeatures = [];
const snap = new ol.interaction.Snap({ source: source });
map.addInteraction(snap);
const modify = new ol.interaction.Modify({
    source: source,
    style: new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          }),
          stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2
          })
        })
      }),
    deleteCondition: function(event) {
        return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
      }
});
let snapActive = true;
document.getElementById('toggle-snap').addEventListener('click', function () {
    if (snapActive) {
        map.removeInteraction(snap);
        snapActive = false;
        this.textContent = "Snap'i Aç";
    } else {
        map.addInteraction(snap);
        snapActive = true;
        this.textContent = "Snap'i Kapat";
    }
});
const atypeSelect = 'line';
const showSegments = true;
const clearPrevious = true;

let o_draw; // global so we can remove it later
let measurelist = [];
let tipPoint;
function addInteraction() {
    map.removeInteraction(o_draw);
    try {
        map.removeInteraction(omodify);
    } catch(error) {

    }
    if (measurelist.length > 0) {
        measurelist.forEach(function (item) {
          source.removeFeature(item);
        });
      }
     measurelist = [];   
    var value = typeSelect.value;
    if (value !== 'None') {
        if (value == 'Rectangle'){
            draw = new ol.interaction.Draw({
                source: source,
                type: 'Circle',
                geometryFunction: ol.interaction.Draw.createBox(),
                maxPoints: 2            
            });
        }
        else
        draw = new ol.interaction.Draw({
            source: source,
            type: value                
        });
        document.addEventListener('keydown', function (event) {
            if (event.ctrlKey && event.key === 'z') {
                draw.removeLastPoint();
                map.addInteraction(snap);
            }
        });
        map.addInteraction(draw);
        map.addInteraction(snap);
        draw.on('drawend', function (event) {
            var feature = event.feature;
            feature.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 4
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 4
                    })
                })
            }));
            map.addInteraction(snap);
            if (value === 'Polygon' || value === 'Rectangle') {
                calculateAndAddLabel(feature);
            }
        });
    }
}

var typeSelect = document.getElementById('draw-type');
typeSelect.onchange = function () {
    map.removeInteraction(draw);
    map.removeInteraction(o_draw);
    map.removeInteraction(omodify);
    addInteraction();
    if (measurelist.length > 0) {
        measurelist.forEach(function (item) {
          source.removeFeature(item);
        });
      }
     measurelist = [];   
     map.removeInteraction(o_draw);
     map.removeInteraction(omodify);
};

addInteraction();

var selectInteraction = new ol.interaction.Select({
    layers: [vector.getSource()],
    style: function (feature) {
        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#00ff00',
                width: 6
            }),
            fill: new ol.style.Fill({
                color: 'rgba(0, 255, 0, 0.2)'
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#00ff00'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fff',
                    width: 6
                })
            })
        });
    }
});
map.addInteraction(selectInteraction);

selectInteraction.getFeatures().on('add', function (event) {
    var feature = event.element;
    selectedFeatures.push(feature);
});

selectInteraction.getFeatures().on('remove', function (event) {
    var feature = event.element;
    var index = selectedFeatures.indexOf(feature);
    if (index > -1) {
        selectedFeatures.splice(index, 1);
    }
});

var selectInteraction = new ol.interaction.Select({
    layers: [vector],
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#00ff00',
            width: 6
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0, 255, 0, 0.2)'
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#00ff00'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 6
            })
        })
    })
});
map.addInteraction(selectInteraction);

let copiedFeature = null;
let moveInteractionActive = false;
let moveStartCoordinate = null;
let initialFeatureCoordinate = null;
let currentOperation = null; // 'move' or 'copy'
map.getViewport().addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (draw) {
        map.removeInteraction(draw);
        e.preventDefault();
        map.removeInteraction(modify);
        addInteraction();
    }
    typeSelect.value = 'None';
    map.removeInteraction(draw);
    map.removeInteraction(modify);
    source.removeFeature(copiedFeature);     
    copiedFeature = null;
    moveInteractionActive = false;
    moveStartCoordinate = null;
    initialFeatureCoordinate = null;
    currentOperation = null;
    map.removeInteraction(o_draw);
    if (measurelist.length > 0) {
        measurelist.forEach(function (item) {
          source.removeFeature(item);
        });
      }
     measurelist = [];
    addInteraction();
    map.removeInteraction(omodify);
});

function calculateAndAddLabel(feature) {
    var geometry = feature.getGeometry();
    var area = ol.sphere.getArea(geometry);
    area = Math.abs(area);
    var areaInSquareMeters = Math.round(area * 100) / 100;
    var center = ol.extent.getCenter(geometry.getExtent());
    var labelElement = document.createElement('div');
    labelElement.className = 'label';
    labelElement.textContent = areaInSquareMeters + ' m²';
    var labelOverlay = new ol.Overlay({
        element: labelElement,
        position: center,
        positioning: 'center-center'
    });
    map.addOverlay(labelOverlay);
    Draggable.create(labelElement);
}
function addLabel(feature) {
    var geom = feature.getGeometry();
    var area = ol.sphere.getArea(geom);
    var center = ol.extent.getCenter(geom.getExtent());

    var labelElement = document.createElement('div');
    labelElement.className = 'label';
    labelElement.textContent = (area.toFixed(2)) + ' m²';

    var labelOverlay = new ol.Overlay({
        element: labelElement,
        position: center,
        positioning: 'center-center'
    });
    map.addOverlay(labelOverlay);
}

var drawTools = document.getElementById('draw-tools');
Draggable.create(drawTools)
document.getElementById('draw-nothing').addEventListener('click', function () {
    typeSelect.value = 'None';
    map.removeInteraction(draw);
    addInteraction();
});

document.getElementById('draw-point').addEventListener('click', function () {
    typeSelect.value = 'Point';
    map.removeInteraction(draw);
    addInteraction();
});

document.getElementById('draw-line').addEventListener('click', function () {
    typeSelect.value = 'LineString';
    map.removeInteraction(draw);
    addInteraction();
});

document.getElementById('draw-polygon').addEventListener('click', function () {
    typeSelect.value = 'Polygon';
    map.removeInteraction(draw);
    addInteraction();
});

document.getElementById('draw-rectangle').addEventListener('click', function () {
    typeSelect.value = 'Rectangle';
    map.removeInteraction(draw);
    addInteraction();
});


document.getElementById('copy-feature').addEventListener('click', function () {
    const selectedFeatures = selectInteraction.getFeatures();
    if (selectedFeatures.getLength() > 0) {
        copiedFeature = selectedFeatures.item(0);
        currentOperation = 'copy';
        alert('Kopyalamak istediğiniz noktaya tıklayın.');
    } else {
        alert('Kopyalanacak poligon seçili değil.');
    }
});

document.getElementById('move-feature').addEventListener('click', function () {
    const selectedFeatures = selectInteraction.getFeatures();
    if (selectedFeatures.getLength() > 0) {
        copiedFeature = selectedFeatures.item(0);
        currentOperation = 'move';
        alert('Taşımak istediğiniz noktaya tıklayın.');
    } else {
        alert('Taşınacak poligon seçili değil.');
    }
});

function moveFeatureWithMouse(event) {
    if (copiedFeature && moveInteractionActive) {
        const coordinate = event.coordinate;
        const geometry = copiedFeature.getGeometry();
        const coordinates = geometry.getCoordinates()[0]; 
        const deltaX = coordinate[0] - moveStartCoordinate[0];
        const deltaY = coordinate[1] - moveStartCoordinate[1];
        geometry.translate(deltaX, deltaY);
        moveStartCoordinate = coordinate;
    }
}
let movedelement = null;
map.on('click', function (event) {
    if (currentOperation && copiedFeature) {
        if (!moveInteractionActive) {
            moveStartCoordinate = event.coordinate;
            moveInteractionActive = true;

            const geometry = copiedFeature.getGeometry();
            initialFeatureCoordinate = geometry.getCoordinates()[0];

            if (currentOperation === 'copy' || currentOperation === 'move') {
                movedelement = copiedFeature;
                copiedFeature = new ol.Feature({
                    geometry: new ol.geom.Polygon([initialFeatureCoordinate]),
                });
                source.addFeature(copiedFeature);
            }

            alert('Poligonu taşıyabilirsiniz. Yerleştirmek için haritaya tekrar tıklayın.');
            map.addInteraction(snap);
            map.on('pointermove', moveFeatureWithMouse);
        } else {
            map.un('pointermove', moveFeatureWithMouse);
            if (currentOperation === 'move') {
                source.removeFeature(movedelement);
                movedelement = null;
            };                  
            moveInteractionActive = false;
            currentOperation = null;
            copiedFeature = null;
            alert('Poligon yerleştirildi.');
        }
    }
});

document.getElementById('delete-feature').addEventListener('click', function () {
    selectedFeatures = selectInteraction.getFeatures();
    if (selectedFeatures.getLength() > 0) {
        selectedFeatures.forEach(function (item) {
            source.removeFeature(item); // Özellikleri sil
        });
    }
    try {
        var selectedFeaturesDiv = document.getElementById('selected-features');
        selectedFeaturesDiv.innerHTML = '<h3>Element Özellikleri:' + '</h3><ul>';
        selectedFeatures = selectInteraction.getFeatures();
    } catch {
        selectedFeatures = [];
    }   
});
var selectedFeatures = selectInteraction.getFeatures();

selectedFeatures.on(['add', 'remove'], function () {
    var selectedFeaturesDiv = document.getElementById('selected-features');
    selectedFeaturesDiv.innerHTML = '<h3>Element Özellikleri:' + '' + '</h3><ul>';

    selectedFeatures.forEach(function (feature) {
        if (feature.getGeometry() instanceof ol.geom.Polygon) {
            const geometry = feature.getGeometry();
            const area = ol.sphere.getArea(geometry);

            var coords = geometry.getCoordinates()[0];
            var coordCount = -1;

            coords.forEach(function (coord) {
                coordCount++;
                selectedFeaturesDiv.innerHTML += '<p>Nokta ' + coordCount + ': ' + coord[0].toFixed(4) + ', ' + coord[1].toFixed(4) + '</p>';
            });

            selectedFeaturesDiv.innerHTML += '<p>Alan: ' + area.toFixed(2) + ' m²</p>';
        } else {
            selectedFeaturesDiv.innerHTML += '<p>Seçili özellik poligon değil.</p>';
        }
    });
    selectedFeaturesDiv.innerHTML += '</ul>';
});

document.getElementById('modify-feature').addEventListener('click', function () {
    map.addInteraction(modify);
    alert('Poligonun vertexlerini düzenleyebilirsiniz. Düzenleme bittikten sonra başka bir işleme geçebilirsiniz.');
});
   let undoStack = [];
   modify.on('modifystart', function(event) {
     event.features.forEach(function(feature) {
       const geomClone = feature.getGeometry().clone();
       undoStack.push({
         feature: feature,
         geometry: geomClone,
       });
     });
   });
       document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'z') {
          if (undoStack.length > 0) {
            const lastChange = undoStack.pop();
            lastChange.feature.setGeometry(lastChange.geometry);
          }
        }
      });

      // DragBox etkileşimi
var dragBox = new ol.interaction.DragBox({
    condition: ol.events.condition.platformModifierKeyOnly, // Ctrl tuşu ile etkinleştir
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: [0, 0, 255, 1]
        })
    })
});

map.addInteraction(dragBox);

dragBox.on('boxend', function() {
    var extent = dragBox.getGeometry().getExtent();
    var features = [];
    vector.getSource().forEachFeatureIntersectingExtent(extent, function(feature) {
        if (!selectedFeatures.getArray().includes(feature)) {
            features.push(feature);
        }
    });
    selectedFeatures.extend(features);
});

dragBox.on('boxstart', function() {
    selectedFeatures = selectInteraction.getFeatures();
});






document.getElementById('measure').addEventListener('click', function () {
    if (draw) {
        map.removeInteraction(draw);
        map.removeInteraction(modify);
        addInteraction();
    }
    typeSelect.value = 'None';
    map.removeInteraction(draw);
    map.removeInteraction(modify);
    source.removeFeature(copiedFeature);     
    copiedFeature = null;
    moveInteractionActive = false;
    moveStartCoordinate = null;
    initialFeatureCoordinate = null;
    currentOperation = null;
    map.removeInteraction(o_draw);
    if (measurelist.length > 0) {
        measurelist.forEach(function (item) {
          source.removeFeature(item);
        });
      }
     measurelist = [];
    addInteraction();
    map.removeInteraction(omodify);
    addMeasureInteraction();
});



const style = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new ol.style.Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new ol.style.Circle({
    radius: 5,
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

const labelStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '14px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15,
  }),
  image: new ol.style.RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
  }),
});

const tipStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const modifyStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 5,
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
  text: new ol.style.Text({
    text: 'Değişiklik için taşıyın',
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.7)',
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15,
  }),
});

const segmentStyle = new ol.style.Style({
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    backgroundFill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
    padding: [2, 2, 2, 2],
    textBaseline: 'bottom',
    offsetY: -12,
  }),
  image: new ol.style.RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 0, 0.4)',
    }),
  }),
});

const segmentStyles = [segmentStyle];

const formatLength = function (line) {
  const length = ol.sphere.getLength(line);
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + ' km';
  } else {
    output = Math.round(length * 100) / 100 + ' m';
  }
  return output;
};

const formatArea = function (polygon) {
  const area = ol.sphere.getArea(polygon);
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + ' km\xB2';
  } else {
    output = Math.round(area * 100) / 100 + ' m\xB2';
  }
  return output;
};

//const source = new ol.source.Vector(); // Add this line

const omodify = new ol.interaction.Modify({source: source, style: modifyStyle});

function styleFunction(feature, segments, drawType, tip) {
  const styles = [];
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  let point, label, line;
  if (!drawType || drawType === type || type === 'Point') {
    styles.push(style);
    if (type === 'Polygon') {
      point = geometry.getInteriorPoint();
      label = formatArea(geometry);
      line = new ol.geom.LineString(geometry.getCoordinates()[0]);
    } else if (type === 'LineString') {
      point = new ol.geom.Point(geometry.getLastCoordinate());
      label = formatLength(geometry);
      line = geometry;
    }
  }
  if (line) {
    let count = 0;
    line.forEachSegment(function (a, b) {
      const segment = new ol.geom.LineString([a, b]);
      const label = formatLength(segment);
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new ol.geom.Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  if (
    tip &&
    type === 'Point' &&
    !omodify.getOverlay().getSource().getFeatures().length
  ) {
    tipPoint = geometry;
    tipStyle.getText().setText(tip);
    styles.push(tipStyle);
  }
  return styles;
}

const dvector = new ol.layer.Vector({
  source: source,
  style: function (feature) {
    return styleFunction(feature, showSegments.checked);
  },
});

map.addLayer(dvector);  // Add the measure layer to the map

map.addInteraction(omodify);


function addMeasureInteraction() {
    typeSelect.value = 'None';
    map.removeInteraction(draw);
    map.removeInteraction(modify);
    addInteraction();
  const drawType = 'LineString';
  const activeTip =
    'Ölçmeye devam etmek için tıklayın ' 
      const idleTip = 'Ölçmeye başlamak için tıklayın';
  let tip = idleTip;
  o_draw = new ol.interaction.Draw({
    source: source,
    type: drawType,
    style: function (feature) {
      return styleFunction(feature, showSegments.checked, drawType, tip);
    },
  });
  o_draw.on('drawstart', function () {
      if (measurelist.length > 0) {
        measurelist.forEach(function (item) {
          source.removeFeature(item);
        });
      }
      measurelist = [];
    omodify.setActive(false);
    tip = activeTip;
  });
  o_draw.on('drawend', function (event) {
    measurelist.push(event.feature);
    modifyStyle.setGeometry(tipPoint);
    omodify.setActive(true);
    map.once('pointermove', function () {
      modifyStyle.setGeometry();
    });
    tip = idleTip;
    map.removeInteraction(o_draw);
  });
  omodify.setActive(true);
  map.addInteraction(o_draw);
}

atypeSelect.onchange = function () {
    map.removeInteraction(draw);
    map.removeInteraction(o_draw);
    map.removeInteraction(omodify);
    addInteraction();
    if (measurelist.length > 0) {
        measurelist.forEach(function (item) {
          source.removeFeature(item);
        });
      }
     measurelist = [];   
     map.removeInteraction(o_draw);
     map.removeInteraction(omodify);
  addMeasureInteraction();
};

addMeasureInteraction();

showSegments.onchange = function () {
  dvector.changed();
  o_draw.getOverlay().changed();
};
map.removeInteraction(o_draw);
map.removeInteraction(omodify);