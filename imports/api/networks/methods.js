/**
 * Created by antalek on 7/14/16.
 */
import { UploadFS } from "meteor/jalik:ufs"
import { NetworksStore } from './store';
import { dataURLToBlob, blobToArrayBuffer } from './helpers';

/**
 * Uploads a new file
 *
 * @param  {String}   dataUrl [description]
 * @param  {String}   name    [description]
 * @param  {Function} resolve [description]
 * @param  {Function} reject  [description]
 */
export function upload(dataUrl, name, resolve, reject) {
    // convert to Blob
    const blob = dataURLToBlob(dataUrl);
    blob.name = name;


    // pick from an object only: name, type and size
    const file = _.pick(blob, 'name', 'type', 'size');


    // convert to ArrayBuffer
    blobToArrayBuffer(blob, (data) => {
        console.log("here is the 'data' inside blobToArrayBuffer: ", data);
        console.log("here is the 'blob' inside blobToArrayBuffer: ", blob);
        console.log("here is the 'file' inside blobToArrayBuffer: ", file);
        const upload = new UploadFS.Uploader({
            file: file,
            data: blob,
            store: NetworksStore,
            onError: reject,
            onComplete: resolve
        }, function(e){console.log("had an error in blobToArrayBuffer: ", e)});

        upload.start();
    }, reject);
}
