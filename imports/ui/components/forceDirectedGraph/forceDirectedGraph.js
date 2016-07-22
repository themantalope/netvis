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
      if (typeof(this.selectedGraph) != "undefined"){
        console.log("current graph: ", )
        this.graph = this.selectedGraph;
      }
    }

    updateStuff(){

        console.log("'this' in update stuff: ", this);
        this.links = this.graph.getLinks();
        this.nodes = this.graph.getNodes();


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
    var width = 800;
    var margin = 20;
    var height = 600 - margin;

    return {
        restrict: "E",
        template: template,
        controller: ForceDirectedGraph,
        controllerAs: name,
        bindToController: true,
        scope: true,
        link: function (scope, element, attrs) {

            scope.$watch("links", function(newval, oldval){
                scope.links = newval;
            });
            scope.$watch("nodes", function (newval, oldval) {
                scope.nodes = newval;
            });

            scope.$watch("forceDirectedGraph.graph", function (newval, oldval) {
              if(typeof(newval) != "undefined" && newval !== oldval){
                updateLayout();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedNetworkLabel", function(newval, oldval) {
              if (typeof(newval) != "undefined"){
                console.log("have a new network label: ", newval);
                scope.forceDirectedGraph.setSelectedGraphIndex();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedNetworkIndex", function(newval, oldval) {
              if (typeof(newval) != "undefined") {
                console.log("have a new network index: ", newval);
                scope.forceDirectedGraph.setGraph();
              }
            }, true);

            scope.$watch("forceDirectedGraph.selectedGraph", function (newval, oldval) {
              if (typeof(newval) != "undefined") {
                console.log("have a new selectedGraph: ", scope.forceDirectedGraph.selectedGraph);
                scope.forceDirectedGraph.setGraph();
              }

            });


            scope.$watch("loadedGraphs", function (newval, oldval) {

                if (scope.forceDirectedGraph.loadedGraphs){
                    console.log("I'm about to execute update stuff...");
                    scope.forceDirectedGraph.updateStuff();
                    updateLayout();
                }

            }, true);

            scope.$watch("forceDirectedGraph.selectedNetFile", function(newval, oldval){
              if (typeof(newval) == "string"){
                newval = JSON.parse(newval);
              }

              if(typeof(scope.forceDirectedGraph.networks) != "undefined") {
                console.log("here are the networks: ", scope.forceDirectedGraph.networks);
                console.log("here is the newval: ", newval);
                var foundnet = false;
                for (var i = 0; i < scope.forceDirectedGraph.networks.length; i++){
                  var curnet = scope.forceDirectedGraph.networks[i];
                  if(newval._id == curnet._id) {
                    foundnet = true;
                    break;
                  }
                }

                if(foundnet) {
                  console.log("found the network: ", newval);
                  scope.forceDirectedGraph.selectedNetFile = newval;
                  scope.forceDirectedGraph.loadNetwork();
                }



              }
            }, true);

            var vis = d3.select(element[0])
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height + margin + 100);

            var updateLayout = function () {

              console.log("I'm in updatedsomething");
              console.log("nodes: ", scope.forceDirectedGraph.graph.getNodes());

              if (typeof(scope.forceDirectedGraph.graph) != "undefined") {

                var colors = d3.scale.category10();

                var force = d3.layout.force()
                              .size([width, height])
                              .nodes(scope.forceDirectedGraph.graph.getNodes())
                              .links(scope.forceDirectedGraph.graph.getLinks())
                              .linkDistance([40])        // <-- New!
                              .charge([-120]);

                var edge = vis.selectAll("line")
                              .data(scope.forceDirectedGraph.graph.getLinks())
                              .enter()
                              .append("line")
                              .style("stroke", "#ccc")
                              .style("stroke-width",function (d) {
                                  return d.weight;
                              });

                var node = vis.selectAll("circle")
                              .data(scope.forceDirectedGraph.graph.getNodes())
                              .enter()
                              .append("circle")
                              .attr("r", 5)
                              .style("fill", function (d) { return colors(d.group_id)});


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

                d3.select(window).on("resize", resize);

                function resize() {

                  opwidth = 800;
                  opheight = 600;

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

                force.on("tick", ticked);

                force.start();

                function ticked () {
                    edge.attr("x1", function (d) { return d.source.x })
                        .attr("y1", function (d) { return d.source.y })
                        .attr("x2", function (d) { return d.target.x })
                        .attr("y2", function (d) { return d.target.y });

                    node.attr("cx", function (d) { return d.x })
                        .attr("cy", function (d) { return d.y });

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
