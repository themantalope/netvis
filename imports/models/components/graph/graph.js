/**
 * Created by antalek on 7/14/16.
 */

let _nodes = new WeakMap();
let _links = new WeakMap();
let _node_structure = new WeakMap();
let _label = new WeakMap();

class Graph{
    /*
    * The constructor for this object simply takes a list of nodes and an adjacency matrix. It will then create a list
    * of nodes as well as a link list. The nodes will be a list of dictionaries, with whatever data was supplied to them.
    * The link list will be of the form {source: i, target: j, weight: w} for a link between nodes i and j (ith and jth
    * index in the node list) with weight w.
    * */

    constructor(nodes, adjacency, node_structure, label=""){

        _nodes.set(this, nodes);
        _node_structure.set(this, node_structure);

        //now we need to process the adjacency matrix
        var links = this._processAdjacency(adjacency);
        _links.set(this, links);
        _label.set(this, label);

    }

    _processAdjacency(matrix) {

//        console.log("here is the matrix: ", matrix);

        var link_list = [];
        for (var i = 0; i < matrix.length; i++){
            for (var j = i; j < matrix[i].length; j++){
                if (matrix[i][j] != 0){
                    link_list.push({"source":i, "target":j, "weight":matrix[i][j]});
                }
            }
        }

        return link_list;
    }

    getNodes(){
        return _nodes.get(this);
    }

    getLinks(){
        return _links.get(this);
    }

    getNodeStructure(){
      return _node_structure.get(this);
    }

    getLabel(){
      return _label.get(this);
    }


    getHierarchicalGraph(nodeStructureLevel){
      //first get the nodes and the current links
      var nodes = _nodes.get(this);
      var links = _links.get(this);
      var nodeStructure = _node_structure.get(this);
      var nsLevel = nodeStructureLevel;

      //first, figure out which groups of nodes can go where
      //to do this, we need to collapse any node groups which are
      //deeper than the requested node structure level
      //

      var recurseThroughSubgroupsAndGetNodes = function(startGroup, nsDepth){
        for(var i = 0; i < startGroup.subgroups.length; i++){
          var curSubgroup = startGroup.subgroups[i];
          if (curSubgroup.depth > nsDepth) {
            startGroup.nodes.concat(curSubgroup.nodes);
          } else {
            curSubgroup = recurseThroughSubgroupsAndGetNodes(curSubgroup, nsDepth);
          }
        }

        return startGroup;
      }

      var addObjsToListWhoseDepthIsLessThanRequested = function(obj, obj_list, depth) {
        if (obj.depth <= depth) {
          obj_list.push(obj);
        }

        if (obj.subgroups.lenth > 0) {
          for (var i = 0; i < obj.subgroups.length; i++){
            var cursub = obj.subgroups[i];
            addObjsToListWhoseDepthIsLessThanRequested(cursub, obj_list, depth);
          }
        }

        return obj_list;
      }

      var new_node_structure_list = [];

      for (var i = 0; i < nodeStructure.structure.length; i++) {
        var currentStructure = nodeStructure.structure[i];
        //recurse through and collect nodes whose depth is lower than the depth
        //given
        currentStructure = recurseThroughSubgroupsAndGetNodes(currentStructure, nsLevel);

        //put any subgroup whose depth is less than nsLevel into the new_node_structure_list

        addObjsToListWhoseDepthIsLessThanRequested(currentStructure, new_node_structure_list, nsLevel);
      }

      //ok, now that we have a node structure list, we can start to make a graph;
      var link_matrix = [];
      var nodeNum = new_node_structure_list.length;
      for (let i = 0; i < nodeNum; i++){
        link_matrix[i] = [];
        for (let j = 0; j < nodeNum; j++){
          link_matrix[i].push(0);
        }
      }

      for (let i=0; i < nodeNum; i++){
        var group_i = new_node_structure_list[i];


        for (let j = i + 1; j < nodeNum; j++){
          var group_j = new_node_structure_list[j];
          var total_possible_links = group_i.nodes.length * group_j.nodes.length;
          var intergroup_links = 0;

          for(let k = 0; k < links.length; k++){
            var cursource = links[k].source;
            var curtarget = links[k].target;

            if((cursource in group_i.nodes && curtarget in group_j.nodes) ||
               (curtarget in group_i.nodes && cursource in group_j.nodes)){
                 intergroup_links += 1;
               }
          }

          link_matrix[i][j] = intergroup_links / total_possible_links;
          link_matrix[j][i] = intergroup_links / total_possible_links;
        }
      }

      //finally, looks like we can make the new graph, just need to create a
      //node list
      var new_node_list = [];
      for (let i = 0; i < new_node_structure_list.length; i++){
        new_node_list.push({"index":i, "group":new_node_structure_list[i].name})
      }

      return new Graph(new_node_list, link_matrix, new_node_structure_list);
    }
}

export { Graph }
