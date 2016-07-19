/**
 * Created by antalek on 7/19/16.
 */
import angular from "angular";
import angularMeteor from "angular-meteor";
import template from "./netvis.html";
import uiRouter from "angular-ui-router";

class Netvis {}

const name = "netvis";

export default angular.module(name, [
    angularMeteor,
    uiRouter
]);