angular.module("MyApp")
  .controller("LinkedListCtrl", function($rootScope, $scope, $timeout, Utils) {
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
    var indicesY = h/4;
    var topY = h/2 - square/2;
    var labelY = topY - 5;
    var bottomY = 3*h/4 - square/2;
    $scope.maxValue = 100;
    var animationDuration = $scope.animationDuration; // ms
    var pauseDuration = 50; // ms
    var values;
    var elements;
    var edges;
    var indexData;
    var labelData; // = [head, prev, next]
    var headLabelIndex = 0;
    var prevLabelIndex = 1;
    var nextLabelIndex = 2;
    var xTextOffset = square/2;

    $scope.colour = Utils.getRandomColour();

    $rootScope.$on("Visualization loaded", function() {
      if (elements[0]) {
        $scope.constructInitialList(elements, edges, indexData, labelData);
      }
      directiveLoaded = true;
    });

    $scope.createList = function() {
      if ($scope.size) {
        values = [];
        for (var i = 0; i < $scope.size; i++) {
          values.push(Math.round(Math.random() * $scope.maxValue));
        }
        restart();
      }
    }

    $scope.size = 5;
    $scope.createList();
    restart();

    function restart() {
      resetScope();
      convertData();
      if (directiveLoaded) {
        $scope.constructInitialList(elements, edges, indexData, labelData);
      }
    }

    function resetScope() {
      $scope.size = 0;
      $scope.create = {
        size: 0
      }
      $scope.add = {
        index: 0,
        value: Math.round(Math.random() * $scope.maxValue),
      }
      $scope.remove = {
        index: 0
      }
      $scope.animationRunning = false;
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
          value: val,
          x: calcXPositionOfLinkedList(i),
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
          x: element.x + xTextOffset,
          y: indicesY
        }
        indexData.push(index);
      });

      // labelData for labels
      var headLabel = {
        text: "head"
        // x: not defined yet,
        // y: not defined yet
      }
      var prevLabel = {
          text: "prev"
          // x: not defined yet,
          // y: not defined yet
      }
      var nextLabel = {
        text: "next"
        // x: not defined yet,
        // y: not defined yet
      }
      labelData.push(headLabel);
      labelData.push(prevLabel);
      labelData.push(nextLabel);
    }

    function calcXPositionOfLinkedList(index, numberOfNodes) {
      return frameLinkedList(numberOfNodes) + index * (square + edgeLength);
    }

    function calcXPositionOfArray(index, numberOfNodes) {
      return frameArray(numberOfNodes) + index * square;
    }

    function frameLinkedList(newNumberOfNodes) {
      var numberOfNodes = newNumberOfNodes || values.length;
      return (w - numberOfNodes * square - (numberOfNodes - 1) * edgeLength) / 2;
    }

    function frameArray(newNumberOfNodes) {
      var numberOfNodes = newNumberOfNodes || values.length;
      return (w - numberOfNodes * square) / 2;
    }

    function animateStep(step, func) {
      $timeout(func, (animationDuration+pauseDuration)*step);
    }

    $scope.addNode = function() {
      var index = $scope.add.index;
      var value = $scope.add.value;

      $scope.animationRunning = true;

      var currentStep = 0;
      if (index > 0) { // prev node exists
        displayLabel(0, "prevLabel", prevLabelIndex);
        currentStep++;

        animateStep(currentStep, function() {
          moveLabelToNode(0, "prevLabel", prevLabelIndex);
        });
        currentStep++;

        for (var i = 0; i < index-1; i++) {
          // move label along each node until prev node
          animateStep(currentStep, function() {
            moveLabelAlong("prevLabel", prevLabelIndex);
          });
          currentStep++;
        }
      }

      if (index < values.length) { // next node exists
        if (index == 0) { // "next node" is the head
          var labelText = "headLabel";
          var labelIndex = headLabelIndex;
        } else {
          var labelText = "nextLabel";
          var labelIndex = nextLabelIndex;
        }
        animateStep(currentStep, function() {
          displayLabel(index, labelText, labelIndex);
        });
        currentStep++;

        animateStep(currentStep, function() {
          moveLabelToNode(index, labelText, labelIndex);
        });
        currentStep++;
      }

      // create new node with rect and text
      var newElem;
      animateStep(currentStep, function() {
        newElem = createNewNode(index, value);
      });
      currentStep++;

      if (values.length > 0) { // new arrow needed
        // create new arrow (from new node to next node or from prev node to new node)
        var newEdge;
        animateStep(currentStep, function() {
          newEdge = createNewArrow(newElem);
        });

        if (index < values.length) { // next node exists
          animateStep(currentStep, function() {
            // point new node's arrow to next node
            pointFromNewNodeToNextNode(index, newEdge);
          });
          currentStep++;
        }

        if (index > 0) { // prev node exists
          animateStep(currentStep, function() {
            // point prev node's arrow to new node
            pointFromPrevNodeToNewNode(index, newElem, newEdge);
          });
          currentStep++;
        }
      }

      animateStep(currentStep, function() {
        transformIntoBiggerList(index, value);
        resetScope();
      });
      currentStep++;

      // clear head label if needed
      if (index == 0) {
        animateStep(currentStep, function() {
          labelData[headLabelIndex] = {
            text: "head"
          }
          $scope.updateLabelPosition("headLabel", labelData);
        });
      }
    }

    function displayLabel(index, labelText, labelIndex) {
      var label = labelData[labelIndex];
      label.x = calcXPositionOfLinkedList(index) - square + xTextOffset;
      label.y = labelY;
      $scope.updateLabelPosition(labelText, labelData);
    }

    function moveLabelToNode(index, labelText, labelIndex) {
      var label = labelData[labelIndex];
      label.x = calcXPositionOfLinkedList(index) + xTextOffset;
      label.y = labelY;
      $scope.updateLabelPosition(labelText, labelData);
    }

    function moveLabelAlong(labelText, labelIndex) {
      var label = labelData[labelIndex];
      label.x += square + edgeLength;
      $scope.updateLabelPosition(labelText, labelData);
    }

    function createNewNode(index, value) {
      var newElem = {
        key: index,
        value: value,
        x: calcXPositionOfLinkedList(index, values.length+1),
        y: bottomY
      }
      $scope.createNewNode(newElem);
      $scope.updateNodePosition("newNode", [newElem]);
      return newElem;
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

    function transformIntoBiggerList(index, value) {
      // create new space for new node, arrow, index in list
      $scope.appendNode();
      if (values.length > 0) {
        $scope.appendArrow();
      }
      $scope.appendIndex();

      // insert value into values and convert into new data for svg elements
      values.splice(index, 0, value);
      convertData();

      // reposition elements as before final step and delete new elements
      repositionToBeforeFinalAddStep(index);
      $scope.deleteNewElements();

      convertData();
      // animate final step
      if (index == 0) {
        var headLabel = labelData[headLabelIndex];
        headLabel.x = calcXPositionOfLinkedList(0, values.length) + xTextOffset;
        headLabel.y = labelY;
      }
      $scope.updateAllNodesAndTransition(elements);
      $scope.updateAllArrowsAndTransition(edges);
      $scope.updateAllIndicesAndTransition(indexData);
      $scope.updateAllLabelsAndTransition(labelData);
    }

    function repositionToBeforeFinalAddStep(index) {
      var length = values.length;

      elements.forEach(function(element, i) {
        if (i < index) {
          element.x = calcXPositionOfLinkedList(i, length-1);
        } else if (i == index) {
          element.x = calcXPositionOfLinkedList(i, length);
        } else {
          element.x = calcXPositionOfLinkedList(i-1, length-1);
        }
        element.y = (i == index) ? bottomY : topY;
      });

      $scope.updateAllNodes(elements);

      edges.forEach(function(edge, i) {
        if (i < index) {
          edge.source.x = calcXPositionOfLinkedList(i, length-1) + square;
        } else if (i == index) {
          edge.source.x = calcXPositionOfLinkedList(i, length) + square;
        } else {
          edge.source.x = calcXPositionOfLinkedList(i-1, length-1) + square;
        }

        edge.source.y = square/2 + ((i == index) ? bottomY : topY);

        if (i == index-1) { // prevArrow
          edge.target.x = calcXPositionOfLinkedList(i+1, length) + square/2;
        } else if (i < index) {
          edge.target.x = calcXPositionOfLinkedList(i+1, length-1);
        } else if (i == index) { // new node's arrow
          edge.target.x = calcXPositionOfLinkedList(i, length-1) + square/2;
        } else {
          edge.target.x = calcXPositionOfLinkedList(i, length-1);
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
      var index = $scope.remove.index;

      if (index) {
        $scope.animationRunning = true;
        var currentStep = 0;

        if (index > 0) { // prev node exists
          // display prev label
          animateStep(currentStep, function() {
            displayLabel(0, "prevLabel", prevLabelIndex);
          });
          currentStep++;

          animateStep(currentStep, function() {
            moveLabelToNode(0, "prevLabel", prevLabelIndex);
          });
          currentStep++;

          // move prev label along to prev node
          for (var i = 0; i < index-1; i++) {
            animateStep(currentStep, function() {
              moveLabelAlong("prevLabel", prevLabelIndex);
            });
            currentStep++;
          }
        }

        // display next label if next next node exists or removing head
        if (index == 0 || index < values.length-1) {
          if (index == 0) { // "next node" is head
          var labelText = "headLabel";
          var labelIndex = headLabelIndex;
        } else { // next next node exists
          var labelText = "nextLabel";
          var labelIndex = nextLabelIndex;
        }
        animateStep(currentStep, function() {
          displayLabel(index, labelText, labelIndex);
        });
        currentStep++;

        animateStep(currentStep, function() {
          moveLabelToNode(index, labelText, labelIndex);
        });
        currentStep++;
      }

      if (index != 0 && index < values.length-1) {
        // move next label along to next next node
        animateStep(currentStep, function() {
          moveLabelAlong("nextLabel", nextLabelIndex);
        });
        currentStep++;
      }

      // move node(#index) down to bottom level
      animateStep(currentStep, function() {
        moveNodeDown(index);
      });
      currentStep++;

      if (index != 0 && index < values.length-1) { // prev and next arrows exists
        // point prev node to next node
        animateStep(currentStep, function() {
          pointFromPrevNodeToNextNode(index);
        });
        currentStep++;
      }

      // transform into smaller list and delete node(#index)
      animateStep(currentStep, function() {
        transformIntoSmallerList(index);
        resetScope();
      });
      currentStep++;

      // clear head label if needed
      if (index == 0) {
        animateStep(currentStep, function() {
          labelData[headLabelIndex] = {
            text: "head"
          }
          $scope.updateLabelPosition("headLabel", labelData);
        });
      }
      }
    }

    function moveNodeDown(index) {
      var node = elements[index];
      node.y = bottomY;
      $scope.updateNodePosition("node"+index, [node]);

      if (index > 0) { // prev arrow exists
        var prevArrow = edges[index-1];
        prevArrow.target.y = node.y + square/2;
        $scope.updateArrowPosition("arrow"+(index-1)+index, [prevArrow]);
      }
      if (index < values.length-1) {  // next arrow exists
        var nextNode = elements[index+1];
        var nextArrow = edges[index];
        nextArrow.source.y = node.y + square/2;
        $scope.updateArrowPosition("arrow"+index+(index+1), [nextArrow]);
      }
    }

    function pointFromPrevNodeToNextNode(index) {
      var nextNode = elements[index+1];
      var prevArrow = edges[index-1];
      prevArrow.target.x = nextNode.x;
      prevArrow.target.y = nextNode.y + square/2;
      $scope.updateArrowPosition("arrow"+(index-1)+index, [prevArrow]);
    }

    function transformIntoSmallerList(index) {
      // delete node#index, arrow#index#(index+1)/arrow#(index-1)#index, index#index
      $scope.deleteNode(index);
      $scope.deleteIndex(index);
      if (index == values.length-1) { // delete prev arrow
        $scope.deleteArrow(index-1);
      } else { // delete next arrow
        $scope.deleteArrow(index);
      }

      values.splice(index, 1);
      convertData();

      // animate final step
      if (index == 0 && values.length != 0) {
        var headLabel = labelData[headLabelIndex];
        headLabel.x = calcXPositionOfLinkedList(0, values.length) + xTextOffset;
        headLabel.y = labelY;
      }
      $scope.updateAllNodesAndTransition(elements);
      $scope.updateAllArrowsAndTransition(edges);
      $scope.updateAllIndicesAndTransition(indexData);
      $scope.updateAllLabelsAndTransition(labelData);

    }

  });
