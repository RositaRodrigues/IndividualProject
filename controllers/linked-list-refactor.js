angular.module("MyApp")
  .controller("LinkedListRefactorCtrl", function($rootScope, $scope, $timeout, Utils, $q) {
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
    var headLabelIndex = 0;
    var prevLabelIndex = 1;
    var nextLabelIndex = 2;
    var xTextOffset = square/2;
    var states = [];
    var steps = [];
    var timers = [];
    var index;

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
      });
    }

    function skipToStep() {
      timers.forEach(function(timer) {
        $timeout.cancel(timer);
      });
      timers = [];

      var state = states[$scope.currentStep];
      loadState(state);

      if (state.nodes.newNode.visible) {
        $scope.setNodeVisible(index);
      } else {
        $scope.setNodeInvisible(index);
      }

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

      if (state.indices.newIndex.visible) {
        $scope.setIndexVisible(values.length-1);
      } else {
        $scope.setIndexInvisible(values.length-1);
      }

      $scope.updateAllAndTransition(nodes, arrows, indices, labels);

      if ($scope.animationRunning) {
        animateStep(1, function() { // puts a delay to allow for transition to previous state to complete
          $scope.play();
        });
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

    $scope.addNode = function() {
      index = $scope.add.index;
      var value = $scope.add.value;
      $scope.animationRunning = true;

      insertNewDataAndUpdateCollections(value);

      initState()
        .then(function(previousState) {
          if (index > 0) { // prev node exists
            var currentState = displayLabelState(previousState, 0, "prev");
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
            var currentState = moveLabelToNodeState(previousState, 0, "prev");
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
          if (index < values.length-1) { // next node exists
            if (index == 0) { // "next node" is the head
              var labelName = "head";
              var labelIndex = headLabelIndex;
            } else {
              var labelName = "next";
              var labelIndex = nextLabelIndex;
            }
            var currentState = displayLabelState(previousState, index, labelName);
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
          if (index < values.length-1) { // next node exists
            if (index == 0) { // "next node" is the head
              var labelName = "head";
              var labelIndex = headLabelIndex;
            } else {
              var labelName = "next";
              var labelIndex = nextLabelIndex;
            }
            var currentState = moveLabelToNodeState(previousState, index, labelName);
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
          var currentState = displayNewArrowState(previousState, index);
          var step = {
            function: displayNewArrowStep,
            state: currentState,
            params: [index]
          }
          steps.push(step);
          return currentState;
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
        .then(function() {
          $scope.lastStep = steps.length;
          $scope.currentStep = 0;
          $scope.play();
        });

    }

    function loadState(state) {
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

      if (state.arrows.prevArrow) {
        arrows[index-1].source.x = state.arrows.prevArrow.x1;
        arrows[index-1].source.y = state.arrows.prevArrow.y1;
        arrows[index-1].target.x = state.arrows.prevArrow.x2;
        arrows[index-1].target.y = state.arrows.prevArrow.y2;
      }
      if (state.arrows.newArrow && index != (values.length-1)) {
        arrows[index].source.x = state.arrows.newArrow.x1;
        arrows[index].source.y = state.arrows.newArrow.y1;
        arrows[index].target.x = state.arrows.newArrow.x2;
        arrows[index].target.y = state.arrows.newArrow.y2;
      }

      indices.forEach(function(index, i) {
        index.x = firstIndex.x + i * (square + edgeLength);
        index.y = firstIndex.y;
      });
      if (state.indices.newIndex) {
        indices[values.length-1].x = state.indices.newIndex.x;
        indices[values.length-1].y = state.indices.newIndex.y;
      }

      labels[headLabelIndex].x = labelsState.head.x;
      labels[headLabelIndex].y = labelsState.head.y;
      labels[prevLabelIndex].x = labelsState.prev.x;
      labels[prevLabelIndex].y = labelsState.prev.y;
      labels[nextLabelIndex].x = labelsState.next.x;
      labels[nextLabelIndex].y = labelsState.next.y;
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

      if (values.length > 0) {
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

    function initState() {
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

    function displayLabelState(previousState, index, lableName) {
      var currentState = angular.copy(previousState);
      var label = currentState.labels[lableName];
      label.x = calcXPositionOfLinkedList(index, (values.length-1)) - square + xTextOffset;
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

    function moveLabelToNodeState(previousState, index, lableName) {
      var currentState = angular.copy(previousState);
      var label = currentState.labels[lableName];
      label.x = calcXPositionOfLinkedList(index, (values.length-1)) + xTextOffset;

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
        x: calcXPositionOfLinkedList(0),
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
      currentState.arrows.prevArrow = null;
      currentState.arrows.newArrow = null;

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
      $scope.setIndexVisible(values.length-1);
      $scope.updateAllAndTransition(nodes, arrows, indices, labels);

    }

    function restart() {
      resetScope();
      convertData();
      if (directiveLoaded) {
        $scope.constructInitialList(nodes, arrows, indices, labels);
      }
    }

    function resetScope() {
      $scope.currentStep = -1;
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
