/**
 * Created by antalek on 7/14/16.
 */
import { Meteor } from 'meteor/meteor';
import { Networks } from "./collection";
import { Counts } from 'meteor/tmeasday:publish-counts';

if (Meteor.isServer){
    Meteor.publish("networks", function(){
        return Networks.find();
    });
}
