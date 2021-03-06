module.exports = function (dataSlices, struct) {
  var formatted = {
    addedData: {},
    data: [],
    addedIncluded: {},
    included: [],
    relationshipIds: {}
  };
  format(dataSlices, struct, formatted, true);
  return {
    data: formatted.data,
    included: formatted.included
  };
};


function format(arr, struct, obj, root) {
  if (!(arr instanceof Array)) { arr = [arr]; }
  var id;
  var item;
  var processed;
  var dataRoot;
  var addedRoot;
  var type = struct.$$resource.name;
  var idField = struct.$$resource.idField;
  var data = arr.pop();

  var built;
  var keys;
  var key;
  var structAttr;

  // set rel ids type obj
  while (data !== undefined) {
    id = data[idField];

    if (root) {
      dataRoot = obj.data;
      addedRoot = obj.addedData;
    } else {
      dataRoot = obj.included;
      addedRoot = obj.addedIncluded;
    }


    if (!addedRoot[type]) { addedRoot[type] = {}; }

    // add item and relation ships
    if (!addedRoot[type][id]) {
      built = {
        id: id,
        type: data.$$type,
        attributes: {},
        relationships: {}
      };
       
      keys = Object.keys(struct);
      key = keys.pop();
      while (key) {
        // attribute
        structAttr = struct[key];
        if (!structAttr.$$struct) {
          built.attributes[key] = data[key];
        // relationship
        } else {
          // TODO add meta data (type, toMany)
          built.relationships[key] = built.relationships[key] || {data:[]};
          // NOTE may need to add check for duplicates here.
          // TODO test for dups with third layer
          built.relationships[key].data.push({
            id: data[key][structAttr.$$resource.idField],
            type: structAttr.$$resource.name
          });
          format(data[key], structAttr, obj);
        }
        key = keys.pop();
      }

      addedRoot[type][id] = built;
      dataRoot.push(built);

    // item has already been added just add relationships
    } else {
      built = addedRoot[type][id];
      keys = Object.keys(struct);
      key = keys.pop();
      while (key) {
        // relationship
        structAttr = struct[key];
        if (structAttr.$$struct) {
          built.relationships[key] = built.relationships[key] || {data:[]};
          built.relationships[key].data.push({
            id: data[key][structAttr.$$resource.idField],
            type: structAttr.$$resource.name
          });
          format(data[key], structAttr, obj);
        }
        key = keys.pop();
      }
    }

    data = arr.pop();
  }
}
