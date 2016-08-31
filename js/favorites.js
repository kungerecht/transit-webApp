//Kevin Ungerecht
//Favorites with cookies!

var COOKIE_DURATION = 30; //cookies last 30 days

$(document).ready(function() {
    cleanFavorites();
    var favoriteCookie = $.cookie('Favorites');
    if (favoriteCookie == undefined || $.isEmptyObject(favoriteCookie)) { 	//if favorites cookie doesn't exist or is empty
        $.cookie('Favorites', "", -1);					//kill the cookie
        setNoFavesMsg();
    } else { 											//favorites cookie does already exist
        printFavorites(getFavorites());
    }

    //TODO: implement favorites usage
    $(".btnFave")
        .unbind("click")
        .click(function() {
            var stopID = $(this).attr("data-id");
            var stopName = $(this).attr("id");
            console.log(stopID);
            console.log(stopName);
        });

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });

});

function addToFaves(routeName, routeId) {
    console.log(routeName);
    console.log(routeId);

    var favorites = getFavorites();
    if (favorites === undefined)
        favorites = [];

    var route = {routeID: routeId, name: routeName};
    favorites.push(route);
    cleanFavorites();
    saveFavorites(favorites);
    printFavorites(getFavorites());

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });

}

function faveExists(routeName) {
    var favorites = getFavorites();
    for (var i = 0; i < favorites.length; i++)
        if (favorites[i]["name"] === routeName)
            return true;

    return false;
}


function onFavoriteDelBtnClick(favoriteId) {

    var favorites = getFavorites();
    var newFaves = [];
    var deleting;
    var f = 0;
    do {
        if (f !== favoriteId) {
            newFaves.push(favorites[f]);
        } else {
            deleting = favorites[f];
        }
    } while (f++ < favorites.length);

    if (confirm("Are you sure you want to delete \"" + deleting["name"] + "\" from your favorites?")) {
        cleanFavorites();
        saveFavorites(newFaves);
        if (newFaves.length > 0) {
            printFavorites(getFavorites());
        } else {
            setNoFavesMsg();
        }
    }

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });
}

//cleans the favorites table
function cleanFavorites() {
    $(" #favorites ")
        .empty()
        .append('<table id="faves"></table>');
}

function saveFavorites(favorites) {
    //Save favorites array to cookie
    if ($.isEmptyObject(favorites)) {
        $.cookie('Favorites', "", -1);	//kill the cookie
    } else {
        $.cookie('Favorites', JSON.stringify(favorites), {expires: COOKIE_DURATION});
    }
}

function getFavorites() {
    var favorites = $.cookie('Favorites');
    if ($.isEmptyObject(favorites)) {
        return undefined;
    } else {
        return $.parseJSON(favorites);
    }
}

function printFavorites(favorites) {

    //Creates divs from favorites objects
    var makeFaves = function(favorites) {

        var div = '<tr class="favesRow">\
						<td id="buttonTd">\
							<button class="ui icon negative button btnDelFave" value="' + (j) + '">\
								<i class="small remove icon"></i>\
							</button>\
						</td>\
						<td class="favName"><span>' + favorites["name"] + '</span></td>';

        div += ('<td class="faveTd">\
				<button id="' + favorites["name"] + '" data-id="' + favorites["routeID"] + '" class="ui icon button btnFave">\
					<i class="bus icon"></i>\
				</button></td>');
        div += "</tr>";
        return div;
    };

    //Print cookies to the page
    for (var j = 0; j < favorites.length; j++) {
        $("#faves").append(makeFaves(favorites[j]));
    }

    $(".btnFave")
        .unbind("click")
        .click(function() {
            var stopID = $(this).attr("data-id");
            var stopName = $(this).attr("id");
            console.log(stopID);
            console.log(stopName);
        });
}

function setNoFavesMsg() {
    $("#favorites").append("<p class='faveMessage'>You have no favorite routes or stops!<br>Find stops, plan a trip, or view a route then save it to your favorites.</p>");
}


//This function is only used for debug purposes.
//It populates the favorites list with hard coded values.
function populate() {

    cleanFavorites();
    var route1 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};
    var route2 = {num: '2', stop1: "Stop1 Data", stop2: "Stop2 Data"};
    var route3 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};
    var route4 = {num: '3', stop1: "Stop1 Data", stop2: "Stop2 Data", stop3: "Stop3 Data"};

    var favorites = [
        {fname: "Home", route: route1},
        {fname: "Work", route: route2},
        {fname: "Downtown", route: route3},
        {fname: "Groceries", route: route4}
    ];
    saveFavorites(favorites);
    printFavorites(getFavorites());

    $(".btnDelFave").click(function() {
        var ddata = parseInt($(this).attr("value"));
        onFavoriteDelBtnClick(ddata);
    });
}