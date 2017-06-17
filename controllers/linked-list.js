angular.module("MyApp")
  .controller("LinkedListCtrl", function($rootScope, $scope, $timeout) {
    var directiveLoaded = false;
    $scope.dimensions =  {
        w: 800,
        h: 300
    }
    $scope.animationDuration = 1000; // ms

    var w = $scope.dimensions.w;
    var h = $scope.dimensions.h;
    var square = 50;
    var edgeLength = 50;
    $scope.nodeLimit = Math.floor((w - 2 * square) / (square + edgeLength)) + 1;
    var labelHeight = 10;
    var indicesY = h/4 - square/2;
    var topY = h/2 - square/2;
    var labelY = topY - labelHeight;
    var bottomY = 3*h/4 - square/2;
    $scope.maxValue = 25;
    var animationDuration = $scope.animationDuration; // ms
    var pauseDuration = 50; // ms
    var valuesExamples = [[ 10, 15 ],
                          [ 25, 10, 16, 19, 11 ],
                          [ 5, 2, 25, 10, 18 ],
                          [ 5, 10, 16, 19, 11, 15, 20, 17 ]];
    var values = valuesExamples[1].slice();
    var elements;
    var edges;
    var indexData;
    var labelData;

    restart();

    $rootScope.$on("Directive loaded", function() {
      if (elements[0]) {
        $scope.constructInitialList(elements, edges, indexData, labelData);
      }
      directiveLoaded = true;
    });

    function restart() {
      resetScope();
      convertData();
      if (directiveLoaded) {
        $scope.constructInitialList(elements, edges, indexData, labelData);
      }
    }

    function resetScope() {
      $scope.add = {
        index: 0,
        value: Math.round(Math.random() * $scope.maxValue)
      }
      $scope.remove = {
        index: 0
      }
      $scope.animationDisabled = false;
      $scope.errorMessage = "";
      $scope.values = values;
    }

    function convertData() {
      elements = [];
      edges = [];
      indexData = [];
      labelData = [];
      values.forEach(function(val, i) {
        // elements for nodes
        var element = {
          key: i,
          value: val,
          x: calcXPosition(i),
          y: topY
        }
        elements.push(element);

        // edges for arrows
        if (i > 0) {
          var source = {
            x: elements[i-1].x + square,
            y: elements[i-1].y + square/2
          }
          var target = {
            x: elements[i].x,
            y: elements[i].y + square/2
          }
          var edge = {
            source: source,
            target: target
          }
          edges.push(edge);
        }

        // indexData for indices
        var index = {
          value: i,
          x: element.x,
          y: indicesY
        }
        indexData.push(index);
      });

      // labelData for labels
      var prevLabel = {
          text: "prev",
          x: calcXPosition(0),
          y: labelY
        }
      var nextLabel = {
        text: "next",
        x: calcXPosition(1),
        y: labelY
      }
      labelData.push(prevLabel);
      labelData.push(nextLabel);
    }

    $scope.loadElements = function(version) {
      values = valuesExamples[version].slice();
      $scope.valuesVersion = version;
      restart();
    }

    function calcXPosition(index, numberOfNodes) {
      return frame(numberOfNodes) + index * (square + edgeLength);
    }

    function frame(newNumberOfNodes) {
      var numberOfNodes = newNumberOfNodes || values.length;
      return (w - numberOfNodes * square - (numberOfNodes - 1) * edgeLength) / 2;
    }

    function animateStep(step, func) {
      $timeout(func, (animationDuration + pauseDuration) * step);
    }

    $scope.addNode = function() {
      var index = $scope.add.index;
      var value = $scope.add.value;

      $scope.animationDisabled = true;

      var currentStep = 0;
      // 1. create new node with rect and text
      // $scope.createNewNode(newElem);
      var newElem = createNewNode(index, value);
      // 2. move new node to bottom position
      animateStep(currentStep, function() {
        moveNewNodeAlong(newElem);
      });
      currentStep++;

      // 3. create new arrow (from new node to next node or from prev node to new node)
      var newEdge;
      animateStep(currentStep, function() {
        newEdge = createNewArrow(newElem);
      });

      if (index < values.length) {
        // next node exists
        animateStep(currentStep, function() {
          // 4. point new node's arrow to next node
          pointFromNewNodeToNextNode(index, newEdge);
        });
        currentStep++;
      }

      if (index > 0) {
        // prev node exists
        animateStep(currentStep, function() {
          // 5. point prev node's arrow to new node
          pointFromPrevNodeToNewNode(index, newElem, newEdge);
        });
        currentStep++;
      }

      animateStep(currentStep, function() {
        // 6. move new node into list at level above
        transformIntoNewList(index, value);
        // 7. update data, create space for new data, reposition elements as before final step
        // $scope.updateDataAndReposition(index);
        // 8. reposition as new list
        // $scope.updateVisuals();
        resetScope();
      });
    }

    function createNewNode(index, value) {
      var newElem = {
        key: index,
        value: value,
        x: 0,
        y: bottomY
      }
      $scope.createNewNode(newElem);
      return newElem;
    }

    function moveNewNodeAlong(newElem) {
      newElem.x = calcXPosition(newElem.key, values.length+1);
      $scope.updateNodePosition("newNode", [newElem]);
    }

    function createNewArrow(newElem) {
      var index = newElem.key;
      if (index == elements.length) {
        // node inserted at end of list.
        // new arrow will point from tail to new node.
        var source = elements[elements.length-1];
      } else {
        // new node inserted at beginning or middle of list.
        // new arrow will point from new node to next node.
        var source = newElem;
      }
      var source = {
        x: source.x + square,
        y: source.y + square/2
      }
      var newEdge = {
        source: source,
        target: source
      }
      $scope.createNewArrow([newEdge]);
      return newEdge;
    }

    function pointFromNewNodeToNextNode(index, newEdge) {
      var nextNode = elements[index];
      newEdge.target = {
        x: nextNode.x + square/2,
        y: nextNode.y + square
      }
      $scope.updateArrowPosition("newArrow", [newEdge]);
    }

    function pointFromPrevNodeToNewNode(index, newElem, newEdge) {
      if (index == elements.length) {
        var prevArrowID = "newArrow"
        var prevEdge = newEdge;
      } else {
        var prevArrowID = "arrow"+(index-1)+index;
        var prevEdge = edges[index-1];
      }

      prevEdge.target = {
        x: newElem.x + square/2,
        y: newElem.y
      }
      $scope.updateArrowPosition(prevArrowID, [prevEdge]);
    }

    function transformIntoNewList(index, value) {
      // create new space for new node, arrow, index in list
      $scope.appendNode();
      $scope.appendArrow();
      $scope.appendIndex();

      // insert value into values and convert into new data for svg elements
      values.splice(index, 0, value);
      convertData();

      // reposition elements as before final step and delete new elements
      repositionToBeforeFinalStep(index);
      $scope.deleteNewElements();

      convertData();
      // animate final step
      $scope.transitionToNewData(elements, edges, indexData);
    }

    function repositionToBeforeFinalStep(index) {
      var length = values.length;

      elements.forEach(function(element, i) {
        if (i < index) {
          element.x = calcXPosition(i, length-1);
        } else if (i == index) {
          element.x = calcXPosition(i, length);
        } else {
          element.x = calcXPosition(i-1, length-1);
        }
        element.y = (i == index) ? bottomY : topY;
      });

      $scope.updateAllNodes(elements);

      edges.forEach(function(edge, i) {
        if (i < index) {
          edge.source.x = calcXPosition(i, length-1) + square;
        } else if (i == index) {
          edge.source.x = calcXPosition(i, length) + square;
        } else {
          edge.source.x = calcXPosition(i-1, length-1) + square;
        }

        edge.source.y = square/2 + ((i == index) ? bottomY : topY);

        if (i == index-1) { // prevArrow
          edge.target.x = calcXPosition(i+1, length) + square/2;
        } else if (i < index) {
          edge.target.x = calcXPosition(i+1, length-1);
        } else if (i == index) { // new node's arrow
          edge.target.x = calcXPosition(i, length-1) + square/2;
        } else {
          edge.target.x = calcXPosition(i, length-1);
        }

        if (i == index-1) { // prevArrow
          edge.target.y = bottomY;
        } else if (i == index) { // new node's arrow
          edge.target.y = topY + square;
        } else {
          edge.target.y = topY + square/2;
        }
      });
      $scope.updateAllArrows(edges);
    }

    $scope.removeNode = function() {

    }
  });
