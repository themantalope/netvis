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
                weakme.graph = weakme.multiGraph.getGraphForMatrix(0);
                weakme.loadedGraphs = true;

                if (weakme.loadedGraphs) {
                    weakme.updateStuff();
                }

            });
          }
        } else {
            // console.log("no network files were found.");
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

            console.log("scope inside link function: ", scope);
            console.log("element inside link function: ", element);
            console.log("attrs inside link function: ", attrs);
            console.log("scope.forceDirectedGraph.selectedNetFile: ", scope.forceDirectedGraph.selectedNetFile);

            scope.$watch("links", function(newval, oldval){
                scope.links = newval;
            });
            scope.$watch("nodes", function (newval, oldval) {
                scope.nodes = newval;
            });

            scope.$watch("forceDirectedGraph.graph", function (newval, oldval) {
              if(typeof(newval) != "undefined"){
                updatedsomething();
              }


            }, true);


            scope.$watch("loadedGraphs", function (newval, oldval) {

                if (scope.forceDirectedGraph.loadedGraphs){
                    console.log("I'm about to execute update stuff...");
                    scope.forceDirectedGraph.updateStuff();
                    updatedsomething();
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

            var updatedsomething = function () {

              console.log("I'm in updatedsomething");
              console.log("nodes: ", scope.forceDirectedGraph.graph.getNodes());

              if (scope.forceDirectedGraph.graph) {

                var colors = d3.scale.category20();

                var force = d3.layout.force()
                              .size([500,300])
                              .nodes(scope.forceDirectedGraph.graph.getNodes())
                              .links(scope.forceDirectedGraph.graph.getLinks())
                              .linkDistance([10])        // <-- New!
                              .charge([-10]);

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
                              .attr("r", 3)
                              .style("fill", function (d) { return colors(d.group_id)});


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
