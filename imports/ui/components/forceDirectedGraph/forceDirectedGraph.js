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

        this.apply = $scope.$apply;


        this.subscribe("networks");
        this.loadedGraphs = false;

        $scope.loadedGraphs = this.loadedGraphs;


        this.helpers({
            networks(){
                return Networks.find();
            }
        });

        $scope.networks = this.networks;

    }

    loadNetwork(){

        console.log("in the loadNetworks function");
        console.log("this.networks: ", this.networks);

        if (this.networks.length > 0){
            var theneturl = this.networks[0].url;
            console.log("the net url: ", theneturl);
            this.graphLoader = new MultiGraphJSONLoader(theneturl);

            var weakme = this;

            console.log("weakme: ", weakme);

            this.graphLoader.loadJSON(function (multigraph) {
                console.log("I'm in the callback for the loadJSON function...");
                console.log("multigraph variable inside the loadJSON callback (part of MultiGraphJSONLoader): ", multigraph);
                console.log("here is 'this' inside the MultiGraphJSONLoader.loadJSON callback (should be 'ForceDirectedGraph'): ", this);
                console.log("here is weakme: ", weakme);

                weakme.multiGraph = multigraph;

                console.log("weakme.multiGraph: ", weakme.multiGraph);
                console.log("weakme.multiGraph.getGraphForMatrix(0): ", weakme.multiGraph.getGraphForMatrix(0));

                weakme.graph = weakme.multiGraph.getGraphForMatrix(0);
                weakme.loadedGraphs = true;
                console.log("forceDirectedGraph.graph: ", weakme.graph);
                console.log("forceDirectedgraphs.loadedGraphs: ", weakme.loadedGraphs);
                console.log("here is weakme at the end of the callback: ", weakme);

                if (weakme.loadedGraphs) {
                    weakme.updateStuff();
                    weakme.apply();
                }

            });

        } else {
            console.log("no network files were found.");
        }
    }

    updateStuff(){

        console.log("'this' in update stuff: ", this);
        console.log("this.multiGraph: ", this.multiGraph);
        console.log("this.graph: ", this.graph);
        this.links = this.graph.getLinks();
        this.nodes = this.graph.getNodes();

        console.log("this.links: ", this.links);
        console.log("this.nodes: ", this.nodes);
        console.log("this.graph.getLinks(): ", this.graph.getLinks());
        console.log("this.graph.getNodes(): ", this.graph.getNodes());

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

            scope.$watch("forceDirectedGraph.graph", function () {
                console.log("see that ftg.graph has been updated....");
                console.log("running the graph update function...");

                updatedsomething();

            }, true);


            scope.$watch("loadedGraphs", function (newval, oldval) {
                console.log("loadedGraphs oldval: ", oldval);
                console.log("loadedGraphs newval: ", newval);

                if (scope.forceDirectedGraph.loadedGraphs){
                    console.log("I'm about to execute update stuff...");
                    scope.forceDirectedGraph.updateStuff();
                    updatedsomething();
                }

            }, true);

            scope.$watch("forceDirectedGraph.selectedNetFile", function(newval, oldval){


              if(scope.forceDirectedGraph.selectedNetFile in scope.forceDirectedGraph.networks){
                console.log("Here is the selected netfile: ", newval);
                scope.forceDirectedGraph.updateStuff();
              } else {
                console.log("here is the selected netfile (not in the list): ", scope.forceDirectedGraph.selectedNetFile);
              }
            }, true);


            scope.$watch("forceDirectedGraph.networks", function (newval, oldval) {
                console.log("here is the newval of ftg.networks: ", newval);
                console.log("here is the oldval of ftg.networks: ", oldval);

                var ftg = scope.forceDirectedGraph;
                ftg.loadNetwork();


            }, true);


            var vis = d3.select(element[0])
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height + margin + 100);

            var updatedsomething = function () {

                console.log("I'm in updatedsomething");
                console.log("scope.forceDirectedGraph: ", scope.forceDirectedGraph);

                if (scope.forceDirectedGraph.graph) {


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
                                  .attr("r", 3);


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
