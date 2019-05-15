import { uiModules } from 'ui/modules';

// get the kibana/table_vis module, and make sure that it requires the "kibana" module if it
// didn't already
const module = uiModules.get('kibana/transform_vis', ['kibana']);
//import the npm modules
const visN = require('vis');
const randomColor = require('randomcolor');
const ElementQueries = require('css-element-queries/src/ElementQueries');
const ResizeSensor = require('css-element-queries/src/ResizeSensor');
var ip=require('ip');

// add a controller to the module, which will transform the esResponse into a
// tabular format that we can pass to the table directive
module.controller('KbnNetworkVisController', function ($scope, $sce, $timeout, Private) {
    var network_id, loading_id;

    $scope.errorNodeColor = function () {
        $("#" + network_id).hide();
        $("#" + loading_id).hide();
        $("#errorHtml").html("<h1><strong>ERROR</strong>: Node Color must be the LAST selection</h1>");
        $("#errorHtml").show();
    }

    $scope.errorNodeNodeRelation = function () {
        $("#" + network_id).hide();
        $("#" + loading_id).hide();
        $("#errorHtml").html("<h1><strong>ERROR</strong>: You can only choose Node-Node or Node-Relation</h1>");
        $("#errorHtml").show();
    }

    $scope.initialShows = function () {
        $("#" + network_id).show();
        $("#" + loading_id).show();
        $("#errorHtml").hide();
    }

    $scope.startDynamicResize = function (network) {
        new ResizeSensor($("#" + network_id), function () {
            network.setSize('100%', '100%');
        });
    }

    $scope.drawColorLegend = function (usedColors, colorDicc) {
        var canvas = document.getElementsByTagName("canvas")[0];
        var context = canvas.getContext("2d");

        context.fillStyle = "#FFE8D6";
        var totalheight = usedColors.length * 25
        context.fillRect(canvas.width * (-2) - 10, canvas.height * (-2) - 18, 350, totalheight);

        context.fillStyle = "black";
        context.font = "bold 30px Arial";
        context.textAlign = "start";
        context.fillText("LEGEND OF COLORS:", canvas.width * (-2), canvas.height * (-2));

        var p = canvas.height * (-2) + 40;
        for (var key in colorDicc) {
            context.fillStyle = colorDicc[key];
            context.font = "bold 20px Arial";
            context.fillText(key, canvas.width * (-2), p);
            p = p + 22;
        }
    }

    $scope.$watchMulti(['esResponse', 'vis.params.secondNodeColor'], function ([resp]) {
        let firstFirstBucketId, firstSecondBucketId, secondBucketId, colorBucketId, nodeSizeId, edgeSizeId
        console.log("Resp array is "+resp);
        if (resp) {
            // new in 6.5
            resp.columns.forEach((col) => {
                if (col.aggConfig.schema.name === "first") {
                    if (firstFirstBucketId) {
                        firstSecondBucketId = col.id
                    } else {
                        firstFirstBucketId = col.id
                    }
                } else if (col.aggConfig.schema.name === "second") {
                    secondBucketId = col.id
                } else if (col.aggConfig.schema.name === "colornode") {
                    colorBucketId = col.id
                } else if (col.aggConfig.schema.name === "size_node") {
                    nodeSizeId = col.id
                } else if (col.aggConfig.schema.name === "size_edge") {
                    edgeSizeId = col.id
                }
            });
            // console.log("First bucket Id is "+firstFirstBucketId);
            // console.log("Second bucket Id is"+firstSecondBucketId);

            ///// It is neccessary to add Timeout in order to have more than 1 net in the same dashboard
            $timeout(function () {
                network_id = "net_" + $scope.$id;
                loading_id = "loading_" + $scope.$parent.$id;
                $("#" + loading_id).hide();
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////NODE-NODE Type///////////////////////////////////////////////////////////////////////
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                if ($scope.vis.aggs.bySchemaName['first'].length >= 1 && !$scope.vis.aggs.bySchemaName['second']) {
                    $scope.initialShows();
                    $(".secondNode").show();
                    // Retrieve the id of the configured tags aggregation
                    var firstFieldAggId = $scope.vis.aggs.bySchemaName['first'][0].id;
                    if ($scope.vis.aggs.bySchemaName['first'].length > 1) {
                        var secondFieldAggId = $scope.vis.aggs.bySchemaName['first'][1].id;
                    }

                    if ($scope.vis.aggs.bySchemaName['colornode']) {
                        var colorNodeAggId = $scope.vis.aggs.bySchemaName['colornode'][0].id;
                        var colorNodeAggName = $scope.vis.aggs.bySchemaName['colornode'][0].params.field.displayName;
                        var colorDicc = {};
                        var usedColors = [];
                    }

                    //Names of the terms that have been selected
                    var firstFieldAggName = $scope.vis.aggs.bySchemaName['first'][0].params.field.displayName;
                    if ($scope.vis.aggs.bySchemaName['first'].length > 1) {
                        var secondFieldAggName = $scope.vis.aggs.bySchemaName['first'][1].params.field.displayName;
                    }

                    // Retrieve the metrics aggregation configured
                    if ($scope.vis.aggs.bySchemaName['size_node']) {
                        var metricsAgg_sizeNode = $scope.vis.aggs.bySchemaName['size_node'][0];
                    }
                    if ($scope.vis.aggs.bySchemaName['size_edge']) {
                        var metricsAgg_sizeEdge = $scope.vis.aggs.bySchemaName['size_edge'][0];
                    }

                    	//console.log("First field agg id "+firstFieldAggId);
                    	//console.log("Second field agg id "+secondFieldAggId);
                    // Get the buckets of that aggregation
                    var buckets = resp.rows;
					console.log(buckets);
                    ///////////////////////////////////////////////////////////////DATA PARSED AND BUILDING NODES///////////////////////////////////////////////////////////////
                    var dataParsed = [];
                    var fw1=[];
                    var fw2=[];
                    var fw3=[];
                    var fw4=[];
                    var fw5=[];
                    var fw6=[];
                    var fw7=[];
                    var dataParsed2 =[];
                    //making static nodes array
                    var fwnodes=[{

                    	key: "10.0.0.1",
                    	label: "10.0.0.1",
                    	shape: $scope.vis.params.shapeFirstNode,
                        color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]

                    },

                    {
                    	key: "10.1.0.1",
                    	label: "10.1.0.1",
                    	shape: $scope.vis.params.shapeFirstNode,
                        color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]
                    },
                    {
                    	key: "10.2.0.0",
                    	label: "10.2.0.0",
                    	shape: $scope.vis.params.shapeFirstNode,
                    	color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]

                    },
                    {
                    	key: "10.201.0.2",
                    	label: "10.201.0.2",
                    	shape: $scope.vis.params.shapeFirstNode,
                    	color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]

                    },
                    {
                    	key: "10.50.0.1",
                    	label: "10.50.0.1",

                    	shape: $scope.vis.params.shapeFirstNode,
                    	color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]
		             },
		             {
		             	key: "10.30.0.2",
		             	label: "10.30.0.2",

                    	shape: $scope.vis.params.shapeFirstNode,
                        color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]
		             },
		            {
		             key: "10.20.0.1",
		             	label: "10.20.0.1",
                    	shape: $scope.vis.params.shapeFirstNode,
                        color: $scope.vis.params.firstNodeColor,
                        firstNodeKey:[],
                        secondNodeKey:[]
					}                 


                 ]

                    // Iterate the buckets
                    var i = 0;
                    var regexpattern1=/49\.162\.217\.[0-9]{1,3}/
                    var regexpattern2=/30\.65\.26\.[0-9]{1,3}/
                    var regexpattern3=/41\.24\.121\.[0-9]{1,3}/
                    var regexpattern4=/120\.56\.165\.[0-9]{1,3}/
                    var regexpattern5=/122\.113\.143\.[0-9]{1,3}/
                    var dataNodes=[];
                    var ipcollect=[...new Set(buckets.map(ip => buckets[firstFieldAggId]))];
                   console.log("array size"+ipcollect.length);
                    for(var l=0;l<ipcollect.length;l++)
                   console.log("Ip collect"+ipcollect[l]);


                     dataNodes = buckets.map(function (bucket) {

                        var result = $.grep(dataParsed, function (e) { 

                        	//console.log("E parameter is "+e.keyFirstNode);
                        	return e.keyFirstNode == bucket[firstFirstBucketId]; });
                    //        var result2=$.grep(dataParsed2, function(e){
                      //          console.log("E key second "+e.keySecondNode);
                               // console.log("E key first"+e.keyFirstNode);
                        //        return e.keySecondNode==bucket[firstSecondBucketId];
                          ///  });
                            //console.log(result2.length);
						//console.log("Result initially"+  result);
						// if(result2.length==0){
                        //     dataParsed2[i]={};
                        //     dataParsed2[i].keySecondNode= bucket[firstSecondBucketId];
                        // }
                        var result2=$.grep(dataParsed,function(e){
                            return e.keySecondNode == bucket[firstSecondBucketId];
                        });
                         if (result.length == 0) {
                            dataParsed[i] = {};

                            dataParsed[i].keyFirstNode = bucket[firstFirstBucketId];
                            dataParsed[i].keySecondNode=bucket[firstSecondBucketId];
                            console.log("Second node data"+dataParsed[i].keySecondNode);
                         
                            //Metrics are for the sizes
                            if (metricsAgg_sizeNode) {
                                // Use the getValue function of the aggregation to get the value of a bucket
                                var value = bucket[nodeSizeId]//metricsAgg_sizeNode.getValue(bucket);
                                var sizeVal = Math.min($scope.vis.params.maxCutMetricSizeNode, value);

                                //No show nodes under the value
                                if ($scope.vis.params.minCutMetricSizeNode > value) {
                                    dataParsed.splice(i, 1);
                                    return;
                                }
                            } else {
                                var sizeVal = 20;
                            }

                            dataParsed[i].valorSizeNode = sizeVal;
                            dataParsed[i].nodeColorValue = "default";
                            dataParsed[i].nodeColorKey = "default";
                          
                            if(!dataParsed[i].relationsWithFirewallNode){
                            	dataParsed[i].relationsWithFirewallNode=[];
                            }

                           /* if (!dataParsed[i].relationWithSecondNode) {
                                dataParsed[i].relationWithSecondNode = [];
                            }*/


                            //Iterate rows and choose the edge size
                            if ($scope.vis.aggs.bySchemaName['first'].length > 1) {
                                if (metricsAgg_sizeEdge) {
                                    var value_sizeEdge = bucket[edgeSizeId];
                                    var sizeEdgeVal = Math.min($scope.vis.params.maxCutMetricSizeEdge, value_sizeEdge);
                                } else {
                                    var sizeEdgeVal = 0.1;
                                }

                                if (colorNodeAggId) {
                                    if (colorDicc[bucket[colorBucketId]]) {
                                        dataParsed[i].nodeColorKey = bucket[colorBucketId];
                                        dataParsed[i].nodeColorValue = colorDicc[bucket[colorBucketId]];
                                    } else {
                                        //repeat to find a NO-REPEATED color
                                        while (true) {
                                            var confirmColor = randomColor();
                                            if (usedColors.indexOf(confirmColor) == -1) {
                                                colorDicc[bucket[colorBucketId]] = confirmColor;
                                                dataParsed[i].nodeColorKey = bucket[colorBucketId];
                                                dataParsed[i].nodeColorValue = colorDicc[bucket[colorBucketId]];
                                                usedColors.push(confirmColor);
                                                break;
                                            }
                                        }

                                    }
                                }

                                var subnet1=["255.255.255.224","255.255.255.0","255.255.255.240"];
                                

                               /* var relation = {
                                    keySecondNode: bucket[firstSecondBucketId],
                                    countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }*/
                                //	console.log(regexpattern.test(dataParsed[i].keyFirstNode));
                                	var relation2={};
                                
                              if(regexpattern1.test(dataParsed[i].keyFirstNode)){

                                	relation2={
                                		keyFireWall: fwnodes[1].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal,
                                    firstKey: dataParsed[i].keyFirstNode
                                }
                                fwnodes[1].firstNodeKey.push(dataParsed[i].keyFirstNode);
                                fwnodes[1].secondNodeKey.push(dataParsed[i].keySecondNode);
                                console.log("inside 1st pattern check");
                                	 dataParsed[i].relationsWithFirewallNode.push(relation2);

                                }
                                else if(regexpattern2.test(dataParsed[i].keyFirstNode)){

                                	relation2={
                                		keyFireWall: fwnodes[2].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal,
                                    firstKey: dataParsed[i].keyFirstNode
                                }
                                fwnodes[2].firstNodeKey.push(dataParsed[i].keyFirstNode);
                                fwnodes[2].secondNodeKey.push(dataParsed[i].keySecondNode);
                                	 dataParsed[i].relationsWithFirewallNode.push(relation2);

                                }
                                else if(regexpattern3.test(dataParsed[i].keyFirstNode)){

                                	relation2={
                                		keyFireWall: fwnodes[3].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal,
                                    firstKey: dataParsed[i].keyFirstNode
                                }
                                fwnodes[3].firstNodeKey.push(dataParsed[i].keyFirstNode);
                                fwnodes[3].secondNodeKey.push(dataParsed[i].keySecondNode);
                                	 dataParsed[i].relationsWithFirewallNode.push(relation2);

                                }



                                else if(regexpattern4.test(dataParsed[i].keyFirstNode)){

                                	relation2={
                                		keyFireWall: fwnodes[4].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal,
                                    firstKey: dataParsed[i].keyFirstNode
                                }
                                fwnodes[4].firstNodeKey.push(dataParsed[i].keyFirstNode);
                                fwnodes[4].secondNodeKey.push(dataParsed[i].keySecondNode);
                                 dataParsed[i].relationsWithFirewallNode.push(relation2);

                                }
                                else{

                                	relation2={
                                		keyFireWall: fwnodes[0].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal,
                                    firstKey: dataParsed[i].keyFirstNode
                                }

                                fwnodes[0].firstNodeKey.push(dataParsed[i].keyFirstNode);
                                fwnodes[0].secondNodeKey.push(dataParsed[i].keySecondNode);
                                dataParsed[i].relationsWithFirewallNode.push(relation2);

                                }
                                //dataParsed[i].relationsWithFirewallNode.push(relation2);        
                              //  console.log("Firewall key"+dataParsed[i].relationsWithFirewallNode.keyFireWall);

                                }
                                //fwnodes[r].firstNodeKey[i]=dataParsed[i].
                                console.log("Data parsed for "+ i + "Node");
                              //  dataParsed[i].relationWithSecondNode.push(relation)
                               
                                console.log(dataParsed[i]);
                            
                                for(var j=0;j<fwnodes.length;j++){
                                    for(var p=0;p<fwnodes[j].firstNodeKey.length;p++)
                                
                                console.log("Fwnode "+" "+j+" "+fwnodes[j].firstNodeKey[p]);
                                }

                                for(var j=0;j<fwnodes.length;j++){
                                    for(var p=0;p<fwnodes[j].secondNodeKey.length;p++)
                                
                                console.log("Fwnode "+" "+j+" "+fwnodes[j].secondNodeKey[p]);
                                }
                                //console.log("Fwnode"+fwnodes[i].secondNodeKey);

                            //assigning color and the content of the popup
                            var inPopup = "<p>" + bucket[firstFirstBucketId] + "</p>"
                            if (dataParsed[i].nodeColorValue != "default") {
                                var colorNodeFinal = dataParsed[i].nodeColorValue;
                                inPopup += "<p>" + dataParsed[i].nodeColorKey + "</p>";
                            } else {
                                var colorNodeFinal = $scope.vis.params.firstNodeColor;
                            }

                            i++;
                            //Return the node totally built
                            var nodeReturn = {
                                id: i,
                                key: bucket[firstFirstBucketId],
                                color: colorNodeFinal,
                                shape: $scope.vis.params.shapeFirstNode,
                                //size: sizeVal
                                value: sizeVal,
                                font: {
                                    color: $scope.vis.params.labelColor
                                }
                            }

                            //If activated, show the labels
                            if ($scope.vis.params.showLabels) {
                                nodeReturn.label = bucket[firstFirstBucketId];
                            }

                            //If activated, show the popups
                            if ($scope.vis.params.showPopup) {
                                nodeReturn.title = inPopup;
                            }

                            return nodeReturn;


                        } else if (result.length == 1) {
                            //Repetido el nodo, solo añadimos sus relaciones
                            var dataParsed_node_exist = result[0]
                            //Iterate rows and choose the edge size
                            console.log("Data Parsed exist"+dataParsed_node_exist);
                            if ($scope.vis.aggs.bySchemaName['first'].length > 1) {
                                if (metricsAgg_sizeEdge) {
                                    var value_sizeEdge = bucket[edgeSizeId];
                                    var sizeEdgeVal = Math.min($scope.vis.params.maxCutMetricSizeEdge, value_sizeEdge);
                                } else {
                                    var sizeEdgeVal = 0.1;
                                }

                               /* var relation = {
                                    keySecondNode: bucket[firstSecondBucketId],
                                    countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }*/
                             //   dataParsed_node_exist.relationWithSecondNode.push(relation);

                             //   console.log(dataParsed[i].keyFirstNode);
                           /*     if(regexpattern1.test(dataParsed_node_exist.relationsWithFirewallNode.keyFireWall)){
                                	relation2={
                                		keyFireWall: fwnodes[1].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                console.log("inside condition 1");
                                	 dataParsed_node_exist.relationsWithFirewallNode.push(relation2);
                                }
                                else if(regexpattern2.test(dataParsed_node_exist.relationsWithFirewallNode.keyFireWall)){
                                	relation2={
                                		keyFireWall: fwnodes[2].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                	 dataParsed_node_exist.relationsWithFirewallNode.push(relation2);
                                }
                                else if(regexpattern3.test(dataParsed_node_exist.relationsWithFirewallNode.keyFireWall)){
                                	relation2={
                                		keyFireWall: fwnodes[3].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                	 dataParsed_node_exist.relationsWithFirewallNode.push(relation2);
                                }
                                else if(regexpattern4.test(dataParsed_node_exist.relationsWithFirewallNode.keyFireWall)){
                                	relation2={
                                		keyFireWall: fwnodes[3].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                	 dataParsed_node_exist.relationsWithFirewallNode.push(relation2);
                                }
                                else if(regexpattern4.test(dataParsed_node_exist.relationsWithFirewallNode.keyFireWall)){
                                	relation2={
                                		keyFireWall: fwnodes[4].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                	 dataParsed_node_exist.relationsWithFirewallNode.push(relation2);
                                }
                                else{
                                    relation2={
                                		keyFireWall: fwnodes[0].key,
										countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                	 dataParsed_node_exist.relationsWithFirewallNode.push(relation2);
                                }*/
                            }
                            return undefined
                        }
                        
                    });
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    //Making new static Nodes

                    ///////////////////////////////////////////////////////////////////////BUILDING EDGES///////////////////////////////////////////////////////////////////////
                    //Clean "undefined" in the array
                    dataNodes = dataNodes.filter(Boolean);
                    console.log("Data nodes length"+dataNodes.length);
                    for(var m=0;m<dataNodes.length;m++)
                    console.log(dataNodes[m]);
                    var dataEdges = [];
                    var visited=[];
                    var visited2=[];
                    var x=0;
                    var count=0;
                    var edge={};
                    for (var n = 0; n < dataParsed.length; n++) {
                        //Find in the array the node with the keyFirstNode
                        var result = $.grep(dataNodes, function (e) { return e.key == dataParsed[n].keyFirstNode; });
                        if (result.length == 0) {
                            console.log("Error: Node not found");
                        } else if (result.length == 1) {
                            //Found the node, access to its id
                            
                            if ($scope.vis.aggs.bySchemaName['first'].length > 1) {
                                for(var r = 0; r<fwnodes.length; r++){

                                    //Find in the relations the second node to relate
                                   if(visited.indexOf(fwnodes[r].key)==-1)
                                    {
                                        visited.push(fwnodes[r].key);
                                        for(var j=0;j<fwnodes[r].firstNodeKey.length;j++)
                                        console.log("r is "+r+" j ="+j+ " "+fwnodes[r].firstNodeKey[j]);

                                  if(fwnodes[r].firstNodeKey.length>0)
                                  {
                                i++;
                                  var newf={
                                   id: i,
                                   key:fwnodes[r].key,
                                   label:fwnodes[r].key,
                                   color: $scope.vis.params.secondNodeColor,
                                            font: {
                                                color: $scope.vis.params.labelColor
                                            },
                                            shape: $scope.vis.params.shapeSecondNode

                                };
                                dataNodes.push(newf); 
                                console.log("Result 0 is"+result[0].id);
                           
                                 edge = {
                                    from: result[0].id,
                                    to: dataNodes[dataNodes.length - 1].id,
                                    value: dataParsed[n].relationsWithFirewallNode[0].widthOfEdge
                                }
                           
                            
                                dataEdges.push(edge);}
                            }
                                else{
                                    var edge2={
                                        from: result[0].id,
                                        to: dataNodes[dataNodes.length-1].id,
                                        value: dataParsed[n].relationsWithFirewallNode[0].widthOfEdge
                                    }
                                    dataEdges.push(edge2);
                                }
                                
                                if(fwnodes[r].secondNodeKey.length>0){
                                    
                                    for(var j=0;j<fwnodes[r].secondNodeKey.length;j++){
                                    i++;
                                    if(fwnodes[r].secondNodeKey[j]!=""){
                                        if(visited2.indexOf(fwnodes[r].secondNodeKey[j])==-1){
                                            visited2.push(fwnodes[r].secondNodeKey[j]);
                                        var newp={
                                        id: i,
                                        key:fwnodes[r].secondNodeKey[j],
                                        label:fwnodes[r].secondNodeKey[j],
                                        
                                   color: $scope.vis.params.secondNodeColor,
                                   font: {
                                       color: $scope.vis.params.labelColor
                                   },
                                   shape: $scope.vis.params.shapeSecondNode
                                    };

                                    console.log("New nodes are"+newp[i]);
                                    dataNodes.push(newp);
                                   
                                        }

                            }
                        }
                         //   dataEdges.push(edge3);   
                               // j++;
                              
                                 //dataNodes.push(newf); 
                                    //  const uniqueValues=[...new Set(dataNodes.map(newf => newf.key))];
                                    // console.log(uniqueValues);
                            //    console.log("Result is "+result[0]);
                                
                                    
                                  
                               

                               
                           
                            
                         /*  for (var r = 0; r < dataParsed[n].relationWithSecondNode.length; r++) {
                                    //Find in the relations the second node to relate
                                    var nodeOfSecondType = $.grep(dataNodes, function (e) { 
                                    	console.log("Node of second type parameter"+e.key)
                                    	return e.key == dataParsed[n].relationWithSecondNode[r].keySecondNode; });
                                    if (nodeOfSecondType.length == 0) {
                                        //Not found, added to the DataNodes - node of type 2
                                        i++;
                                        var newNode = {
                                            id: i,
                                            key: dataParsed[n].relationWithSecondNode[r].keySecondNode,
                                            label: dataParsed[n].relationWithSecondNode[r].keySecondNode,
                                            color: $scope.vis.params.secondNodeColor,
                                            font: {
                                                color: $scope.vis.params.labelColor
                                            },
                                            shape: $scope.vis.params.shapeSecondNode
                                        };
                                        console.log("New node is "+newNode);
                                        //Add new node
                                        dataNodes.push(newNode);
                                        //And create the relation (edge)
                                        var edge = {
                                            from: result[0].id,
                                            to: dataNodes[dataNodes.length - 1].id,
                                            value: dataParsed[n].relationWithSecondNode[r].widthOfEdge
                                        }
                                        dataEdges.push(edge);
                                    } else if (nodeOfSecondType.length == 1) {
                                        //The node exists, creates only the edge
                                        var enlace = {
                                            from: result[0].id,
                                            to: nodeOfSecondType[0].id,
                                            value: dataParsed[n].relationWithSecondNode[r].widthOfEdge
                                        }
                                        dataEdges.push(enlace);
                                    } else {
                                        console.log("Error: Multiples nodes with same id found");
                                    }
                               }*/
                    }
                         else {
                            console.log("Error: Multiples nodes with same id found");
                        }
                    }
                
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    for(var m=0;m<dataNodes.length;m++)
                    console.log(dataNodes[m]);

                    //////////////////////////////////////////////////////////Creation of the network with the library//////////////////////////////////////////////////////////
                    var nodesDataSet = new visN.DataSet(dataNodes);
                    var edgesDataSet = new visN.DataSet(dataEdges);

                    //var container = document.getElementById(network_id);
                    var container = document.getElementById(network_id);
                    container.style.height = container.getBoundingClientRect().height;
                    container.height = container.getBoundingClientRect().height;
                    var data = {
                        nodes: nodesDataSet,
                        edges: edgesDataSet
                    };
                    //CHANGE: Options controlled by user directly
                    var options_1 = {
                        height: container.getBoundingClientRect().height.toString(),
                        physics: {
                            barnesHut: {
                                gravitationalConstant: $scope.vis.params.gravitationalConstant,
                                springConstant: $scope.vis.params.springConstant
                            }
                        },
                        edges: {
                            arrowStrikethrough: false,
                            smooth: {
                                type: $scope.vis.params.smoothType
                            },
                            scaling: {
                                min: $scope.vis.params.minEdgeSize,
                                max: $scope.vis.params.maxEdgeSize
                            }
                        },
                        nodes: {
                            physics: $scope.vis.params.nodePhysics,
                            scaling: {
                                min: $scope.vis.params.minNodeSize,
                                max: $scope.vis.params.maxNodeSize
                            }
                        },
                        layout: {
                            improvedLayout: !(dataEdges.length > 200)
                        },
                        interaction: {
                            hover: true
                        }
                    };
                    switch ($scope.vis.params.posArrow) {
                        case 'from':
                            var options_2 = {
                                edges: {
                                    arrows: {
                                        from: {
                                            enabled: $scope.vis.params.displayArrow,
                                            scaleFactor: $scope.vis.params.scaleArrow,
                                            type: $scope.vis.params.shapeArrow
                                        }
                                    }
                                }
                            };
                            break;
                        case 'middle':
                            var options_2 = {
                                edges: {
                                    arrows: {
                                        middle: {
                                            enabled: $scope.vis.params.displayArrow,
                                            scaleFactor: $scope.vis.params.scaleArrow,
                                            type: $scope.vis.params.shapeArrow
                                        }
                                    }
                                }
                            };
                            break;
                        case 'to':
                            var options_2 = {
                                edges: {
                                    arrows: {
                                        to: {
                                            enabled: $scope.vis.params.displayArrow,
                                            scaleFactor: $scope.vis.params.scaleArrow,
                                            type: $scope.vis.params.shapeArrow
                                        }
                                    }
                                }
                            };
                            break;
                        default:
                            var options_2 = {
                                edges: {
                                    arrows: {
                                        from: {
                                            enabled: $scope.vis.params.displayArrow,
                                            scaleFactor: $scope.vis.params.scaleArrow,
                                            type: $scope.vis.params.shapeArrow
                                        }
                                    }
                                }
                            };
                            break;
                    }
                    var options = angular.merge(options_1, options_2);
                    console.log("Create network now");
                    var network = new visN.Network(container, data, options);
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    $scope.startDynamicResize(network);

                    network.on("afterDrawing", function (canvasP) {
                        $("#" + loading_id).hide();
                        // Draw the color legend if Node Color is activated
                        if ($scope.vis.aggs.bySchemaName['colornode'] && $scope.vis.params.showColorLegend) {
                            $scope.drawColorLegend(usedColors, colorDicc);
                        }
                    });
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    /////////////////////////////////////////////////////////////////////NODE-RELATION Type/////////////////////////////////////////////////////////////////////
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                } else if ($scope.vis.aggs.bySchemaName['first'].length == 1 && $scope.vis.aggs.bySchemaName['second']) {
                    $scope.initialShows();
                    $(".secondNode").hide();
                    // Retrieve the id of the configured tags aggregation
                    var firstFieldAggId = $scope.vis.aggs.bySchemaName['first'][0].id;
                    var secondFieldAggId = $scope.vis.aggs.bySchemaName['second'][0].id;

                    if ($scope.vis.aggs.bySchemaName['colornode']) {
                        var colorNodeAggId = $scope.vis.aggs.bySchemaName['colornode'][0].id;
                        var colorNodeAggName = $scope.vis.aggs.bySchemaName['colornode'][0].params.field.displayName;
                        var colorDicc = {};
                        var usedColors = [];

                        //Check if "Node Color" is the last selection
                        if ($scope.vis.aggs.indexOf($scope.vis.aggs.bySchemaName['colornode'][0]) <= $scope.vis.aggs.indexOf($scope.vis.aggs.bySchemaName['second'][0])) {
                            $scope.errorNodeColor();
                            return;
                        }
                    }

                    //Names of the terms that have been selected
                    var firstFieldAggName = $scope.vis.aggs.bySchemaName['first'][0].params.field.displayName;
                    var secondFieldAggName = $scope.vis.aggs.bySchemaName['second'][0].params.field.displayName;

                    // Retrieve the metrics aggregation configured
                    if ($scope.vis.aggs.bySchemaName['size_node']) {
                        var metricsAgg_sizeNode = $scope.vis.aggs.bySchemaName['size_node'][0];
                    }
                    if ($scope.vis.aggs.bySchemaName['size_edge']) {
                        var metricsAgg_sizeEdge = $scope.vis.aggs.bySchemaName['size_edge'][0];
                    }

                    // Get the buckets of that aggregation
                    var buckets = resp.rows;

                    ///////////////////////////////////////////////////////////////DATA PARSED AND BUILDING NODES///////////////////////////////////////////////////////////////
                    var dataParsed = [];
                    // Iterate the buckets
                    var i = 0;
                    var dataNodes = buckets.map(function (bucket) {
                        //New structure, needed to search after algorimt
                        var result = $.grep(dataParsed, function (e) { return e.keyNode == bucket[firstFirstBucketId]; });
                        if (result.length == 0) {
                            dataParsed[i] = {};
                            dataParsed[i].keyNode = bucket[firstFirstBucketId];

                            //Metrics are for the sizes
                            if (metricsAgg_sizeNode) {
                                // Use the getValue function of the aggregation to get the value of a bucket
                                var value = bucket[nodeSizeId];
                                var sizeVal = Math.min($scope.vis.params.maxCutMetricSizeNode, value);

                                //No show nodes under the value
                                if ($scope.vis.params.minCutMetricSizeNode > value) {
                                    dataParsed.splice(i, 1);
                                    return;
                                }
                            } else {
                                var sizeVal = 20;
                            }

                            dataParsed[i].valorSizeNode = sizeVal;
                            dataParsed[i].nodeColorValue = "default";
                            dataParsed[i].nodeColorKey = "default";
                            dataParsed[i].relationWithSecondField = []

                            //RELATION//////////////////////////////
                            if (metricsAgg_sizeEdge) {
                                var value_sizeEdge = bucket[edgeSizeId];
                                var sizeEdgeVal = Math.min($scope.vis.params.maxCutMetricSizeEdge, value_sizeEdge);
                            } else {
                                var sizeEdgeVal = 0.1;
                            }

                            //Get the color of the node, save in the dictionary
                            if (colorNodeAggId) {
                                if (colorDicc[bucket[colorBucketId]]) {
                                    dataParsed[i].nodeColorKey = bucket[colorBucketId];
                                    dataParsed[i].nodeColorValue = colorDicc[bucket[colorBucketId]];
                                } else {
                                    //repeat to find a NO-REPEATED color
                                    while (true) {
                                        var confirmColor = randomColor();
                                        if (usedColors.indexOf(confirmColor) == -1) {
                                            colorDicc[bucket[colorBucketId]] = confirmColor;
                                            dataParsed[i].nodeColorKey = bucket[colorBucketId];
                                            dataParsed[i].nodeColorValue = colorDicc[bucket[colorBucketId]];
                                            usedColors.push(confirmColor);
                                            break;
                                        }
                                    }

                                }
                            }

                            var relation = {
                                keyRelation: bucket[secondBucketId],
                                countMetric: bucket[nodeSizeId],
                                widthOfEdge: sizeEdgeVal
                            };
                            dataParsed[i].relationWithSecondField.push(relation)
                            /////////////////////////////

                            var inPopup = "<p>" + bucket[firstFirstBucketId] + "</p>"
                            if (dataParsed[i].nodeColorValue != "default") {
                                var colorNodeFinal = dataParsed[i].nodeColorValue;
                                inPopup += "<p>" + dataParsed[i].nodeColorKey + "</p>";
                            } else {
                                var colorNodeFinal = $scope.vis.params.firstNodeColor;
                            }

                            i++;
                            //Return the node totally built
                            var nodeReturn = {
                                id: i,
                                key: bucket[firstFirstBucketId],
                                color: colorNodeFinal,
                                shape: $scope.vis.params.shapeFirstNode,
                                //size: sizeVal
                                value: sizeVal,
                                font: {
                                    color: $scope.vis.params.labelColor
                                }
                            }

                            //If activated, show the labels
                            if ($scope.vis.params.showLabels) {
                                nodeReturn.label = bucket[firstFirstBucketId];
                            }

                            //If activated, show the popups
                            if ($scope.vis.params.showPopup) {
                                nodeReturn.title = inPopup;
                            }

                            return nodeReturn;
                        } else if (result.length == 1) {
                            //Repetido el nodo, solo añadimos sus relaciones
                            var dataParsed_node_exist = result[0]
                            if ($scope.vis.aggs.bySchemaName['second'].length > 0) {
                                if (metricsAgg_sizeEdge) {
                                    var value_sizeEdge = bucket[edgeSizeId];
                                    var sizeEdgeVal = Math.min($scope.vis.params.maxCutMetricSizeEdge, value_sizeEdge);
                                } else {
                                    var sizeEdgeVal = 0.1;
                                }

                                var relation = {
                                    keyRelation: bucket[secondBucketId],
                                    countMetric: bucket[nodeSizeId],
                                    widthOfEdge: sizeEdgeVal
                                }
                                dataParsed_node_exist.relationWithSecondField.push(relation)
                            }
                            return undefined
                        }
                    });
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    ///////////////////////////////////////////////////////////////////////BUILDING EDGES///////////////////////////////////////////////////////////////////////
                    //Clean "undefinded" in the array
                    dataNodes = dataNodes.filter(Boolean);
                    var dataEdges = [];

                    //Iterate parsed nodes
                    for (var n = 0; n < dataParsed.length; n++) {
                        //Obtain id of the node
                        var NodoFrom = $.grep(dataNodes, function (e) { return e.key == dataParsed[n].keyNode; });
                        if (NodoFrom.length == 0) {
                            console.log("Error: Node not found");
                        } else if (NodoFrom.length == 1) {
                            var id_from = NodoFrom[0].id;
                            //Iterate relations that have with the second field selected
                            for (var p = 0; p < dataParsed[n].relationWithSecondField.length; p++) {
                                //Iterate again the nodes
                                for (var z = 0; z < dataParsed.length; z++) {
                                    //Check that we don't compare the same node
                                    if (dataParsed[n] != dataParsed[z]) {
                                        var NodoTo = $.grep(dataNodes, function (e) { return e.key == dataParsed[z].keyNode; });
                                        if (NodoTo.length == 0) {
                                            console.log("Error: Node not found");
                                        } else if (NodoTo.length == 1) {
                                            var id_to = NodoTo[0].id;
                                            //Have relation?
                                            var sameRelation = $.grep(dataParsed[z].relationWithSecondField, function (e) { return e.keyRelation == dataParsed[n].relationWithSecondField[p].keyRelation; });
                                            if (sameRelation.length == 1) {
                                                //Nodes have a relation, creating the edge
                                                var edgeExist = $.grep(dataEdges, function (e) { return (e.to == id_from && e.from == id_to) || (e.to == id_to && e.from == id_from); });
                                                if (edgeExist.length == 0) {
                                                    //The size of the edge is the total of the common
                                                    var sizeEdgeTotal = sameRelation[0].widthOfEdge + dataParsed[n].relationWithSecondField[p].widthOfEdge;
                                                    var edge = {
                                                        from: id_from,
                                                        to: id_to,
                                                        value: sizeEdgeTotal
                                                    };
                                                    dataEdges.push(edge);
                                                }
                                            }
                                        } else {
                                            console.log("Error: Multiples nodes with same id found");
                                        }
                                    }
                                }
                            }

                        } else {
                            console.log("Error: Multiples nodes with same id found");
                        }
                    }
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    //////////////////////////////////////////////////////////Creation of the network with the library//////////////////////////////////////////////////////////
                    var nodesDataSet = new visN.DataSet(dataNodes);
                    var edgesDataSet = new visN.DataSet(dataEdges);


                    // Creation of the network
                    var container = document.getElementById(network_id);
                    //Set the Height
                    container.style.height = container.getBoundingClientRect().height;
                    container.height = container.getBoundingClientRect().height;
                    //Set the Data
                    var data = {
                        nodes: nodesDataSet,
                        edges: edgesDataSet
                    };
                    //Set the Options
                    var options = {
                        height: container.getBoundingClientRect().height.toString(),
                        physics: {
                            barnesHut: {
                                gravitationalConstant: $scope.vis.params.gravitationalConstant,
                                springConstant: $scope.vis.params.springConstant,
                                springLength: 500
                            }
                        },
                        edges: {
                            arrows: {
                                to: {
                                    enabled: $scope.vis.params.displayArrow,
                                    scaleFactor: $scope.vis.params.scaleArrow,
                                    type: $scope.vis.params.shapeArrow
                                }
                            },
                            arrowStrikethrough: false,
                            smooth: {
                                type: $scope.vis.params.smoothType
                            },
                            scaling: {
                                min: $scope.vis.params.minEdgeSize,
                                max: $scope.vis.params.maxEdgeSize
                            }
                        },
                        interaction: {
                            hideEdgesOnDrag: true,
                            hover: true
                        },
                        nodes: {
                            physics: $scope.vis.params.nodePhysics,
                            scaling: {
                                min: $scope.vis.params.minNodeSize,
                                max: $scope.vis.params.maxNodeSize
                            }
                        },
                        layout: {
                            improvedLayout: false
                        }
                    }
                    console.log("Create network now");
                    var network = new visN.Network(container, data, options);
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    $scope.startDynamicResize(network);

                    network.on("afterDrawing", function (canvasP) {
                        $("#" + loading_id).hide();
                        // Draw the color legend if Node Color is activated
                        if ($scope.vis.aggs.bySchemaName['colornode'] && $scope.vis.params.showColorLegend) {
                            $scope.drawColorLegend(usedColors, colorDicc);
                        }
                    });

                } else {
                    $scope.errorNodeNodeRelation();
                }
            });
        }
    });
});