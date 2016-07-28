/**
 * This is the class which holds on to the multi layer network, and will have some extra functionality for creating
 * new subgraphs based on other data from either the node or link data.
 */

import { Graph } from "../graph/graph"
import { NodeStructure } from "../nodeStructure/nodeStructure";

let _nodes = new WeakMap();
let _matricies = new WeakMap();
let _max_group_depth = new WeakMap();
let _global_node_structure = new WeakMap();
let _current_node_depth = new WeakMap();
let _node_structure = new WeakMap();


class MultiGraph {
    /*
    *
    * The constructor for this class takes two arguments, one is a list of nodes, and the other is a list of matricies.
    * The nodes can have any data associated with them but they should have an "index" variable associated with them
    * that corresponds to the row/col position. The list of matricies represents the adjacency matricies associated with
    * the multilayer network. The number of rows and columns of the matricies must be equal to the number of nodes in
    * the node list
    * @param {nodes} - The list of nodes associated with the matrix. Suggested that they have an "index" variable
    * associated with each node that corresponds to its row/col position in the adjacency matricies. If no "index"
    * variable is found, one will be assumed in the order in which the node was encountered. However if the ordering
    * of nodes in the matrix rows/columns is not the same as the ordering delivered in the list, then the links
    * represented by the matrix will be incorrect.
    *
    * Additionally, if nodes are found in some hierarchy, then they can have an additional key called "group". Each
    * "group" can have multiple features associated with it, but if it has a subgroup, then it must have another "group"
    * key.
    *
    * @param {matricies} - A list of adjacency matricies that describe the multilayer network for the list of nodes.
    * The number of rows and columns in each matrix must be the same as the number of nodes. The data for the matrix
    * should be contained within the "data" attribute. At this time, only dense matricies are accepted but future
    * versions will include support for sparse matrix formats.
    * */
    constructor(nodes, matricies){

        _node_structure.set(this, new NodeStructure());
        var nodedata = this._processNodes(nodes);
        var tnodes = nodedata.nodes;
        var global_struc = nodedata.structure;
        var tmatricies = this._processMatricies(matricies, tnodes.length);



        _nodes.set(this, tnodes);
        _matricies.set(this, tmatricies);
        _global_node_structure.set(this, global_struc);


    }
    /*
    *
    * Returns the nodes associated with an instance of the object.
    *
    * */
    getNodes(){
        return _nodes.get(this);
    }

    getNumNodes() {
        return _nodes.get(this).length;
    }


    getNumGraphs() {
        return _matricies.get(this).length;
    }

    getNodeStructure() {
        return _global_node_structure.get(this);
    }

    /*
    *
    * This function will return a list of links based on the matrix index. The list will be formatted such that each
    * entry will be of the form {"source":, "target":}, which is compatible with the D3 plotting library.
    *
    * @param {matrix_index} - the index of the matrix for which the link list is to be generated.
    * */
    getGraphForMatrix(matrix_index){
        var allmats = _matricies.get(this);
        var curmat = allmats[matrix_index].adjacency;
        var curlabel = allmats[matrix_index].label;
        var nodes = this.getNodes();
        var ns = this.getNodeStructure();

        return new Graph(nodes, curmat, ns, curlabel);
    }

    getAllGraphs(){
      var allgraphs = [];
      for (var i = 0; i < _matricies.get(this).length; i++) {
        allgraphs.push(this.getGraphForMatrix(i));
      }

      return allgraphs;
    }

    getGraphIndexForLabel(label){
      var allmats = _matricies.get(this);
      var idx;
      for (var i = 0; i < allmats.length; i++){
        if (allmats[i].label == label){
          idx = i;
          break;
        }
      }

      return idx;
    }

    _processMatricies(matricies, nNodes){
      var tmatricies = [];
      for(var i = 0; i < matricies.length; i++){
        var curmat = matricies[i].data;
        var matsize = curmat.length;

        if (matsize != nNodes){
            throw "The number of nodes must be the same as the number of rows and columns in the matricies!"
        }

        for (var j=0; j < curmat.length; j++){
            if (curmat[j].length != nNodes) {
                throw "The number of nodes must be the same as the number of rows and columns in the matricies!"
            }
        }

        var curlabel = i;

        if ( "label" in matricies[i] ){
          curlabel = matricies[i].label;
        }
        tmatricies.push({"adjacency":curmat, "label":curlabel})
      }
      return tmatricies;
    }
    /*
    * This is a private function which processes the input node list. Will automatically add an "index" to the node if
    * it does not exist (will add in the order in which the node appeared).
    * @param {nodes} - The node list to process.
    * */
    _processNodes(nodes){

      var tnodes = [];
      //add the nodes to the object's node array
      for (var i = 0; i < nodes.length; i++){
          var curnode = nodes[i];
          if ("index" in curnode){
            tnodes.push(curnode);
          } else {
            curnode["index"] = i;
            tnodes.push(curnode)
          }
      }
      //sort the node list based on the index values
      tnodes.sort(function(first, second){
          return first.index - second.index;
      });
      var node_struc_data = this._determineGlobalNodeStructure(nodes);



      //check the depth of "group" within the nodes
      var node_struc_list = node_struc_data.structure;

      for (var i = 0; i < node_struc_list.length; i++) {
        var group_idx = i;
        var group_name = node_struc_list[i].name;
        var group_nodes = node_struc_list[i].nodes;

        for(var k = 0; k < group_nodes.length; k++){
          var cur_idx = group_nodes[k];

          for (var j = 0; j < tnodes.length; j++){
            if(tnodes[j].index === cur_idx) {
              tnodes[j]["group"] = group_name;
              tnodes[j]["group_id"] = group_idx;
              break;
            }
          }
        }
      }



      return {"nodes":tnodes,
              "structure":node_struc_data.structure};
    }
    /*
    * This function determines the ultimate hierarchy of the nodes, based on what is in the group.
    * @param {nodes} - node list to determine group structure for.
    * @param {identifer} - this should be some sort of identifier that allows for a label to be had, should be present
    * within the node "group" structure
    * */
    _determineGlobalNodeStructure(nodes, delimiter = ":"){


      var structure_list = [];
      var group_id_keys = {};
      var group_counter = 0;

      nodes.sort(function(first, second) {
        return first.index - second.index;
      });

      var ns = _node_structure.get(this);

      // here is what each group object will look like:
      // {"name":, "subgroups":[], "nodes":[], "depth":}
      for (var i = 0; i < nodes.length; i++){
        var curnode = nodes[i];
        ns.addNodeToStructureList(curnode);

      }

      _node_structure.set(this, ns);
      structure_list = ns.getStructureList();



      return {"structure":structure_list};
    }



}


export {MultiGraph}
