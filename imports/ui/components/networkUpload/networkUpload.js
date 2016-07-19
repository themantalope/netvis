/**
 * Created by antalek on 7/14/16.
 */
import angular from 'angular';
import angularMeteor from 'angular-meteor';
import { Meteor } from 'meteor/meteor';
import template from './networkUpload.html';
import ngFileUpload from 'ng-file-upload';
import { upload } from '../../../api/networks';


class NetworkUpload {
    constructor($scope, $reactive) {
        'ngInject';

        $reactive(this).attach($scope);
        this.uploaded = [];
        this.subscribe("networks");
    }

    addNetwork(files){
        console.log("files: ", files);
        if (files.length) {
            this.currentFile = files[0];
            console.log("current file: ", this.currentFile);

            const reader = new FileReader();

            reader.onload = this.$bindToContext( (e) => {
                console.log("in reader.onload");
                // console.log("here is e.target.result: ", e.target.result);
                this.networkFileSrc = e.target.result;
                // console.log("here is this.networkFileSrc: ", this.networkFileSrc);
                this.save();
            });

            reader.readAsDataURL(this.currentFile);
            // console.log("networkFileSrc: ", this.networkFileSrc);
        }

        // console.log("this.networkFileSrc: ", this.networkFileSrc);
        // console.log("this.currentFile.name: ", this.currentFile.name);
        // this.save();
    }

    save() {
        // console.log("this.networkFileSrc: ", this.networkFileSrc);
        // console.log("this.currentFile.name: ", this.currentFile.name);
        console.log("this.uploaded: ", this.uploaded);

        upload(this.networkFileSrc, this.currentFile.name, this.$bindToContext( (file) => {
            console.log("file: ", file);
            this.uploaded.push(file);
            this.reset();
        }), (e) => {
            console.log("Something went wrong: ", e);
        });
    }

    reset() {
        this.networkFileSrc = undefined;
    }
}

const name = 'networkUpload';

// create a module
export default angular.module(name, [
    angularMeteor,
    ngFileUpload
]).component(name, {
    template,
    controllerAs: name,
    controller: NetworkUpload
});