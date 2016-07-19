/**
 * Created by antalek on 7/14/16.
 */
import { UploadFS } from 'meteor/jalik:ufs';
import { Networks } from './collection';

export const NetworksStore = new UploadFS.store.GridFS({
    collection: Networks,
    name: "networks"
});