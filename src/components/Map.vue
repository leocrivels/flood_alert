<template>
  <GmapMap
    :key="mapKey"
    ref="map"
    fullscreen
    :center="center"
    map-type-id="terrain"
    style="height: 100%; width: 100%"
    dark
    :options="{
      streetViewControl: false,
      zoomControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
    }"
  >
    <template v-for="(floodArea, j) in floodAreasArray">
      <template v-for="(area, i) in floodArea">
        <GmapPolygon
          :key="'area-' + i + 'flood' + j"
          :path="area"
          :options="{
            fillColor: 'blue',
            strokeOpacity: 0,
          }"
        />
      </template>
    </template>

    <GmapMarker :position="center" />
    <template
      v-for="(marker, i) in Object.values(markers)"
      style="max-width: 300px"
    >
      <gmap-custom-marker
        :marker="marker.coord"
        :key="'marker' + i"
        @click.native="markerClicked(marker)"
      >
        <img :src="getMarkerIcon(marker)" />
      </gmap-custom-marker>
    </template>

    <v-dialog
      v-model="infoDialogBool"
      style="max-width: 100%; overflow-x: hidden"
      width="280"
      height="300"
      hide-overlay
    >
      <v-card>
        <v-img
          class="white--text align-end"
          height="144"
          width="260"
          :src="actualMarker.image"
        ></v-img>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showGraphBool"
      style="max-width: 100%; overflow-x: hidden"
    >
      <v-card style="max-width: 100%; overflow-x: hidden">
        <v-tabs v-model="tab" background-color="primary" dark>
          <v-tab> About </v-tab>
          <v-tab> R. Section </v-tab>
          <v-tab> W. Level/Time </v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <v-card v-if="$vuetify.breakpoint.mdAndUp" class="pa-2">
              <div class="d-flex">
                <v-col cols="6">
                  <v-img class="white--text" :src="actualMarker.image"></v-img>
                </v-col>
                <v-col cols="6">
                  <div>
                    <v-card-title
                      class="headline"
                      v-text="actualMarker.description"
                    ></v-card-title>

                    <v-card-subtitle>
                      <p>
                        <strong>Description:</strong>
                        {{ actualMarker.description }}
                      </p></v-card-subtitle
                    >
                    <v-card-subtitle>
                      <p>
                        <strong>Threshold:</strong> {{ actualMarker.limit }} m
                      </p></v-card-subtitle
                    >
                    <v-card-subtitle>
                      <p>
                        <strong>Water Level:</strong>
                        {{ parseFloat(actualMarkerState.height).toFixed(2) }}m
                      </p></v-card-subtitle
                    >
                    <v-card-subtitle>
                      <p>
                        <strong>Situation:</strong>
                        {{ actualMarkerState.label }}
                      </p></v-card-subtitle
                    >
                  </div>
                </v-col>
              </div>
            </v-card>
            <v-card v-if="$vuetify.breakpoint.smAndDown">
              <div class="d-flex">
                <v-col cols="12">
                  <v-img class="white--text" :src="actualMarker.image"></v-img>
                  <div class="mt-3">
                    <v-card-subtitle>
                      <p>
                        <strong>Description:</strong>
                        {{ actualMarker.description }}
                      </p></v-card-subtitle
                    >
                    <v-card-subtitle>
                      <p>
                        <strong>Threshold:</strong> {{ actualMarker.limit }} m
                      </p></v-card-subtitle
                    >
                    <v-card-subtitle>
                      <p>
                        <strong>Water Level:</strong>
                        {{ parseFloat(actualMarkerState.height).toFixed(2) }} m
                      </p></v-card-subtitle
                    >
                    <v-card-subtitle>
                      <p>
                        <strong>Situation:</strong>
                        {{ actualMarkerState.label }}
                      </p></v-card-subtitle
                    >
                  </div>
                </v-col>
              </div>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <v-row
                :justify="$vuetify.breakpoint.mdAndUp ? 'center' : 'left'"
                :class="$vuetify.breakpoint.mdAndUp ? '' : 'pl-2'"
              >
                <GChart
                  class="align-center"
                  type="AreaChart"
                  :data="channelChartData"
                  :options="channelChartOptions"
                />
              </v-row>

              <v-row justify="center" align="center">
                <v-chip class="ma-2" :color="clockChipColor" text-color="black">
                  <v-icon left>{{ clockChipIcon }}</v-icon>
                  {{ sliderLabels[slider] }}
                </v-chip>
                <v-chip outlined>{{ clockChipLabel }} </v-chip>
              </v-row>
              <v-slider
                v-model="slider"
                class="align-center mx-4 pb-4"
                :max="sliderMax"
                min="0"
                hide-details
                @input="updateGraph()"
              >
              </v-slider>
            </v-card>
          </v-tab-item>
          <v-tab-item>
            <v-card flat>
              <v-container wrap>
                <v-layout wrap>
                  <v-row
                    :justify="$vuetify.breakpoint.mdAndUp ? 'center' : 'left'"
                    :class="$vuetify.breakpoint.mdAndUp ? '' : 'pl-0'"
                  >
                    <GChart
                      class="align-left mx-0"
                      type="LineChart"
                      :data="timeChartData"
                      :options="timeChartOptions"
                    />
                  </v-row>
                  <v-row>
                    <v-col cols="3" sm="3" class="pa-1">
                      <v-chip color="green" small> Safe </v-chip>
                    </v-col>
                    <v-col cols="9" sm="8" class="pa-1">
                      <p style="font-size: 13px">
                        <strong
                          >The limit where the water is at a safe level</strong
                        >
                      </p>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="3" sm="3" class="pa-1" center>
                      <v-chip small color="red"> warning </v-chip>
                    </v-col>
                    <v-col cols="9" sm="8" class="pa-1">
                      <p style="font-size: 13px">
                        <strong
                          >When the water level is higher then the
                          Threshold</strong
                        >
                      </p>
                    </v-col>
                  </v-row>
                </v-layout>
              </v-container>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="aboutDialog"
      fullscreen
      style="max-width: 100%; overflow-x: hidden; backgroud: #ffffff"
    >
      <v-card :height="screenHeight - 100">
        <v-layout
          style="max-width: 100%; overflow-x: hidden; backgroud: #ffffff"
          fluid
          fullscreen
          row
          align-end
          justify-center
          fill-height
        >
          <v-toolbar dark color="primary">
            <v-btn icon dark @click="aboutDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>About the app</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <v-layout row align-end justify-center fill-height>
            <v-flex xs12 sm12 md12 lg12 xg12>
              <v-img :src="logo_app"></v-img>
            </v-flex>
            <v-flex class="about-text about-center py-4 px-4">
              <div
                v-if="$vuetify.breakpoint.xsOnly"
                class="text-xs-center subheading"
              >
                <p>
                  This app was developed by the joined efforts of Federal
                  University of Mato Grosso do Sul (UFMS) and Hydrology and
                  Water Security Research Group (HWS).
                </p>
                <p>
                  The study was supported by grants from the Ministry of
                  Science, Technology, Innovation and Communication – MCTIC and
                  National Council for Scientific and Technological Development
                  – CNPq (grants 441289/2017-7 and 306830/2017-5) and
                  Coordenação de Aperfeiçoamento de Pessoal de Nível Superior -
                  Brasil – CAPES (Finance Code 001 and Capes PrInt).
                </p>
              </div>
              <div
                v-if="$vuetify.breakpoint.smAndUp"
                class="text-xs-center headline"
              >
                <p>
                  This app was developed by the joined efforts of Federal
                  University of Mato Grosso do Sul (UFMS) and Hydrology and
                  Water Security Research Group (HWS).
                </p>
                <p>
                  The study was supported by grants from the Ministry of
                  Science, Technology, Innovation and Communication – MCTIC and
                  National Council for Scientific and Technological Development
                  – CNPq (grants 441289/2017-7 and 306830/2017-5) and
                  Coordenação de Aperfeiçoamento de Pessoal de Nível Superior -
                  Brasil – CAPES (Finance Code 001 and Capes PrInt).
                </p>
              </div>

              <p
                v-if="$vuetify.breakpoint.xsOnly"
                class="body-2 text-xs-center mt-4 white--text"
                style="text-decoration: underline"
              >
                Version: Alpha-0.1
              </p>
              <p
                v-if="$vuetify.breakpoint.smAndUp"
                class="body-1 text-xs-center mt-4 white--text"
                style="text-decoration: underline"
              >
                Version: Alpha-0.1
              </p>
            </v-flex>
            <v-flex xs6 sm6 md6 lg6 xg6 class="pl-6 pr-1 pb-12 mb-10">
              <v-img :src="logo_ufms"></v-img>
            </v-flex>
            <v-flex xs6 sm6 md6 lg6 xg6 class="pl-1 pr-6 pb-12 mb-10">
              <v-img :src="logo_hws"></v-img>
            </v-flex>
          </v-layout>
        </v-layout>
      </v-card>
    </v-dialog>

    <template v-if="loadButton">
      <v-row>
        <v-col cols="9">
          <v-select
            v-model="selectedDate"
            :items="simulationDatesAvailable"
            label="Data"
            dense
            solo
            background-color="white"
            height="4"
            class="ma-2"
            @change="changeSelectedDate()"
          ></v-select>
        </v-col>
        <v-speed-dial
          style="position: absolute"
          v-model="fab"
          large
          top
          right
          direction="bottom"
          transition="slide-y-reverse-transition"
        >
          <template v-slot:activator>
            <v-btn v-model="fab" color="blue darken-2" dark fab>
              <v-icon v-if="fab">mdi-close</v-icon>
              <v-icon v-else>menu</v-icon>
            </v-btn>
          </template>
          <v-btn fab dark small color="green" @click="aboutDialog = true">
            <v-icon>info</v-icon>
          </v-btn>
        </v-speed-dial>
      </v-row>
    </template>
  </GmapMap>
</template>

<style>
.vue-map-hidden {
  display: contents;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0px;
  left: 0px;
}

.bg-image {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gm-style .gm-style-iw-c {
  width: 300px;
  max-width: 300px;
}
.gm-style .gm-style-iw {
  min-width: 300px;
}
.about-center {
  width: 90%;
  margin: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

.wrapper {
  height: 100%;
}

.about-text {
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
}
</style>

<script>
import { gmapApi } from "vue2-google-maps";
import { db } from "../utils/db";
import { GChart } from "vue-google-charts";
import GmapCustomMarker from "vue2-gmap-custom-marker";
import logo_ufms from "../assets/logo_ufms.jpg";
import logo_hws from "../assets/hws-ufms.png";
import logo_app from "../assets/logo_app.png";
import BackgroundImage from "../assets/bg_screen.png";
const polygons_table = "polygons_table_name";
const markers_table = "markers_tables_name";
export default {
  components: {
    GChart,
    "gmap-custom-marker": GmapCustomMarker,
  },
  computed: {
    google: gmapApi,
  },
  firebase: {
    polygons: db.ref(polygons_table),
  },
  mounted() {
    if (localStorage.getItem("floodSurfaces"))
      this.floodSurfaces = JSON.parse(localStorage.getItem("floodSurfaces"));
    if (localStorage.getItem("lastUpdate"))
      this.lastUpdate = JSON.parse(localStorage.getItem("lastUpdate"));
    if (localStorage.getItem("markers"))
      this.markers = JSON.parse(localStorage.getItem("markers"));

    db.ref(polygons_table).once("value", (snapshot) => {
      const documents = snapshot.val();
      for (const itemID in documents) {
        db.ref(polygons_table+'/' + itemID).once("value", (snapshot) => {
          const document = snapshot.val();
          if (document.properties.created > this.lastUpdate) {
            const surface = { id: itemID, properties: document.properties };
            this.floodSurfaces.push(surface);
            this.lastUpdate = document.properties.created;
          }
        });
      }
    });

    db.ref(markers_table).once("value", (snapshot) => {
      const documents = snapshot.val();
      this.markers = documents;
    });

    var min = 0;
    var max = 99999999;
    var selected = 0;
    var selectedSurfaces = [];

    for (const surface of this.floodSurfaces) {
      var ts = new Date(surface.properties.timestamp);
      if (ts >= min && ts < Date.now() && selected == 0) {
        if (ts == min) {
          selectedSurfaces.push(surface);
        } else {
          selectedSurfaces = [];
          selectedSurfaces.push(surface);
        }
        min = ts;
      } else if (ts >= Date.now() && ts <= max) {
        if (ts == max || selected == 0) {
          selectedSurfaces.push(surface);
        } else {
          selectedSurfaces = [];
          selectedSurfaces.push(surface);
        }
        max = ts;
        selected = ts;
      }
      this.simulationDatesAvailable.push(ts.toLocaleString());
    }

    if (selected == 0) {
      this.selectedDate = min.toLocaleString();
    } else {
      this.selectedDate = selected.toLocaleString();
    }
    this.changeSelectedDate(this.selectedDate);

    for (const surface of selectedSurfaces) {
      this.getPolyCoordinates(surface);
    }

    this.geolocate();
    this.loadButton = true;
  },
  updated() {
    setInterval(this.geolocate(), 1800000);
  },
  data: () => ({
    backgroundImage: BackgroundImage,
    screenHeight: window.innerHeight,
    logo_hws: logo_hws,
    logo_ufms: logo_ufms,
    logo_app: logo_app,
    selectedDate: "",
    selectedTimestamp: 0,
    dateObjSelected: {},
    sliderMax: 0,
    sliderLabels: [],
    actualMarker: {},
    lastUpdate: 0,
    actualMarkerState: {},
    slider: 0,
    clockChipColor: "green",
    clockChipIcon: "done_outline",
    clockChipLabel: "Safe",
    tab: null,
    zoom: 15,
    showGraphBool: 0,
    infoDialogBool: 0,
    aboutDialog: false,
    timeChartData: [],
    channelChartData: [],
    channelChartOptions: {
      vAxis: {
        title: "Water Level (m)",
        titleTextStyle: { bold: true, fontSize: "14" },
      },
      hAxis: {
        title: "Width (m)",
        titleTextStyle: { bold: true, fontSize: "14" },
      },
      legend: { position: "top", textStyle: { bold: true, fontSize: "12" } },
      height: 350,
      width: 350,
      isStacked: true,
      forceIFrame: true,
      series: [
        { color: "black", lineWidth: 1 },
        { color: "blue", lineWidth: 0 },
      ],
    },
    timeChartOptions: {
      chart: {
        title: "Time x Water Level",
      },
      curveType: "function",
      crosshair: {
        color: "#000",
        trigger: "selection",
      },
      forceIFrame: true,
      vAxis: {
        title: "Water Level (m)",
        titleTextStyle: { bold: true, fontSize: "14" },
      },
      hAxis: {
        title: "Hour (h)",
        titleTextStyle: { bold: true, fontSize: "14" },
      },
      legend: {
        position: "top",
        textStyle: { bold: true, fontSize: "12" },
        maxLines: "2",
      },
      series: {
        0: {
          visibleInLegend: false,
          // Set any applicable options on the first series
        },
        1: {
          // Set the options on the second series
          color: "black",
          lineWidth: 1,
          lineDashStyle: [4, 2, 4],
          pointSize: 3,
          visibleInLegend: true,
        },
        2: {
          // Set the options on the second series
          color: "green",
          lineWidth: 2,
          pointSize: 0,
          visibleInLegend: true,
        },
        3: {
          // Set the options on the second series
          color: "red",
          lineWidth: 2,
          pointSize: 0,
          visibleInLegend: true,
        },
      },
    },
    mapKey: 0,
    polygons: [],
    simulationDatesAvailable: [],
    floodSurfaces: [],
    loadButton: false,
    fab: false,
    center: { lat: -20.50327, lng: -54.609691 },
    marker: { lat: -20.45495, lng: -54.582083 },
    markers: {},
    floodAreasArray: [],
    floodAreas: [],
  }),
  watch: {
    floodSurfaces: {
      handler() {
        localStorage.setItem(
          "floodSurfaces",
          JSON.stringify(this.floodSurfaces)
        );
      },
      deep: true,
    },
    markers: {
      handler() {
        localStorage.setItem("markers", JSON.stringify(this.markers));
      },
      deep: true,
    },
    lastUpdate: {
      handler() {
        localStorage.setItem("lastUpdate", JSON.stringify(this.lastUpdate));
      },
      deep: true,
    },
  },
  methods: {
    // Set the chosen simulation date on the picker and get it from firebase
    changeSelectedDate: function () {
      this.floodAreasArray = [];
      var dateAndTime = this.selectedDate.split(" ");
      var date = dateAndTime[0].split("/");
      var time = dateAndTime[1].split(":");

      this.dateObjSelected = {
        year: date[2],
        month: parseInt(date[1]) - 1,
        day: date[0],
        hour: time[0],
        minutes: time[1],
        seconds: time[2],
      };
      this.selectedTimestamp = new Date(
        date[2],
        parseInt(date[1]) - 1,
        date[0],
        time[0],
        time[1],
        time[2]
      ).getTime();

      var selectedSurfaces = [];
      for (const surface of this.floodSurfaces) {
        var ts = surface.properties.timestamp;

        if (parseInt(ts) == parseInt(this.selectedTimestamp)) {
          selectedSurfaces.push(surface);
        }
      }

      for (const surface of selectedSurfaces) {
        db.ref(polygons_table+'/' + surface.id).once("value", (snapshot) => {
          const document = snapshot.val();
          this.getPolyCoordinates(document);
        });
      }
    },
    // Convert date string to object
    getDateObj: function (dateString) {
      var dateAndTime = dateString.split(" ");
      var date = dateAndTime[0].split("/");
      var time = dateAndTime[1].split(":");
      return {
        year: date[2],
        month: parseInt(date[1]) - 1,
        day: date[0],
        hour: time[0],
        minutes: time[1],
        seconds: time[2],
      };
    },

    findTimestampIndex: function (array, value) {
      const position = array.findIndex(function (object) {
        return object.timestamp === value;
      });
      return position;
    },
    // Creates graphs of the marker info
    showGraphs: function () {
      var dateObjSelected = this.dateObjSelected;
      this.sliderLabels = [];

      var hourselected = parseFloat(dateObjSelected.hour);
      var daySelectedTimestamp = new Date(
        dateObjSelected.year,
        dateObjSelected.month,
        dateObjSelected.day,
        0,
        0,
        0
      ).getTime();

      this.slider = hourselected;
      var marker = this.actualMarker;
      var timeChartData = [["Hour", "Depth", "S. Time", "Safe", "Warning"]];

      var channelChartData = [["Calha X", "Channel", "Water"]];

      for (const depth of marker.depths) {
        if (
          depth.timestamp >= daySelectedTimestamp &&
          depth.timestamp < daySelectedTimestamp + 86400000
        ) {
          var ts = new Date(parseInt(depth.timestamp));
          var time = this.getDateObj(ts.toLocaleString());
          var newData;
          if (depth.timestamp == this.selectedTimestamp) {
            timeChartData.push([
              parseInt(time.hour) + time.minutes / 60,
              parseFloat(depth.height),
              0,
              marker.limit - 0.5,
              marker.limit,
            ]);
            newData = [
              parseInt(time.hour) + time.minutes / 60,
              parseFloat(depth.height),
              parseFloat(depth.height),
              marker.limit - 0.5,
              marker.limit,
            ];
          } else {
            newData = [
              parseInt(time.hour) + time.minutes / 60,
              parseFloat(depth.height),
              null,
              marker.limit - 0.5,
              marker.limit,
            ];
          }
          timeChartData.push(newData);
          if (time.hour == hourselected) this.slider = this.sliderLabels.length;
          this.sliderLabels.push(time.hour + ":" + time.minutes);
        }
      }
      this.sliderMax = this.sliderLabels.length - 1;

      for (const arrayXY of marker.graphArray) {
        var timeSelectedSlider = this.sliderLabels[this.slider].split(":");
        var timestampSliderSelected = new Date(
          dateObjSelected.year,
          dateObjSelected.month,
          dateObjSelected.day,
          timeSelectedSlider[0],
          timeSelectedSlider[1],
          0
        ).getTime();
        var xy = arrayXY.slice();

        var depth = marker.depths.find((obj) => {
          return parseInt(obj.timestamp) === parseInt(timestampSliderSelected);
        });
        parseFloat(depth.height) - xy[1] > 0
          ? xy.push(parseFloat(depth.height) - xy[1])
          : xy.push(0);
        channelChartData.push(xy);
      }
      this.changeClockChipColor(timestampSliderSelected);

      this.timeChartData = timeChartData;
      if (this.$vuetify.breakpoint.lgAndUp) {
        this.timeChartOptions.height = 700;
        this.timeChartOptions.width = 850;
        this.channelChartOptions.height = 700;
        this.channelChartOptions.width = 800;
      } else if (this.$vuetify.breakpoint.mdOnly) {
        this.timeChartOptions.height = 500;
        this.timeChartOptions.width = 650;
        this.channelChartOptions.height = 500;
        this.channelChartOptions.width = 600;
      } else if (this.$vuetify.breakpoint.smAndDown) {
        this.timeChartOptions.height = 300;
        this.timeChartOptions.width = 400;
        this.channelChartOptions.height = 300;
        this.channelChartOptions.width = 350;
      }

      this.channelChartData = channelChartData;
      this.showGraphBool = 1;
    },
    // updates the channel form graph with new water level when using the slider
    updateGraph: function () {
      var channelChartData = [["Calha X", "Channel", "Water"]];
      var marker = this.actualMarker;
      var dateObjSelected = this.dateObjSelected;
      for (const arrayXY of marker.graphArray) {
        var timeSelectedSlider = this.sliderLabels[this.slider].split(":");
        var timestampSliderSelected = new Date(
          dateObjSelected.year,
          dateObjSelected.month,
          dateObjSelected.day,
          timeSelectedSlider[0],
          timeSelectedSlider[1],
          0
        ).getTime();
        var xy = arrayXY.slice();

        var depth = marker.depths.find((obj) => {
          return parseInt(obj.timestamp) === parseInt(timestampSliderSelected);
        });

        parseFloat(depth.height) - xy[1] > 0
          ? xy.push(parseFloat(depth.height) - xy[1])
          : xy.push(0);
        channelChartData.push(xy);
      }
      this.changeClockChipColor(timestampSliderSelected);

      this.channelChartData = channelChartData;
    },
    // Change the color, icon and label of the chip in the slider
    // according to the level state
    changeClockChipColor: function (timestamp) {
      var state = this.checkLevelState(this.actualMarker, timestamp);
      this.clockChipColor = state.color;
      this.clockChipIcon = state.icon;
      this.clockChipLabel = state.label;
    },
    // Check the level state in a marker
    checkLevelState: function (marker, timestamp) {
      var state = {
        label: "",
        icon: "",
        color: "",
        height: 0,
      };
      var depth = marker.depths.find((obj) => {
        return parseInt(obj.timestamp) === parseInt(timestamp);
      });
      if (!depth) {
        state.color = "blue";
        state.icon = "warning";
        state.label = "No Information";
        state.height = 0;
        return state;
      }
      if (depth.height > marker.limit) {
        state.color = "red";
        state.icon = "warning";
        state.label = "Danger";
        state.height = depth.height;
      } else if (
        depth.height <= marker.limit &&
        depth.height >= marker.limit - 0.5
      ) {
        state.color = "yellow";
        state.icon = "error_outline";
        state.label = "Warning";
        state.height = depth.height;
      } else if (depth.height < marker.limit - 0.5) {
        state.color = "green";
        state.icon = "done_outline";
        state.label = "Safe";
        state.height = depth.height;
      }
      return state;
    },
    // Get the marker icon url according to its level state
    getMarkerIcon: function (marker) {
      var state = this.checkLevelState(marker, this.selectedTimestamp);
      var color = state.color;
      return "http://maps.google.com/mapfiles/ms/icons/" + color + "-dot.png";
    },
    // Updates the user location
    geolocate: function () {
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      });
    },
    // Get the polygon vertices coordinates
    getPolyCoordinates(floodSurfaces) {
      var coordsArray;
      var item;
      var item2;
      var floodAreas = [];

      for (coordsArray in floodSurfaces.geometries) {
        for (item in floodSurfaces.geometries[coordsArray].coordinates) {
          var geometries = [];
          for (item2 in floodSurfaces.geometries[coordsArray].coordinates[
            item
          ]) {
            geometries.push({
              lng:
                floodSurfaces.geometries[coordsArray].coordinates[item][
                  item2
                ][0],
              lat:
                floodSurfaces.geometries[coordsArray].coordinates[item][
                  item2
                ][1],
            });
          }
          floodAreas.push(geometries);
        }
      }
      this.floodAreasArray.push(floodAreas);
    },
    // Changes the selected marker
    markerClicked: function (marker) {
      this.actualMarker = marker;
      this.actualMarkerState = this.checkLevelState(
        marker,
        this.selectedTimestamp
      );
      this.showGraphs();
    },
  },
};
</script>