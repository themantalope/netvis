

let _structure_list = new WeakMap();

let recursivelyAddInNode = function (structure, groups_list, node_index, curdepth=0, node_color=null){
  var top_group = groups_list.shift();
  var found_in_structure = false;
  var next_structure;

  for(var i = 0; i < structure.length; i++){
    if(top_group === structure[i].name){
      found_in_structure = true;
      next_structure = structure[i];
      break;
    }
  }


  if(groups_list.length === 0){
    //we are at the end of the line
    if(found_in_structure) {
      next_structure.nodes.push(node_index);
    } else { //make a new group structure
      structure.push({"name":top_group, "nodes":[node_index], "subgroups":[], "depth":curdepth, "group_color":node_color});

    }
  } else { //we have a deeper classification scheme yet
    if(found_in_structure){
      next_structure.subgroups = recursivelyAddInNode(next_structure.subgroups, groups_list, node_index, curdepth++);
    } else {
      //make a new group structure and dive into that
      next_structure = {"name":top_group, "nodes":[], "subgroups":[], "depth":curdepth, "group_color":node_color};
      structure.push(next_structure);
      next_structure.subgroups = recursivelyAddInNode(next_structure.subgroups, groups_list, node_index, curdepth++);
    }

  }

  return structure;
}

class NodeStructure {
  constructor(){
    _structure_list.set(this, []);
  }

  addNodeToStructureList(node, delimiter = ":"){
    //get and set the structure list at the end
    var structure_list = _structure_list.get(this);
    var node_group_list = node.group.split(delimiter);
    var node_color = node.group_color;
    var node_index = node.index;
    structure_list = recursivelyAddInNode(structure_list, node_group_list, node_index, curdepth=0, node_color);
    _structure_list.set(this, structure_list);
  }

  getStructureList(){
    return _structure_list.get(this);
  }

  flattenStructureToDepth(depth){

  }
}

export { NodeStructure }
