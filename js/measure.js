import { map } from './main.js';
import { source } from './main.js';
import { vector } from './main.js';
var draw;
var sketch;
var measureTooltipElement;
var measureTooltip;

var measureStartButton = document.getElementById('measure-feature');

var vector = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 2,
        }),
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: '#ffcc33',
            }),
        }),
    }),
});

map.addLayer(vector);

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line geometry.
 * @return {string} The formatted length.
 */
var formatLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 1000) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });
    map.addOverlay(measureTooltip);
}

/**
 * Handle pointer move event.
 * @param {ol.MapBrowserEvent} evt The event.
 */
var pointerMoveHandler = function (evt) {
    if (sketch) {
        var output;
        var geom = sketch.getGeometry();
        if (geom instanceof ol.geom.Polygon) {
            output = formatArea(geom);
        } else if (geom instanceof ol.geom.LineString) {
            output = formatLength(geom);
        }
        measureTooltipElement.innerHTML = output;
        measureTooltip.setPosition(evt.coordinate);
    }
};

/**
 * Function to add interaction for measuring length or area.
 */
function addMeasureInteraction() {
    var type = (typeSelect.value == 'Polygon') ? 'Polygon' : 'LineString';
    draw = new ol.interaction.Draw({
        source: measureLayer.getSource(),
        type: type,
    });
    map.addInteraction(draw);
    createMeasureTooltip();

    draw.on('drawstart', function (evt) {
        sketch = evt.feature;
    });

    draw.on('drawend', function () {
        measureTooltipElement.className = 'tooltip tooltip-static';
        measureTooltip.setOffset([0, -7]);
        sketch = null;
        measureTooltipElement = null;
        createMeasureTooltip();
    });

    map.on('pointermove', pointerMoveHandler);
}

/**
 * Clear the measure tooltip and sketch.
 */
function clearMeasureElements() {
    if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    if (measureTooltip) {
        map.removeOverlay(measureTooltip);
    }
    measureTooltipElement = null;
    measureTooltip = null;

    measureLayer.getSource().clear(); // Clear measure features
}

/**
 * Handle right-click to finish measure
 */
map.getViewport().addEventListener('contextmenu', function (event) {
    event.preventDefault();
    clearMeasureElements();
});

/**
 * Handle change event of draw type select input
 */
typeSelect.onchange = function () {
    clearMeasureElements();
};

measureStartButton.addEventListener('click', function () {
    clearMeasureElements(); // Clear any existing measures
    addMeasureInteraction();
});
