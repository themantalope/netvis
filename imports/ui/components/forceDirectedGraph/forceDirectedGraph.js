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

    getHierarchicalGraphFromCurrentGraph(){
      if (this.graph !== undefined && this.graph !== null){
        var hg =  this.graph.getHierarchicalGraph(0);
        this.graph = hg;
        this.selectedGraph = this.graph;
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
            });

            scope.$watch("forceDirectedGraph.selectedNetworkLabel", function(newval, oldval) {
              if (typeof(newval) !== "undefined" && newval !== oldval){
                scope.forceDirectedGraph.setSelectedGraphIndex();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedNetworkIndex", function(newval, oldval) {
              if (typeof(newval) !== "undefined") {
                scope.forceDirectedGraph.setGraph();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedGraph", function (newval, oldval) {
              if (typeof(newval) != "undefined" && newval !== oldval) {
                scope.forceDirectedGraph.setGraph();
                updateLayout();
              }
            });


            scope.$watch("forceDirectedGraph.searchedGene", function (newval, oldval) {

              if(typeof(newval) !== "undefined"){
                if (newval !== oldval) {
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

              var graph = scope.forceDirectedGraph.graph;
              var links = graph.getLinks();
              var nodes = graph.getNodes();

              function highlightSearchedGene(text) {


                if (text !== "" && text !== null){
                  nodeOut();
                  d3.selectAll(".circle").each(function(p) {
                    var matched = text === p.gene || text === p.id;
                    if (matched) {
                      highlightNeigbors(p);
                    }
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
                nodeOut();
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
                  .style("opacity", 0.45)
                  .style("stroke", "#ccc")
                  .style("stroke-width",function (d) {
                    if ("nNodes" in d.source){
                      return 50 * d.weight;
                    } else {
                      return d.weight;
                    }
                  });

              }


              width = opwidth;
              height = opheight;


              d3.selectAll("svg").remove();

              var vis = d3.select("#fdl")
                          .append("svg")
                          .attr("width", width)
                          .attr("height", height + margin + 100)
                          .style("border", "2px solid black")
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

                var colors = d3.scale.category10();

                var force = d3.layout.force()
                              .size([width, height])
                              .nodes(nodes)
                              .links(links)
                              .linkDistance(function (d, i) {
                                if ("nNodes" in d.source){
                                  return 5 * (1.0/d.weight);
                                } else {
                                  return 40;
                                }
                              })        // <-- New!
                              .charge(function(d) {
                                if ("nNodes" in d){
                                  return -10 * d.nNodes**2.0;
                                } else {
                                  return -200;
                                }
                              })
                              .friction(0.9).start();

                var edge = vis.selectAll("line")
                              .data(links)
                              .enter()
                              .append("line")
                              .style("stroke", "#ccc")
                              .style("opacity", 0.45)
                              .style("stroke-width",function (d) {
                                if ("nNodes" in d.source){
                                  return 50 * d.weight;
                                } else {
                                  return d.weight;
                                }
                              });

                var node = vis.selectAll("svg")
                              .append("g")
                              .attr("class", "circles")
                              .data(nodes)
                              .enter()
                              .append("g")
                              .attr("class", "circle")
                              .append("circle")
                              .style("stroke", "white")
                              .style("stroke-width", "1px")
                              .attr("r", function(d) {
                                if ("nNodes" in d) {
                                  return d.nNodes;
                                } else {
                                  return 5;
                                }
                              })
                              .attr("opacity", 1.0)
                              .style("fill", function (d) {
                                if ("group_color" in d) {
                                  return d.group_color;
                                } else {
                                  return colors(d.group_id);
                                }
                              })
                              .on("mouseover", nodeOver)
                              .on("mouseout", nodeOut);


                var node_struc = graph.getNodeStructure();
                var group_id_arr = [];
                for (var i = 0; i < node_struc.length; i++){
                  group_id_arr.push({"group_id":i, "group":node_struc[i].name, "group_color":node_struc[i].group_color});
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
                        if ("group_color" in d) {
                          return d.group_color;
                        } else {
                          return colors(d.group_id);
                        }
                      });

                legend.append("text")
                      .attr("x", width - 24)
                      .attr("y", 9)
                      .attr("dy", ".35em")
                      .style("text-anchor", "end").text(function (d) {return d.group;});

                force.on("tick", ticked);



                function ticked () {
                          edge.attr("x1", function (d) { return d.source.x })
                              .attr("y1", function (d) { return d.source.y })
                              .attr("x2", function (d) { return d.target.x })
                              .attr("y2", function (d) { return d.target.y });

                          node.attr("cx", function (d) { return d.x })
                              .attr("cy", function (d) { return d.y });

                d3.select(window).on("resize", resize);

                if (typeof(scope.forceDirectedGraph.searchedGene) === "string") {
                  force.stop();
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
