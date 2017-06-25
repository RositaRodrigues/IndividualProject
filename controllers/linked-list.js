angular.module("MyApp")
  .controller("LinkedListCtrl", function($rootScope, $scope, $timeout, Utils, $q) {
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
    var nodes;
    var arrows;
    var indices;
    var labels; // = [head, prev, next]
    var removedNode;
    var removedIndex;
    var prevArrow;
    var removedArrow;
    var headLabelIndex = 0;
    var prevLabelIndex = 1;
    var nextLabelIndex = 2;
    var xTextOffset = square/2;
    var states = [];
    var steps = [];
    var timers = [];
    var index;
    var operationType = null;
    var invisibleNewSVGElements = false;

    $scope.colour = Utils.getRandomColour();

    $rootScope.$on("Visualization loaded", function() {
      if (nodes[0]) {
        $scope.constructInitialList(nodes, arrows, indices, labels);
      }
      directiveLoaded = true;
    });

    $scope.createList = function() {
      values = [];
      for (var i = 0; i < $scope.size; i++) {
        values.push(Math.round(Math.random() * $scope.maxValue));
      }
      restart();
    }

    $scope.size = 5;
    $scope.currentStep = -1;
    $scope.createList();
    restart();

    $scope.pause = function() {
      $scope.animationRunning = false;

      timers.forEach(function(timer) {
        $timeout.cancel(timer);
      });
      timers = [];
    }

    $scope.play = function() {
      $scope.animationRunning = true;
      steps.forEach(function(step, i) {
        if (i >= $scope.currentStep) {
          var timeoutFactor = i - $scope.currentStep;
          var func = steps[i].function;
          var state = steps[i].state;
          var params = steps[i].params;
          animateStep(timeoutFactor, function() {
            func(state, params);
            $scope.currentStep++;
          });
        }
      });
      var endTime = steps.length - $scope.currentStep;
      animateStep(endTime, function() {
        $scope.animationRunning = false;
        resetScope();
      });
    }

    function skipToStep() {
      timers.forEach(function(timer) {
        $timeout.cancel(timer);
      });
      timers = [];

      var state = states[$scope.currentStep];

      if (operationType == "add") {
        if ($scope.currentStep == states.length-1) {
          loadLastAddState(state);
          $scope.setNodeVisible(index);
          if (index == values.length-1) {
            var newArrowIndex = values.length-2;
          } else {
            var newArrowIndex = index;
          }
          $scope.setArrowVisible(newArrowIndex);
          $scope.setIndexVisible(values.length-1);
        } else {
          if ($scope.currentStep == states.length-2 && index == 0) {
            loadLastAddState(state);
          } else {
            loadAddState(state);
          }
        }
      } else {
        if ($scope.currentStep == states.length-1 || ($scope.currentStep == states.length-2 && index == 0)) {
          loadLastRemoveState(state);
        } else {
          loadRemoveState(state);
        }
      }

      if (state.nodes.newNode) {
        if (state.nodes.newNode.visible) {
          $scope.setNodeVisible(index);
        } else {
          $scope.setNodeInvisible(index);
        }
      }

      if (state.arrows.newArrow) {
        if (index == values.length-1) {
          var newArrowIndex = values.length-2;
        } else {
          var newArrowIndex = index;
        }

        if (state.arrows.newArrow.visible) {
          $scope.setArrowVisible(newArrowIndex);
        } else {
          $scope.setArrowInvisible(newArrowIndex);
        }
      }

      if (state.indices.newIndex) {
        if (state.indices.newIndex.visible) {
          $scope.setIndexVisible(values.length-1);
        } else {
          $scope.setIndexInvisible(values.length-1);
        }
      }

      $scope.updateAllAndTransition(nodes, arrows, indices, labels);

      if ($scope.animationRunning) {
        animateStep(1, function() { // puts a delay to allow for transition to previous state to complete
          $scope.play();
        });
      }
    }

    function loadAddState(state) {
      var firstNode = state.nodes.first;
      var firstArrowSource = state.arrows.firstSource;
      var firstIndex = state.indices.first;
      var labelsState = state.labels;

      nodes.forEach(function(node, i) {
        if (i <= index) {
          node.x = firstNode.x + i * (square + edgeLength);
        } else {
          node.x = firstNode.x + (i-1) * (square + edgeLength);
        }
        node.y = firstNode.y;
      });
      if (state.nodes.newNode) {
        nodes[index].x = state.nodes.newNode.x;
        nodes[index].y = state.nodes.newNode.y;
      }

      arrows.forEach(function(arrow, i) {
        arrow.source.y = firstArrowSource.y;
        arrow.target.y = firstArrowSource.y;
        if (i <= index) {
          arrow.source.x = firstArrowSource.x + i * (edgeLength + square);
          arrow.target.x = firstArrowSource.x + i * (edgeLength + square) + edgeLength;
        } else {
          arrow.source.x = firstArrowSource.x + (i-1) * (edgeLength + square);
          arrow.target.x = firstArrowSource.x + (i-1) * (edgeLength + square) + edgeLength;
        }
      });
      if (state.arrows.prevArrow && index != 0) {
        arrows[index-1] = {
          source: {
            x: state.arrows.prevArrow.x1,
            y: state.arrows.prevArrow.y1
          },
          target: {
            x: state.arrows.prevArrow.x2,
            y: state.arrows.prevArrow.y2
          }
        }
      }
      if (state.arrows.newArrow && index != (values.length-1)) {
        arrows[index] = {
          source: {
            x: state.arrows.newArrow.x1,
            y: state.arrows.newArrow.y1
          },
          target: {
            x: state.arrows.newArrow.x2,
            y: state.arrows.newArrow.y2
          }
        }
      }

      indices.forEach(function(index, i) {
        index.x = firstIndex.x + i * (square + edgeLength);
        index.y = firstIndex.y;
      });
      if (state.indices.newIndex) {
        indices[values.length-1] = {
          x: state.indices.newIndex.x,
          y: state.indices.newIndex.y
        }
      }

      labels[headLabelIndex] = {
        text: "head",
        x: labelsState.head.x,
        y: labelsState.head.y
      }
      labels[prevLabelIndex] = {
        text: "prev",
        x: labelsState.prev.x,
        y: labelsState.prev.y
      }
      labels[nextLabelIndex] = {
        text: "next",
        x: labelsState.next.x,
        y: labelsState.next.y
      }
    }

    function loadLastAddState(state) {
      var firstNode = state.nodes.first;
      var firstArrowSource = state.arrows.firstSource;
      var firstIndex = state.indices.first;
      var labelsState = state.labels;

      nodes.forEach(function(node, i) {
        node.x = firstNode.x + i * (square + edgeLength);
        node.y = firstNode.y;
      });

      arrows.forEach(function(arrow, i) {
        arrow.source = {
            x: firstArrowSource.x + i * (edgeLength + square),
            y: firstArrowSource.y
          }
        arrow.target = {
            x: firstArrowSource.x + i * (edgeLength + square) + edgeLength,
            y: firstArrowSource.y
          }
      });

      indices.forEach(function(index, i) {
        index.x = firstIndex.x + i * (square + edgeLength);
        index.y = firstIndex.y;
      });

      labels[headLabelIndex] = {
        text: "head",
        x: labelsState.head.x,
        y: labelsState.head.y
      }
      labels[prevLabelIndex] = {
        text: "prev",
        x: labelsState.prev.x,
        y: labelsState.prev.y
      }
      labels[nextLabelIndex] = {
        text: "next",
        x: labelsState.next.x,
        y: labelsState.next.y
      }
    }

    function loadRemoveState(state) {
      var firstNode = state.nodes.first;
      var firstArrowSource = state.arrows.firstSource;
      var firstIndex = state.indices.first;
      var labelsState = state.labels;

      nodes.forEach(function(node, i) {
        if (i < index) {
          node.x = firstNode.x + i * (square + edgeLength);
        } else {
          node.x = firstNode.x + (i+1) * (square + edgeLength);
        }
        node.y = firstNode.y;
      });
      removedNode.x = state.nodes.removedNode.x;
      removedNode.y = state.nodes.removedNode.y;
      $scope.updateNodePositionAndTransition("newNode", [removedNode]);

      arrows.forEach(function(arrow, i) {
        arrow.source.y = firstArrowSource.y;
        arrow.target.y = firstArrowSource.y;
        if (i < index) {
          arrow.source.x = firstArrowSource.x + i * (edgeLength + square);
          arrow.target.x = firstArrowSource.x + i * (edgeLength + square) + edgeLength;
        } else {
          arrow.source.x = firstArrowSource.x + (i+1) * (edgeLength + square);
          arrow.target.x = firstArrowSource.x + (i+1) * (edgeLength + square) + edgeLength;
        }
      });
      if (state.arrows.prevArrow && index != 0 && index != (values.length-1)) {
        arrows[index-1] = {
          source: {
            x: state.arrows.prevArrow.x1,
            y: state.arrows.prevArrow.y1
          },
          target: {
            x: state.arrows.prevArrow.x2,
            y: state.arrows.prevArrow.y2
          }
        }
        prevArrow = arrows[index-1];
        $scope.updateArrowPositionAndTransition("arrow"+(index-1)+index, [prevArrow]);
      }
      if (state.arrows.removedArrow && index != (values.length-1)) {
        removedArrow = {
          source: {
            x: state.arrows.removedArrow.x1,
            y: state.arrows.removedArrow.y1
          },
          target: {
            x: state.arrows.removedArrow.x2,
            y: state.arrows.removedArrow.y2
          }
        }
      }
      // update newSVGElements arrow
      if (index == (values.length-1)) {
        $scope.updateArrowPositionAndTransition("newArrowLine", [prevArrow]);
      } else {
        $scope.updateArrowPositionAndTransition("newArrowLine", [removedArrow]);
      }

      indices.forEach(function(index, i) {
        index.x = firstIndex.x + i * (square + edgeLength);
        index.y = firstIndex.y;
      });
      removedIndex.x = state.indices.removedIndex.x;
      removedIndex.y = state.indices.removedIndex.y;
      $scope.updateIndexPositionAndTransition("newIndex", [removedIndex]);

      labels[headLabelIndex] = {
        text: "head",
        x: labelsState.head.x,
        y: labelsState.head.y
      }
      labels[prevLabelIndex] = {
        text: "prev",
        x: labelsState.prev.x,
        y: labelsState.prev.y
      }
      labels[nextLabelIndex] = {
        text: "next",
        x: labelsState.next.x,
        y: labelsState.next.y
      }

      if (state.svgElementsVisible) {
        $scope.setNewSVGElementsVisible();
      } else {
        $scope.setNewSVGElementsInvisible();
      }
    }

    function loadLastRemoveState(state) {
      var firstNode = state.nodes.first;
      var firstArrowSource = state.arrows.firstSource;
      var firstIndex = state.indices.first;
      var labelsState = state.labels;

      nodes.forEach(function(node, i) {
        node.x = firstNode.x + i * (square + edgeLength);
        node.y = firstNode.y;
      });
      removedNode.x = state.nodes.removedNode.x;
      removedNode.y = state.nodes.removedNode.y;
      $scope.updateNodePositionAndTransition("newNode", [removedNode]);

      arrows.forEach(function(arrow, i) {
        arrow.source.y = firstArrowSource.y;
        arrow.target.y = firstArrowSource.y;
        arrow.source.x = firstArrowSource.x + i * (edgeLength + square);
        arrow.target.x = firstArrowSource.x + i * (edgeLength + square) + edgeLength;
      });

      if (state.arrows.removedArrow && index != (values.length-1)) {
        removedArrow = {
          source: {
            x: state.arrows.removedArrow.x1,
            y: state.arrows.removedArrow.y1
          },
          target: {
            x: state.arrows.removedArrow.x2,
            y: state.arrows.removedArrow.y2
          }
        }
      }
      // update newSVGElements arrow
      if (index == (values.length-1)) {
        $scope.updateArrowPositionAndTransition("newArrowLine", [arrows[arrows.length-1]]);
      } else {
        $scope.updateArrowPositionAndTransition("newArrowLine", [removedArrow]);
      }

      indices.forEach(function(index, i) {
        index.x = firstIndex.x + i * (square + edgeLength);
        index.y = firstIndex.y;
      });
      removedIndex.x = state.indices.removedIndex.x;
      removedIndex.y = state.indices.removedIndex.y;
      $scope.updateIndexPositionAndTransition("newIndex", [removedIndex]);

      labels[headLabelIndex].x = labelsState.head.x;
      labels[headLabelIndex].y = labelsState.head.y;
      labels[prevLabelIndex].x = labelsState.prev.x;
      labels[prevLabelIndex].y = labelsState.prev.y;
      labels[nextLabelIndex].x = labelsState.next.x;
      labels[nextLabelIndex].y = labelsState.next.y;

      if (state.svgElementsVisible) {
        $scope.setNewSVGElementsVisible();
      } else {
        $scope.setNewSVGElementsInvisible();
      }
    }

    $scope.skipToStart = function() {
      $scope.currentStep = 0;
      skipToStep();
    }

    $scope.rewind = function() {
      $scope.currentStep--;
      skipToStep();
    }

    $scope.fastForward = function() {
      $scope.currentStep++;
      skipToStep();
    }

    $scope.skipToEnd = function() {
      $scope.currentStep = steps.length;
      skipToStep();
    }

    function clearPreviousAnimationResults() {
      states = [];
      steps = [];
      $scope.animationRunning = true;
      $scope.currentStep = -1;
      $scope.deleteNewElements();
      convertData();
      $scope.setAllVisible();
    }

    $scope.addNode = function() {
      clearPreviousAnimationResults();
      operationType = "add";
      index = $scope.add.index;
      var value = $scope.add.value;

      insertNewDataAndUpdateCollections(value);

      initAddState()
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = displayLabelState(previousState, 0, "prev", (values.length-1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: ["prev", prevLabelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = moveLabelToNodeState(previousState, 0, "prev", (values.length-1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: ["prev", prevLabelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = previousState;
            for (var i = 0; i < index-1; i++) {
              currentState = moveLabelAlongState(previousState, "prev", prevLabelIndex);
              var step = {
                function: updateLabelStep,
                state: currentState,
                params: ["prev", prevLabelIndex]
              }
              steps.push(step);
              previousState = currentState;
            }
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index < values.length-1 || values.length == 1) { // next node exists
            if (index == 0) { // "next node" is the head
              var labelName = "head";
              var labelIndex = headLabelIndex;
            } else {
              var labelName = "next";
              var labelIndex = nextLabelIndex;
            }
            var currentState = displayLabelState(previousState, index, labelName, (values.length-1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: [labelName, labelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index < values.length-1 || values.length == 1) { // next node exists
            if (index == 0) { // "next node" is the head
              var labelName = "head";
              var labelIndex = headLabelIndex;
            } else {
              var labelName = "next";
              var labelIndex = nextLabelIndex;
            }
            var currentState = moveLabelToNodeState(previousState, index, labelName, (values.length-1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: [labelName, labelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          var currentState = displayNewNodeState(previousState, index);
          var step = {
            function: displayNodeStep,
            state: currentState,
            params: [index]
          }
          steps.push(step);
          return currentState;
        })
        .then(function(previousState) {
          if (values.length > 1) { // list needs new arrow
            var currentState = displayNewArrowState(previousState, index);
            var step = {
              function: displayNewArrowStep,
              state: currentState,
              params: [index]
            }
            steps.push(step);
            return currentState;
          } else { // originally empty list so does not need an arrow
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index < values.length - 1) { // next node exists
            var currentState = pointFromNewNodeToNextNodeState(previousState);
            var step = {
              function: updateNewArrowStep,
              state: currentState,
              params: [index]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = pointFromPrevNodeToNewNodeState(previousState);
            var step = {
              function: updatePrevArrowStep,
              state: currentState,
              params: [(index-1)]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          var currentState = transformIntoBiggerListState(previousState);
          var step = {
            function: transformIntoBiggerListStep,
            state: currentState,
            params: [index]
          }
          steps.push(step);
          return currentState;
        })
        .then(function(previousState) {
          if (index == 0) { // remove head label
            var currentState = clearHeadLabelState(previousState);
            var step = {
              function: transformIntoBiggerListStep,
              state: currentState,
              params: [index]
            }
            steps.push(step);
            return currentState;
          }
        })
        .then(function() {
          $scope.lastStep = steps.length;
          $scope.currentStep = 0;
          $scope.play();
        });
    }

    function insertNewDataAndUpdateCollections(value) {
      values.splice(index, 0, value);

      $scope.appendNode();
      var newNode = {
        value: value,
        x: calcXPositionOfLinkedList(index),
        y: bottomY
      }
      nodes.splice(index, 0, newNode);
      $scope.updateAllNodes(nodes);
      $scope.setNodeInvisible(index);

      if (values.length > 1) {
        $scope.appendArrow();

        if (index == values.length-1) {
          // node inserted at end of list.
          // new arrow will point from tail to new node.
          var newArrowIndex = values.length-2;
          var sourceNode = {
            x: calcXPositionOfLinkedList(newArrowIndex, (values.length-1)),
            y: topY
          }
        } else {
          // new node inserted at beginning or middle of list.
          // new arrow will point from new node to next node.
          var newArrowIndex = index;
          var sourceNode = {
            x: newNode.x,
            y: newNode.y
          }
        }
        var source = {
          x: sourceNode.x + square,
          y: sourceNode.y + square/2
        }
        var newArrow = {
          source: source,
          target: source
        }
        arrows.splice(index, 0, newArrow);
        $scope.updateAllArrows(arrows);
        $scope.setArrowInvisible(newArrowIndex);

        $scope.updateAllLabels(labels);
      }

      $scope.appendIndex();
      var newIndex = {
        x: calcXPositionOfLinkedList(values.length-1) + xTextOffset,
        y: indicesY
      }
      indices.splice(values.length-1, 0, newIndex);
      $scope.updateAllIndices(indices);
      $scope.setIndexInvisible(values.length-1);
    }

    function initAddState() {
      return $q(function(resolve, reject) {
        var indicesState = {
          first: {
            x: calcXPositionOfLinkedList(0, (values.length-1)) + xTextOffset,
            y: indicesY
          },
          newIndex: {
            visible: false,
            x: calcXPositionOfLinkedList(values.length-1) + xTextOffset,
            y: indicesY
          }
        }

        var nodesState = {
          first: {
            x: calcXPositionOfLinkedList(0, (values.length-1)),
            y: topY,
          },
          newNode: {
            visible: false,
            x: calcXPositionOfLinkedList(index),
            y: bottomY
          }
        }

        if (index == values.length-1) {
          // node inserted at end of list.
          // new arrow will point from tail to new node.
          var sourceNode = {
            x: nodesState.first.x + (index-1) * (square + edgeLength),
            y: nodesState.first.y
          }
        } else {
          // new node inserted at beginning or middle of list.
          // new arrow will point from new node to next node.
          var sourceNode = {
            x: nodesState.newNode.x,
            y: nodesState.newNode.y
          }
        }

        var source = {
          x: sourceNode.x + square,
          y: sourceNode.y + square/2
        }

        if (index != values.length-1) {
          var prevArrow = {
            x1: nodesState.first.x + (index-1) * (edgeLength + square) + square,
            y1: nodesState.first.y + square/2,
            x2: nodesState.first.x + index * (edgeLength + square),
            y2: nodesState.first.y + square/2
          }
        } else {
          var prevArrow = {
            x1: nodesState.first.x + (index-1) * (edgeLength + square) + square,
            y1: nodesState.first.y + square/2,
            x2: nodesState.first.x + (index-1) * (edgeLength + square) + square,
            y2: nodesState.first.y + square/2
          }
        }
        var arrowsState = {
          firstSource: {
            x: nodesState.first.x + square,
            y: nodesState.first.y + square/2
          },
          newArrow: {
            visible: false,
            x1: source.x,
            y1: source.y,
            x2: source.x,
            y2: source.y
          },
          prevArrow: prevArrow
        }

        var labelsState = {
          head: { },
          prev: { },
          next: { }
        }

        var currentState = {
          indices: indicesState,
          nodes: nodesState,
          arrows: arrowsState,
          labels: labelsState
        }

        states.push(currentState);
        resolve(currentState);
      });
    }

    function displayLabelState(previousState, index, lableName, listLength) {
      var currentState = angular.copy(previousState);
      var label = currentState.labels[lableName];
      label.x = calcXPositionOfLinkedList(index, listLength) - square + xTextOffset;
      label.y = labelY;
      states.push(currentState);
      return currentState;
    }

    function updateLabelStep(state, params) {
      var labelText = params[0];
      var labelIndex = params[1];
      var label = labels[labelIndex];
      label.x = state.labels[labelText].x;
      label.y = state.labels[labelText].y;
      $scope.updateLabelPositionAndTransition(labelText+"Label", labels);
    }

    function moveLabelToNodeState(previousState, index, lableName, listLength) {
      var currentState = angular.copy(previousState);
      var label = currentState.labels[lableName];
      label.x = calcXPositionOfLinkedList(index, listLength) + xTextOffset;

      states.push(currentState);
      return currentState;
    }

    function moveLabelAlongState(previousState, labelName, labelIndex) {
      var currentState = angular.copy(previousState);
      var label = currentState.labels[labelName];
      label.x += square + edgeLength;

      states.push(currentState);
      return currentState;
    }

    function displayNewNodeState(previousState, index) {
      var currentState = angular.copy(previousState);
      currentState.nodes.newNode.visible = true;
      states.push(currentState);
      return currentState;
    }

    function displayNodeStep(state, params) {
      $scope.setNodeVisible(index);
    }

    function displayNewArrowState(previousState, index) {
      var currentState = angular.copy(previousState);
      currentState.arrows.newArrow.visible = true;
      if (index == values.length-1) {
        var firstSource = currentState.arrows.firstSource;
        currentState.arrows.prevArrow = {
          x1: firstSource.x + (index-1) * (edgeLength + square),
          y1: firstSource.y,
          x2: firstSource.x + (index-1) * (edgeLength + square),
          y2: firstSource.y
        }
      }
      states.push(currentState);
      return currentState;
    }

    function displayNewArrowStep(state) {
      if (index == values.length-1) {
        // new node inserted at end of list.
        // new arrow is from prev node to new node.
        var arrowIndex = index - 1;
      } else {
        // new node inserted at beginning or middle of list.
        // new arrow is from new node to next node.
        var arrowIndex = index;
      }
      $scope.setArrowVisible(arrowIndex);
    }

    function pointFromNewNodeToNextNodeState(previousState) {
      var currentState = angular.copy(previousState);
      var newNodeArrow = currentState.arrows.newArrow;
      var nextNode = {
        x: currentState.nodes.first.x + index * (square + edgeLength),
        y: currentState.nodes.first.y
      }

      newNodeArrow.x2 = nextNode.x + square/2;
      newNodeArrow.y2 = nextNode.y + square;

      states.push(currentState);
      return currentState;
    }

    function updateNewArrowStep(state, params) {
      var arrowIndex = params[0];
      var arrowState = state.arrows.newArrow;
      arrows[arrowIndex] = {
        source: {
          x: arrowState.x1,
          y: arrowState.y1
        },
        target: {
          x: arrowState.x2,
          y: arrowState.y2
        }
      }
      $scope.updateArrowPositionAndTransition("arrow"+arrowIndex+(arrowIndex+1), [arrows[arrowIndex]]);
    }

    function pointFromPrevNodeToNewNodeState(previousState) {
      var currentState = angular.copy(previousState);
      var firstNode = currentState.nodes.first;
      var newNode = currentState.nodes.newNode;
      currentState.arrows.prevArrow = {
        x1: firstNode.x + (index-1) * (square + edgeLength) + square,
        y1: firstNode.y + square/2,
        x2: newNode.x + square/2,
        y2: newNode.y
      }

      states.push(currentState);
      return currentState;
    }

    function updatePrevArrowStep(state, params) {
      var arrowIndex = params[0];
      var arrowState = state.arrows.prevArrow;

      var arrow = {
        source: {
          x: arrowState.x1,
          y: arrowState.y1
        },
        target: {
          x: arrowState.x2,
          y: arrowState.y2
        }
      }

      arrows[arrowIndex] = arrow;
      $scope.updateArrowPositionAndTransition("arrow"+arrowIndex+(arrowIndex+1), [arrows[arrowIndex]]);
    }

    function transformIntoBiggerListState(previousState) {
      var currentState = angular.copy(previousState);
      currentState.indices.newIndex.visible = true;
      currentState.indices.first = {
        x: calcXPositionOfLinkedList(0) + xTextOffset,
        y: indicesY
      }
      currentState.nodes.first = {
        x: calcXPositionOfLinkedList(0),
        y: topY
      }
      delete currentState.nodes.newNode;
      currentState.arrows.firstSource = {
        x: calcXPositionOfLinkedList(0) + square,
        y: topY + square/2
      }
      delete currentState.arrows.prevArrow;
      delete currentState.arrows.newArrow;

      if (index == 0) {
        currentState.labels.head = {
          text: "head",
          x: calcXPositionOfLinkedList(0) + xTextOffset,
          y: labelY
        }
      } else {
        currentState.labels.head = {
          text: "head"
        }
      }
      currentState.labels.prev = {
        text: "prev"
      }
      currentState.labels.next = {
        text: "next"
      }
      states.push(currentState);
      return currentState;
    }

    function transformIntoBiggerListStep(state, params) {
      convertData();
      labels[headLabelIndex] = state.labels.head;
      $scope.setNodeVisible(index);
      if (index == values.length-1) {
        var newArrowIndex = values.length-2;
      } else {
        var newArrowIndex = index;
      }
      $scope.setArrowVisible(newArrowIndex);
      $scope.setIndexVisible(values.length-1);
      $scope.updateAllAndTransition(nodes, arrows, indices, labels);
    }

    function clearHeadLabelState(previousState) {
      var currentState = angular.copy(previousState);
      currentState.labels.head = {
        text: "head"
      }
      states.push(currentState);
      return currentState;
    }

    $scope.removeNode = function() {
      clearPreviousAnimationResults();
      operationType = "remove";
      index = $scope.remove.index;
      removeValueAndUpdateCollections();

      initRemoveState()
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = displayLabelState(previousState, 0, "prev", (values.length+1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: ["prev", prevLabelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = moveLabelToNodeState(previousState, 0, "prev", (values.length+1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: ["prev", prevLabelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = previousState;
            for (var i = 0; i < index-1; i++) {
              currentState = moveLabelAlongState(previousState, "prev", prevLabelIndex);
              var step = {
                function: updateLabelStep,
                state: currentState,
                params: ["prev", prevLabelIndex]
              }
              steps.push(step);
              previousState = currentState;
            }
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index < values.length-1 || values.length == 1) { // next node exists
            if (index == 0) { // "next node" is the head
              var labelName = "head";
              var labelIndex = headLabelIndex;
            } else {
              var labelName = "next";
              var labelIndex = nextLabelIndex;
            }
            var currentState = displayLabelState(previousState, index, labelName, (values.length+1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: [labelName, labelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index < values.length-1 || values.length == 1) { // next node exists
            if (index == 0) { // "next node" is the head
              var labelName = "head";
              var labelIndex = headLabelIndex;
            } else {
              var labelName = "next";
              var labelIndex = nextLabelIndex;
            }
            var currentState = moveLabelToNodeState(previousState, index, labelName, (values.length+1));
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: [labelName, labelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          if (index != 0 && index < values.length-1) { // next node exists and isn't the head
            // move next label along to next next node
            var currentState = moveLabelAlongState(previousState, "next", nextLabelIndex);
            var step = {
              function: updateLabelStep,
              state: currentState,
              params: ["next", nextLabelIndex]
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          var currentState = moveNodeDownState(previousState);
          var step = {
            function: moveNodeDownStep,
            state: currentState,
            params: []
          }
          steps.push(step);
          return currentState;
        })
        .then(function(previousState) {
          if (index != 0 && index < values.length-1) { // next node exists and isn't the head
            var currentState = pointFromPrevNodeToNextNodeState(previousState);
            var step = {
              function: pointFromPrevNodeToNextNodeStep,
              state: currentState,
              params: []
            }
            steps.push(step);
            return currentState;
          } else {
            return previousState;
          }
        })
        .then(function(previousState) {
          var currentState = transformIntoSmallerListState(previousState);
          var step = {
            function: transformIntoSmallerListStep,
            state: currentState,
            params: []
          }
          steps.push(step);
          return currentState;
        })
        .then(function(previousState) {
          if (index == 0 && values.length != 0) { // remove head label
            var currentState = clearHeadLabelState(previousState);
            var step = {
              function: transformIntoSmallerListStep,
              state: currentState,
              params: [index]
            }
            steps.push(step);
            return currentState;
          }
        })
        .then(function() {
          $scope.lastStep = steps.length;
          $scope.currentStep = 0;
          $scope.play();
        });
    }

    function removeValueAndUpdateCollections() {
      // remove value from values
      values.splice(index, 1);

      // create newSVGELements for removed node/arrow/index
      // remove node/arrow/index from data models
      // delete node/arrow/index from svg collections

      removedNode = nodes[index];
      $scope.createNewNode(removedNode);
      nodes.splice(index, 1);
      $scope.deleteNode(index);
      $scope.updateAllNodes(nodes);

      if (values.length != 0) { // originally only head existed, no arrows to remove
        if (index == values.length) { // remove node from end of list and arrow before it
          removedArrow = arrows[arrows.length-1];
          arrows.splice(arrows.length-1, 1);
          $scope.deleteArrow(arrows.length);
        } else { // remove node from beginning/middle of list and arrow after it (belonging to it)
          removedArrow = arrows[index];
          arrows.splice(index, 1);
          $scope.deleteArrow(index);
        }
        $scope.createNewArrow(removedArrow);
        $scope.updateAllArrows(arrows);
      }

      removedIndex = {
        value: indices.length-1,
        x: indices[indices.length-1].x,
        y: indices[indices.length-1].y
      }
      removedIndex.value = indices.length-1;
      $scope.createNewIndex(removedIndex);
      indices.splice(indices.length-1, 1);
      $scope.deleteIndex();
      $scope.updateAllIndices(indices);

      $scope.updateAllLabels(labels);
    }

    function initRemoveState() {
      return $q(function(resolve, reject) {
        var indicesState = {
          first: {
            x: calcXPositionOfLinkedList(0, (values.length+1)) + xTextOffset,
            y: indicesY
          },
          removedIndex: {
            // visible: false,
            x: calcXPositionOfLinkedList(indices.length, (values.length+1)) + xTextOffset,
            y: indicesY
          }
        }

        var nodesState = {
          first: {
            x: calcXPositionOfLinkedList(0, (values.length+1)),
            y: topY,
          },
          removedNode: {
            // visible: false,
            x: calcXPositionOfLinkedList(index, (values.length+1)),
            y: topY
          }
        }

        if (index == values.length) {
          // node removed from end of list.
          // arrow to remove points from penultimate node to removed node.
          var sourceNode = {
            x: nodesState.first.x + (values.length-1) * (square + edgeLength),
            y: nodesState.first.y
          }
        } else {
          // node removed from beginning or middle of list.
          // arrow to remove points from removed node to next node.
          var sourceNode = {
            x: nodesState.removedNode.x,
            y: nodesState.removedNode.y
          }
        }

        var source = {
          x: sourceNode.x + square,
          y: sourceNode.y + square/2
        }

        var prevArrow = {
          x1: nodesState.first.x + (index-1) * (edgeLength + square) + square,
          y1: nodesState.first.y + square/2,
          x2: nodesState.first.x + index * (edgeLength + square),
          y2: nodesState.first.y + square/2
        }

        var arrowsState = {
          firstSource: {
            x: nodesState.first.x + square,
            y: nodesState.first.y + square/2
          },
          removedArrow: {
            // visible: false,
            x1: source.x,
            y1: source.y,
            x2: source.x + edgeLength,
            y2: source.y
          },
          prevArrow: prevArrow
        }

        var labelsState = {
          head: { },
          prev: { },
          next: { }
        }

        var currentState = {
          indices: indicesState,
          nodes: nodesState,
          arrows: arrowsState,
          labels: labelsState,
          svgElementsVisible: true
        }

        states.push(currentState);
        resolve(currentState);
      });
    }

    function moveNodeDownState(previousState) {
      var currentState = angular.copy(previousState);
      currentState.nodes.removedNode.y = bottomY;
      if (index < values.length) { // removed arrow is removeNode's arrow aka next arrow
        currentState.arrows.removedArrow = {
          x1: currentState.nodes.removedNode.x + square,
          y1: currentState.nodes.removedNode.y + square/2,
          x2: currentState.nodes.removedNode.x + square + edgeLength,
          y2: currentState.arrows.firstSource.y
        }
      } else { // remove last node, remove arrow is last arrow in list, aka prev arrow
        currentState.arrows.removedArrow = {
          x1: currentState.nodes.removedNode.x - edgeLength,
          y1: currentState.arrows.firstSource.y,
          x2: currentState.nodes.removedNode.x,
          y2: currentState.nodes.removedNode.y + square/2
        }
      }
      if (index > 0) { // prev arrow exists
        currentState.arrows.prevArrow = {
          x1: currentState.nodes.removedNode.x - edgeLength,
          y1: currentState.arrows.firstSource.y,
          x2: currentState.nodes.removedNode.x,
          y2: currentState.nodes.removedNode.y + square/2
        }
      } else {
        currentState.arrows.prevArrow = { }
      }
      states.push(currentState);
      return currentState;
    }

    function moveNodeDownStep(state) {
      removedNode.y = state.nodes.removedNode.y;
      $scope.updateNodePositionAndTransition("newNode", [removedNode]);

      if (index > 0) { // prev arrow exists
        if (index != values.length) {
          var prevArrow = arrows[index-1];
          prevArrow.target.y = removedNode.y + square/2;
          $scope.updateArrowPositionAndTransition("arrow"+(index-1)+index, [prevArrow]);
        } else {
          // (note: index == values.length means removedArrow is the prev arrow and prevArrow var does not exist)
          removedArrow.target.y = removedNode.y + square/2;
          $scope.updateArrowPositionAndTransition("newArrowLine", [removedArrow]);
        }
      }
      if (index < values.length-1) {  // next arrow exists
        removedArrow.source.y = removedNode.y + square/2;
        $scope.updateArrowPositionAndTransition("newArrowLine", [removedArrow]);
      }
    }

    function pointFromPrevNodeToNextNodeState(previousState) {
      var currentState = angular.copy(previousState);
      currentState.arrows.prevArrow = {
        x1: currentState.nodes.removedNode.x - edgeLength,
        y1: currentState.arrows.firstSource.y,
        x2: currentState.nodes.removedNode.x + square + edgeLength,
        y2: currentState.arrows.firstSource.y
      }
      states.push(currentState);
      return currentState;
    }

    function pointFromPrevNodeToNextNodeStep(state) {
      var prevArrow = arrows[index-1];
      prevArrow = {
        source: {
          x: state.arrows.prevArrow.x1,
          y: state.arrows.prevArrow.y1
        },
        target: {
          x: state.arrows.prevArrow.x2,
          y: state.arrows.prevArrow.y2
        }
      }
      $scope.updateArrowPositionAndTransition("arrow"+(index-1)+index, [prevArrow]);
    }

    function transformIntoSmallerListState(previousState) {
      var currentState = angular.copy(previousState);
      currentState.indices.first = {
        x: calcXPositionOfLinkedList(0) + xTextOffset,
        y: indicesY
      }

      currentState.nodes.first = {
        x: calcXPositionOfLinkedList(0),
        y: topY
      }

      currentState.arrows.firstSource = {
        x: calcXPositionOfLinkedList(0) + square,
        y: topY + square/2
      }

      if (index == 0 && values.length != 0) {
        currentState.labels.head = {
          text: "head",
          x: calcXPositionOfLinkedList(0) + xTextOffset,
          y: labelY
        }
      } else {
        currentState.labels.head = { text: "head" }
      }
      currentState.labels.prev = { text: "prev" }
      currentState.labels.next = { text: "next" }
      currentState.svgElementsVisible = false;

      states.push(currentState);
      return currentState;
    }

    function transformIntoSmallerListStep(state) {
      convertData();
      labels[headLabelIndex] = {
        text: "head",
        x: state.labels.head.x,
        y: state.labels.head.y
      }
      $scope.setNewSVGElementsInvisible();
      $scope.updateAllAndTransition(nodes, arrows, indices, labels);
    }

    function restart() {
      operationType = null;
      resetScope();
      convertData();
      if (directiveLoaded) {
        $scope.constructInitialList(nodes, arrows, indices, labels);
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
      nodes = [];
      arrows = [];
      indices = [];
      labels = [];
      values.forEach(function(val, i) {
        // nodes for nodes
        var element = {
          value: val,
          x: calcXPositionOfLinkedList(i),
          y: topY
        }
        nodes.push(element);

        // arrows for arrows
        if (i > 0) {
          var source = {
            x: nodes[i-1].x + square,
            y: nodes[i-1].y + square/2
          }
          var target = {
            x: nodes[i].x,
            y: nodes[i].y + square/2
          }
          var edge = {
            source: source,
            target: target
          }
          arrows.push(edge);
        }

        // indices for indices
        var index = {
          x: element.x + xTextOffset,
          y: indicesY
        }
        indices.push(index);
      });

      // labels for labels
      var headLabel = {
        text: "head"
        // x: not defined yet
        // y: not defined yet
      }
      var prevLabel = {
        text: "prev"
        // x: not defined yet
        // y: not defined yet
      }
      var nextLabel = {
        text: "next"
        // x: not defined yet
        // y: not defined yet
      }
      labels.push(headLabel);
      labels.push(prevLabel);
      labels.push(nextLabel);
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
      var timer = $timeout(func, (animationDuration + pauseDuration) * step);
      timers.push(timer);
    }


  });
