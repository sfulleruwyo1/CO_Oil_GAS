import React, {Component} from 'react';
import L from 'leaflet';
// postCSS import of Leaflet's CSS
import 'leaflet/dist/leaflet.css';
// using webpack json loader we can import our geojson file like this
import geojson from 'json!../data/elevation.json';
import chromaJs from 'chroma-js';
const turf = require('@turf/turf');
import $ from 'jquery';



// store the map configuration properties in an object,
// we could also move this to a separate file & import it if desired.
let config = {};
config.params = {
  center: [39.618963197219145, -106.5648937225342],
  zoomControl: false,
  zoom: 17,
  maxZoom: 22,
  minZoom: 11,
  scrollwheel: false,
  legends: true,
  infoControl: false,
  attributionControl: true
};
config.tileLayer = {
  uri: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  params: {
    minZoom: 11,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    id: '',
    accessToken: ''
  }
};


class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: null,
      tileLayer: null,
      geojsonLayer: null,
      geojson: null,
      lines: null
    };
    this._mapNode = null;

  }

  componentDidMount() {
    // code to run just after the component "mounts" / DOM elements are created
    // we could make an AJAX request for the GeoJSON data here if it wasn't stored locally
    this.getData();
    // create the Leaflet map object
    if (!this.state.map) this.init(this._mapNode);
  }

  componentDidUpdate(prevProps, prevState) {
    // code to run when the component receives new props or state
    // check to see if geojson is stored, map is created, and geojson overlay needs to be added
    if (this.state.geojson && this.state.map && !this.state.lines) {
      // add the geojson overlay
      const counts = [];

            // loop through the feature data
            this.state.geojson.features.forEach(function (feature) {
                if (feature.properties.elevation) {
                    counts.push(feature.properties.elevation);
                }
            });

            this.drawMap(this.state.geojson, counts)
    }

    
  }

  componentWillUnmount() {
    // code to run just before unmounting the component
    // this destroys the Leaflet map object & related event listeners
    this.state.map.remove();
  }

  getData() {
    // could also be an AJAX request that results in setting state with the geojson data
    // for simplicity sake we are just importing the geojson data using webpack's json loader
    this.setState({numEntrances: geojson.features.length, geojson});
  }

  drawMap(data, counts) {

    // use chroma.limits to determine
    let breaks = chromaJs.limits(counts, 'e', 9);
    // build a colorize function
    const colorize = chromaJs
        .scale('OrRd')
        .domain(breaks)
        .mode('lch')
        .correctLightness();

    // map options
    var options = {
        // style the hexagons
        style: function (feature) {
            return {
                color: colorize(feature.properties.elevation),
                weight: 3
            }
        },
        onEachFeature: function (feature, layer) {
            // attach a tooltip to each
            let elevFeet;
            elevFeet = Math.round((feature.properties.elevation * 3.28084) / 10) * 10;
            layer.bindTooltip("<strong>Elevation: </strong>" + elevFeet + ' Ft');
        }
    };

    let isolines = turf.isolines(data, breaks, {
        zProperty: 'elevation'
    });

    this.drawLegend(breaks, colorize)

    // create the Leaflet map using the hexgrid geojson data
    const lines = L.geoJson(isolines, options);
    lines.addTo(this.state.map);
    this.setState({lines});

}

drawLegend(breaks, colorize) {
  breaks.forEach(function (data) {
      let color = colorize(data);
      data = Math.round((data * 3.28084) / 10) * 10;

      $("#legend ul").append(`<li><span style="background:${color}"></span>${data} Ft</li>`)

  })
}


  init(id) {
    if (this.state.map) return;
    // this function creates the Leaflet map object and is called after the Map component mounts
    let map = L.map(id, config.params);
    L.control.zoom({
      position: "bottomleft"
    }).addTo(map);
    //L.control.scale({ position: "bottomleft"}).addTo(map);
    map.on('click', function (e) {
      console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
    });

    let title = L.control({
      position: 'topleft'
    });

    // when added to the map
    title.onAdd = function (map) {
      // select an existing DOM element with an id of "ui-controls"
      title = L.DomUtil.get("title");
      // disable click events while using controls
      L.DomEvent.disableClickPropagation(title);
      L.DomEvent.disableScrollPropagation(title);
      // return the slider from the onAdd method
      return title;
    }

    // add the control to the map
    title.addTo(map);

    let legend = L.control({
      position: 'bottomright'
    });

    // when added to the map
    legend.onAdd = function () {
      // select an existing DOM element with an id of "ui-controls"
      legend = L.DomUtil.get("legend");
      // disable click events while using controls
      L.DomEvent.disableClickPropagation(legend);
      L.DomEvent.disableScrollPropagation(legend);
      // return the slider from the onAdd method
      return legend;
    }

    // add the control to the map
    legend.addTo(map);

    // a TileLayer is used as the "basemap"
    const tileLayer = L.tileLayer(config.tileLayer.uri, config.tileLayer.params).addTo(map);

    // set our state to include the tile layer
    this.setState({
      map,
      tileLayer
    });
  }

  render() {
    //const {} = this.state;
    return ( <div id="mapUI" > {}

      } 
      <div ref = {(node) => this._mapNode = node}id="map" / >
      </div>
    );
  }
}

export default Map;