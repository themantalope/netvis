/**
 * Created by antalek on 7/14/16.
 */
import { Mongo } from "meteor/mongo";

export const Networks = new Mongo.Collection("networks");

Networks.allow({
    insert() {return true;},
    remove() {return true;},
    update() {return true;}
});

