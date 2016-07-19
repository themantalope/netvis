/**
 * Created by antalek on 7/19/16.
 */
import angular from "angular";
import angularMeteor from "angular-meteor";
import template from "./navigation.html";

const name = "navigation";

//export a module
export default angular.module(name, [
    angularMeteor
]).component(name, {
    template,
    controllerAs: name
});
