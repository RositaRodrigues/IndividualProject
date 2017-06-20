angular.module('MyApp')
	.factory('Utils', function() {
    var colours = ["#3498db", "#2980b9", "#8e44ad", "#9b59b6",
                   "#e74c3c", "#c0392b", "#f39c12", "#f1c40f",
                   "#2ecc71", "#27ae60", "#16a085", "#1abc9c",
                   "#d35400", "#e67e22"];

		return {
			getRandomColour: function() {
        var randomIndex = Math.round(Math.random() * colours.length);
				return colours[randomIndex];
			}

		};

	});
