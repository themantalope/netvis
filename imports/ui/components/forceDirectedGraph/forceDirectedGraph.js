/**
 * Created by antalek on 7/12/16.
 */
import angular from 'angular';
import angularMeteor from 'angular-meteor';
import { Meteor } from 'meteor/meteor';
import template from './forceDirectedGraph.html';
import { Networks } from "../../../api/networks";
import uiRouter from 'angular-ui-router';
import {MultiGraphJSONLoader} from "../../../models/components/multiGraphJSONLoader/multiGraphJSONLoader";
import {name as NetworkUpload } from "../networkUpload/networkUpload";
import { name as Graph } from "../../../models/components/graph/graph";


class ForceDirectedGraph{
    constructor($reactive, $scope, $interval){
        "ngInject";

        $reactive(this).attach($scope);

        this.subscribe("networks");
        this.loadedGraphs = false;

        $scope.loadedGraphs = this.loadedGraphs;

        this.helpers({
            networks(){
                return Networks.find({}, {fields: {name:1, url:1}});
            }
        });

        $scope.networks = this.networks;
        this.selectedNetFile = undefined;
        this.selectedNetworkLabel = undefined;
        this.selectedNetworkIndex = undefined;
        this.selectedGraph = undefined;

    }

    loadNetwork(){
      if (this.networks.length > 0){
        if(typeof(this.selectedNetFile) != "undefined"){
          var theneturl = this.selectedNetFile.url;

          console.log("here is theneturl: ", theneturl);

          this.graphLoader = new MultiGraphJSONLoader(theneturl);

          var weakme = this;

          this.graphLoader.loadJSON(function (multigraph) {

              weakme.multiGraph = multigraph;
              weakme.loadedGraphs = true;
              weakme.allGraphs = weakme.multiGraph.getAllGraphs();
          });
        }
      }
    }

    setSelectedGraphIndex(){
      if (typeof(this.selectedNetworkIndex) != "undefined" && typeof(this.multiGraph) != "undefined") {
        this.selectedNetworkIndex = this.multiGraph.getGraphIndexForLabel(this.selectedNetworkLabel);
        console.log("this.selectedNetworkLabel: ", this.selectedNetworkLabel);
        console.log("this.selectedNetworkIndex: ", this.selectedNetworkIndex);
      }
    }

    setGraph(){
      if (typeof(this.selectedGraph) !== "undefined"){
        this.graph = null;
        this.graph = this.selectedGraph;
        if (typeof(this.searchedGene) === "string") {
          this.searchedGene = null;
        }
      }
    }


    setSearchedGene(text) {
      if(typeof(text) === "string") {
        this.searchedGene = text;
      }
    }


}


const name = "forceDirectedGraph";

//create a module
export default angular.module(name, [
    angularMeteor,
    NetworkUpload,
    uiRouter
]).directive(name, function () {
    //constants
    var opwidth = 960;
    var margin = 20;
    var opheight = 650 - margin;

    return {
        restrict: "E",
        template: template,
        controller: ForceDirectedGraph,
        controllerAs: name,
        bindToController: true,
        scope: true,
        link: function (scope, element, attrs) {


            scope.$watch("forceDirectedGraph.graph", function (newval, oldval) {
              if(typeof(newval) !== "undefined" && newval !== oldval){
                updateLayout();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedNetworkLabel", function(newval, oldval) {
              if (typeof(newval) !== "undefined" && newval !== oldval){
                console.log("new network label: ", newval);
                console.log("old network label: ", oldval);
                scope.forceDirectedGraph.setSelectedGraphIndex();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedNetworkIndex", function(newval, oldval) {
              if (typeof(newval) !== "undefined") {
                scope.forceDirectedGraph.setGraph();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedGraph", function (newval, oldval) {
              console.log("selectedGraph new: ", newval);
              console.log("selectedGraph old: ", oldval);
              if (typeof(newval) != "undefined" && newval !== oldval) {
                scope.forceDirectedGraph.setGraph();
                updateLayout();
              }
            });


            scope.$watch("forceDirectedGraph.searchedGene", function (newval, oldval) {

              if(typeof(newval) !== "undefined"){
                console.log("oldsearch: ", oldval, "newsearch: ", newval);
                console.log("oldsearch === newsearch: ", newval === oldval);
                console.log("oldsearch !== newsearch: ", newval !== oldval);
                if (newval !== oldval) {
                  console.log("here is the new searchedGene: ", newval);
                  updateLayout();
                  scope.geneSearch = null;
                }
              }
            });


            scope.$watch("forceDirectedGraph.selectedNetFile", function(newval, oldval){
              if (typeof(newval) === "string"){
                newval = JSON.parse(newval);
              }

              if(typeof(scope.forceDirectedGraph.networks) != "undefined") {
                var foundnet = false;
                for (var i = 0; i < scope.forceDirectedGraph.networks.length; i++){
                  var curnet = scope.forceDirectedGraph.networks[i];
                  if(newval._id == curnet._id) {
                    foundnet = true;
                    break;
                  }
                }

                if(foundnet) {
                  scope.forceDirectedGraph.selectedNetFile = newval;
                  scope.forceDirectedGraph.loadNetwork();
                }



              }
            }, true);

            var updateLayout = function () {

              function highlightSearchedGene(text) {


                if (text !== "" && text !== null){
                  d3.selectAll(".circle").each(function(p) {
                    var matched = p.gene === text || p.id === text;
                    d3.select(this)
                      .attr("opacity", matched ? 1.0 : 0.25);
                  });
                }
              }

              function findNeighbors(d, i) {
                var neighborArray = [d];
                var linkArray = [];
                var allLinks = d3.selectAll("line").filter(function(p) {
                  return p.source == d || p.target == d;
                }).each(function (p) {
                  neighborArray.indexOf(p.source) == -1 ? neighborArray.push(p.source) : null;
                  neighborArray.indexOf(p.target) == -1 ? neighborArray.push(p.target) : null;
                  linkArray.push(p)
                })
                return {"nodes":neighborArray, "links":linkArray}
              }

              function highlightNeigbors(d, i) {
                var nodeNeighbors = findNeighbors(d, i);

                d3.selectAll("line").each(function (p) {
                  var isNeighborLinks = nodeNeighbors.links.indexOf(p);
                  d3.select(this)
                    .style("opacity", isNeighborLinks > -1 ? 1 : 0.25)
                    .style("stroke-width", isNeighborLinks > -1 ? 2 : 1)
                    .style("stroke", isNeighborLinks > -1 ? "blue" : "#ccc");
                });


                d3.selectAll(".circle").each(function (p) {
                  var isNeighbor = nodeNeighbors.nodes.indexOf(p);
                  d3.select(this)
                    .style("opacity", isNeighbor > -1 ? 1 : 0.25)
                    .style("stroke-width", isNeighbor > -1 ? 2 : 1)
                    .style("stroke", isNeighbor > -1 ? "blue" : "white");
                });

                d3.selectAll(".circle").each(function (p) {
                  var isNeighbor = nodeNeighbors.nodes.indexOf(p);
                  if (isNeighbor > -1) {
                    d3.select(this)
                      .append("g")
                      .attr("class", "hoverLabel")
                      .append("text")
                      .attr("stroke", "white")
                      .attr("stroke-width", "5px")
                      .attr("x", p.x)
                      .attr("y", p.y)
                      .attr("dx", ".35em")
                      .attr("dy", ".35em")
                      .style("opacity", 0.9)
                      .style("pointer-events", "none")
                      .style("font-size", "10px")
                      .text(p.gene);

                    d3.select(this)
                      .append("g")
                      .attr("class", "hoverLabel")
                      .append("text")
                      .attr("class", "hoverLabel")
                      .attr("x", p.x)
                      .attr("y", p.y)
                      .attr("dx", ".35em")
                      .attr("dy", ".35em")
                      .style("stroke", "black")
                      .style("stroke-width", 1)
                      .style("font-size", "10px")
                      .text(p.gene);

                  }
                });

              }

              function nodeOver(d, i, e) {
                highlightNeigbors(d,i);
              }

              function nodeOut() {
                d3.selectAll(".hoverLabel").remove();

                d3.selectAll(".circle")
                  .style("opacity", 1)
                  .style("stroke", "none")
                  .attr("stroke", "white")
                  .attr("stroke-width", "2px");


                d3.selectAll("line")
                  .style("opacity", 0.25)
                  .style("stroke", "#ccc");

              }

              console.log("here is vis: ", vis);

              width = opwidth;
              height = opheight;


              d3.selectAll("svg").remove();

              var vis = d3.select(element[0])
                          .append("svg")
                          .attr("width", width)
                          .attr("height", height + margin + 100)
                          .attr("pointer-events", "all")
                          .call(d3.behavior.zoom().on("zoom", rescale))
                          .on("dblclick.zoom", null)
                          .append("svg:g")
                          .on("mousedown", mousedown);

            function mousedown() {
              vis.call(d3.behavior.zoom().on("zoom"), rescale);
              resize();
              return;
            }

              function rescale() {
                var trans = d3.event.translate;
                var scle = d3.event.scale;

                vis.attr("transform", "translate(" + trans + ")" + "scale(" + scle + ")");
              }

              console.log("I'm in updatedsomething");

                var colors = d3.scale.category10();

                var force = d3.layout.force()
                              .size([width, height])
                              .nodes(scope.forceDirectedGraph.graph.getNodes())
                              .links(scope.forceDirectedGraph.graph.getLinks())
                              .linkDistance([40])        // <-- New!
                              .charge([-200])
                              .friction(0.5);

                var edge = vis.selectAll("line")
                              .data(scope.forceDirectedGraph.graph.getLinks())
                              .enter()
                              .append("line")
                              .style("stroke", "#ccc")
                              .style("opacity", 0.25)
                              .style("stroke-width",function (d) {
                                  return d.weight;
                              });

                var node = vis.selectAll("svg")
                              .append("g")
                              .attr("class", "circles")
                              .data(scope.forceDirectedGraph.graph.getNodes())
                              .enter()
                              .append("g")
                              .attr("class", "circle")
                              .append("circle")
                              .style("stroke", "white")
                              .style("stroke-width", "1px")
                              .attr("r", 5)
                              .attr("opacity", 1.0)
                              .style("fill", function (d) { return colors(d.group_id)})
                              .on("mouseover", nodeOver)
                              .on("mouseout", nodeOut);


                var node_struc = scope.forceDirectedGraph.graph.getNodeStructure();
                var group_id_arr = [];
                for (var key in node_struc.groups) {
                  group_id_arr.push({"group_id":key, "group":node_struc.groups[key]})
                }

                var legend = vis.selectAll(".legend")
                                .data(group_id_arr)
                                .enter()
                                .append("g")
                                .attr("class", "legend")
                                .attr("transform", function (d,i) {return "translate(-10," + i * 20 + ")";});

                legend.append("rect")
                      .attr("x", width - 18)
                      .attr("width", 18)
                      .attr("height", 18)
                      .style("fill", function(d) {
                        return colors(d.group_id);
                      });

                legend.append("text")
                      .attr("x", width - 24)
                      .attr("y", 9)
                      .attr("dy", ".35em")
                      .style("text-anchor", "end").text(function (d) {return d.group;});

                force.on("tick", ticked);

                force.start();

                function ticked () {
                          edge.attr("x1", function (d) { return d.source.x })
                              .attr("y1", function (d) { return d.source.y })
                              .attr("x2", function (d) { return d.target.x })
                              .attr("y2", function (d) { return d.target.y });

                          node.attr("cx", function (d) { return d.x })
                              .attr("cy", function (d) { return d.y });

                d3.select(window).on("resize", resize);

                if (typeof(scope.forceDirectedGraph.searchedGene) !== "undefined") {
                  highlightSearchedGene(scope.forceDirectedGraph.searchedGene);
                } else {
                  d3.selectAll(".circle")
                    .attr("opacity", 1.0);
                }


                function resize() {

                  if (window.innerWidth < opwidth) {
                    width = window.innerWidth;
                  } else  {
                    width = opwidth;
                  }

                  if( window.innerHeight < opheight){
                    height = window.innerHeight;
                  } else {
                    height = opheight;
                  }

                  vis.attr("width", width)
                     .attr("height", height);
                  force.size([width, height]).resume();

                  d3.selectAll(".legend").remove();

                  var legend = vis.selectAll(".legend")
                                  .data(group_id_arr)
                                  .enter()
                                  .append("g")
                                  .attr("class", "legend")
                                  .attr("transform", function (d,i) {return "translate(0," + i * 20 + ")";});


                  legend.append("rect")
                        .attr("x", width - 18)
                        .attr("width", 18)
                        .attr("height", 18)
                        .style("fill", function(d) {
                          return colors(d.group_id);
                        });

                  legend.append("text")
                        .attr("x", width - 24)
                        .attr("y", 9)
                        .attr("dy", ".35em")
                        .style("text-anchor", "end").text(function (d) {return d.group;});
                }




            }
          };
        }
    }
}).config(config);


function config ($stateProvider) {
  'ngInject';
  $stateProvider.state("vis", {
    url: "/vis",
    template: "<force-directed-graph></force-directed-graph>"
  }
  )
}
