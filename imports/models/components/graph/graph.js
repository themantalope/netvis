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

    constructor(nodes, adjacency, node_structure, label){

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
      var nsLevel;
      

    }
}

export { Graph }
