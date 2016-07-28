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
        var links = this._processAdjacency(adjacency, nodes);
        _links.set(this, links);
        _label.set(this, label);

    }

    _processAdjacency(matrix, node_list) {

//        console.log("here is the matrix: ", matrix);

        var link_list = [];
        for (var i = 0; i < matrix.length; i++){
            for (var j = i; j < matrix[i].length; j++){
                if (matrix[i][j] != 0){
                    var row_node = node_list.find(function(n) { return n.index === i});
                    var col_node = node_list.find(function(n) { return n.index === j});
                    // console.log("got a link");
                    // console.log("i, j: ", i, j);
                    // console.log("row_node: ", row_node);
                    // console.log("col_node: ", col_node);
                    link_list.push({"source":row_node, "target":col_node, "weight":matrix[i][j]});
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

      var new_node_structure_list = nodeStructure;

      //ok, now that we have a node structure list, we can start to make a graph;
      var link_matrix = [];
      var nodeNum = new_node_structure_list.length;
      for (let i = 0; i < nodeNum; i++){
        link_matrix[i] = [];
        for (let j = 0; j < nodeNum; j++){
          link_matrix[i].push(0);
        }
      }

      var total_possible_links;
      var intergroup_links;
      for (let i=0; i < nodeNum; i++){
        var group_i = new_node_structure_list[i];


        for (let j = i + 1; j < nodeNum; j++){
          var group_j = new_node_structure_list[j];
          total_possible_links = (group_i.nodes.length * group_j.nodes.length);
          intergroup_links = 0;


          var cursource;
          var curtarget;
          for(let k = 0; k < links.length; k++){
            // console.log("links[k]: ", links[k]);
            cursource = links[k].source.index;
            curtarget = links[k].target.index;

            if((group_i.nodes.indexOf(cursource) > -1 && group_j.nodes.indexOf(curtarget) > -1) ||
               (group_i.nodes.indexOf(curtarget) > -1 && group_j.nodes.indexOf(cursource) > -1)){

                // console.log("group_i: ", group_i);
                // console.log("group_j: ", group_j);
                // console.log("links[k]: ", links[k]);
                // console.log("nodes: ", nodes);

                intergroup_links += 1.0;
            }
          }
          // console.log("calculated linkage between 2 groups");
          // console.log("group_i: ", group_i);
          // console.log("group_j: ", group_j);
          // console.log("total_possible_links: ", total_possible_links);
          // console.log("intergroup_links: ", intergroup_links );
          // console.log("linkage rate: ", intergroup_links / total_possible_links);

          link_matrix[i][j] = intergroup_links / total_possible_links;
          link_matrix[j][i] = intergroup_links / total_possible_links;
        }
      }

      //finally, looks like we can make the new graph, just need to create a
      //node list
      var new_node_list = [];
      for (let i = 0; i < new_node_structure_list.length; i++){
        var new_node = {"index":i, "group":new_node_structure_list[i].name, "group_id":i , "nNodes":new_node_structure_list[i].nodes.length};
        if ("group_color" in nodes[0]) {
          for (let j = 0; j < nodes.length; j++){
            if (nodes[j].group === new_node.group) {
              new_node.group_color = nodes[j].group_color;
              break;
            }
          }
        }
        new_node_list.push(new_node);
      }
      var newLabel = _label.get(this); + " - Hierarchical";
      return new Graph(new_node_list, link_matrix, new_node_structure_list, label=newLabel);
    }
}

export { Graph }
