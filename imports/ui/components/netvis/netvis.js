/**
 * Created by antalek on 7/19/16.
 */
import angular from "angular";
import angularMeteor from "angular-meteor";
import template from "./netvis.html";
import uiRouter from "angular-ui-router";
import { name as Navigation } from "../navigation/navigation";
import { name as ForceDirectedGraph } from "../forceDirectedGraph/forceDirectedGraph";

class Netvis {}

const name = "netvis";

export default angular.module(name, [
    angularMeteor,
    uiRouter,
    Navigation,
    ForceDirectedGraph
]).component(name, {
  template,
  controllerAs: name,
  controller: Netvis
}).config(config);

function config ($locationProvider, $urlRouterProvider) {
  "ngInject";
  $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise("/vis");

}
