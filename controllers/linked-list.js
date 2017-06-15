angular.module("MyApp")
  .controller("LinkedListCtrl", function($scope) {
    $scope.dimensions =  {
        w: 800,
        h: 300
    }
    $scope.animationDuration = 1000; // ms

    var w = $scope.dimensions.w;
    var h = $scope.dimensions.h;
    var square = 50;
    var edgeLength = 50;
    var nodeLimit = Math.floor((w - 2 * square) / (square + edgeLength)) + 1;
    var topY = h/3;
    var bottomY = 2*h/3;
    var xTextOffset = square/2;
    var yTextOffset = square/2 + 7;
    $scope.maxValue = 25;
    var animationDuration = $scope.animationDuration; // ms
    var pauseDuration = 50; // ms
    var valuesExamples = [[ 10, 15 ],
                          [ 25, 10, 16, 19, 11 ],
                          [ 5, 2, 25, 10, 18 ],
                          [ 5, 10, 16, 19, 11, 15, 20, 17 ]];
    $scope.valuesVersion = 1;
    var values = valuesExamples[$scope.valuesVersion].slice();
    var elements = [];
    var edges = [];
    // TODO: change all references to elements/edges to $scope.elements/$scope.edges
    $scope.elements = elements;
    $scope.edges = edges;

    $scope.values = values; // not needed in scope
    $scope.calcXPosition = calcXPosition; // not needed in scope

    function start() {
      resetScope();
      convertData();
    }

    function resetScope() {
      console.log("resetting");
      $scope.add = {
        index: 2,
        value: Math.round(Math.random() * $scope.maxValue)
      }
      console.log($scope.add.value);
      $scope.animationDisabled = false;
      $scope.errorMessage = "";
    }

    function convertData() {
      elements = [];
      edges = [];
      var index = 0;
      values.forEach(function(val) {
        var element = {
          key: index,
          value: val,
          x: calcXPosition(index),
          y: topY
        }
        elements.push(element);

        if (index > 0) {
          var edge = {
            source: elements[index - 1],
            target: elements[index]
          }
          edges.push(edge);
        }
        index++;
      });
      $scope.elements = elements;
      $scope.edges = edges;
    }

    $scope.loadElements = function(version) {
      values = valuesExamples[version].slice();
      $scope.valuesVersion = version;
      start();
    }

    function calcXPosition(index, numberOfNodes) {
      return frame(numberOfNodes) + index * (square + edgeLength);
    }

    function frame(newNumberOfNodes) {
      var numberOfNodes = newNumberOfNodes || values.length;
      return (w - numberOfNodes * square - (numberOfNodes - 1) * edgeLength) / 2;
    }

    $scope.addNode = function() {
      if (values.length >= nodeLimit) {
        $scope.errorMessage = "Node Limit Reached";
      } else {
        $scope.errorMessage = "";

        var index = $scope.add.index;
        var value = $scope.add.value;

        $scope.animationDisabled = true;

        var newElem = {
          key: index,
          value: value,
          x: calcXPosition(index, values.length+1),
          y: topY
        }

        var currentStep = 0;
        // 1. create new node with rect and text
        $scope.createNewNode(newElem);
        // 2. move new node to bottom position
        animateStep(currentStep, function() {
          $scope.moveNewNodeAlong()
        });
        currentStep++;

        // 3. create new arrow (from new node to next node or from prev node to new node)
        animateStep(currentStep, function() {
          $scope.createNewArrow(index);
        });

        if (index < values.length) {
          // next node exists
          animateStep(currentStep, function() {
            // 4. point new node's arrow to next node
            $scope.pointFromNewNodeToNextNode();
          });
          currentStep++;
        }

        if (index > 0) {
          // prev node exists
          animateStep(currentStep, function() {
            // 5. point prev node's arrow to new node
            $scope.pointFromPrevNodeToNewNode(index);
          });
          currentStep++;
        }

        animateStep(currentStep, function() {
          // 6. insert value into values and convert into new data
          values.splice(index, 0, value);
          convertData();
          // TODO: delete after elements/edges -> $scope.elements/edges change
          $scope.elements = elements;
          $scope.edges = edges;
          // 7. update data, create space for new data, reposition elements as before final step
          $scope.updateDataAndReposition(index);
          // 8. reposition as new list
          $scope.updateVisuals();
          resetScope();
        });
      }
    }

    function animateStep(step, func) {
      setTimeout(func, (animationDuration + pauseDuration) * step);
    }

    start();
  });
