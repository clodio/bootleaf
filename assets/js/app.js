var map, featureList, boroughSearch = [],  siteSearch = [],site_dataSearch = [];

//http://localhost:8080/bootleaf/?style_map_color=&style_map_size=&heatmap_blur=&heatmap_radius=&url=&data_request=%7B%0D%0A++%22query%22%3A+%7B%0D%0A++++%22filtered%22%3A+%7B%0D%0A++++++%22query%22%3A+%7B%0D%0A++++++++%22query_string%22%3A+%7B%0D%0A++++++++++%22analyze_wildcard%22%3A+true%2C%0D%0A++++++++++%22query%22%3A+%22*%22%0D%0A++++++++%7D%0D%0A++++++%7D%2C%0D%0A++++++%22filter%22%3A+%7B%0D%0A++++++++%22bool%22%3A+%7B%0D%0A++++++++++%22must%22%3A+%5B%0D%0A++++++++++++%7B%0D%0A++++++++++++++%22range%22%3A+%7B%0D%0A++++++++++++++++%22%40timestamp%22%3A+%7B%0D%0A++++++++++++++++++%22gte%22%3A+1420066800000%2C%0D%0A++++++++++++++++++%22lte%22%3A+1451602799999%0D%0A++++++++++++++++%7D%0D%0A++++++++++++++%7D%0D%0A++++++++++++%7D%0D%0A++++++++++%5D%2C%0D%0A++++++++++%22must_not%22%3A+%5B%5D%0D%0A++++++++%7D%0D%0A++++++%7D%0D%0A++++%7D%0D%0A++%7D%2C%0D%0A++%22size%22%3A+0%2C%0D%0A++%22aggs%22%3A+%7B%0D%0A++++%22my_agg%22%3A+%7B%0D%0A++++++%22terms%22%3A+%7B%0D%0A++++++++%22field%22%3A+%22regate.raw%22%2C%0D%0A++++++++%22size%22%3A+0%0D%0A++++++%7D%2C%0D%0A++++++%22aggs%22%3A+%7B%0D%0A++++++++%22sub_agg%22%3A+%7B%0D%0A++++++++++%22cardinality%22%3A+%7B%0D%0A++++++++++++%22field%22%3A+%22response.raw%22%0D%0A++++++++++%7D%0D%0A++++++++%7D%2C%0D%0A++++++++%22sub_sub_agg%22%3A+%7B%0D%0A++++++++++%22terms%22%3A+%7B%0D%0A++++++++++++%22field%22%3A+%22verb.raw%22%2C%0D%0A++++++++++++%22size%22%3A+0%0D%0A++++++++++%7D%2C%0D%0A++++++++++%22aggs%22%3A+%7B%0D%0A++++++++++++%22sub_agg%22%3A+%7B%0D%0A++++++++++++++%22cardinality%22%3A+%7B%0D%0A++++++++++++++++%22field%22%3A+%22response.raw%22%0D%0A++++++++++++++%7D%0D%0A++++++++++++%7D%0D%0A++++++++++%7D%0D%0A++++++++%7D%0D%0A++++++%7D%0D%0A++++%7D%0D%0A++%7D%0D%0A%7D



//d3pie
function defineFeature(feature, latlng) {
   //todo change in d3pie

	if (!feature.properties.data) {
	  	//si pas de données, affiche un point et pas un pie
		return L.circleMarker(latlng, {
					    radius: 3,
					    fillColor: "#111",
					    color: "#fff",
					    weight: 1,
					    opacity: 0.9,
					    fillOpacity: 0.9
					}
		);
	}
	var key_value_cluster =[];
	var sumCluster =0;
	//addaptation du format de données pour d3
	for (var key in feature.properties.data) {
	    if (key === 'length' || !feature.properties.data.hasOwnProperty(key)) continue;
	    	var value = feature.properties.data[key];
		if (!key_value_cluster[key]) {
			key_value_cluster[key]=[];
		}
		key_value_cluster[key].push(value);
		sumCluster= sumCluster +value;
	}

	// adapt format to match d3 data
	var key_value_final = [];	
	for (var key in key_value_cluster) {
	    if (key === 'length' || !key_value_cluster.hasOwnProperty(key)) continue;
	    	var value = key_value_cluster[key];
		key_value_final.push({"key":key,"values":key_value_cluster[key]} );
	}


    var  n = sumCluster,//  sum of values
        strokeWidth = 1, //Set clusterpie stroke width
        r = rmax-2*strokeWidth-(n<10?12:n<100?8:n<1000?4:0), //Calculate clusterpie radius...

        iconDim = (r+strokeWidth)*2, //...and divIcon dimensions (leaflet really want to know the size)
        
        //bake some svg markup
        html = bakeThePie({data: key_value_final, 
                valueFunc: function(d){
					var count = 0;
					var nbItem = d.values.length;
					for(var i = 0; i < nbItem; i++)	{
						count = count + d.values[i];
					}
					return count;
			    },
                strokeWidth: 1,
                outerRadius: r,
                innerRadius: r-10,
                pieClass: 'cluster-pie',
                pieLabel: n,
                pieLabelClass: 'marker-cluster-pie-label',
                pathClassFunc: function(d){
					// donne le style du sous bloc de pie				
					return "category-"+metadata.data[d.data.key];
			    },
                pathTitleFunc: function(d){
					//affiche le texte sur survol d'un pie
					var sumValues = 0;
					var countValues = d.data.values.length;
					for(var i = 0; i < countValues; i++) {
						sumValues = sumValues + d.data.values[i];
					}
					return d.data.key +' ('+sumValues+')';
			    }
        }),
        //Create a new divIcon and assign the svg markup to the html property
        myIcon = new L.DivIcon({
            html: html,
            className: 'marker-cluster', 
            iconSize: new L.Point(iconDim, iconDim)
        });
     return L.marker(latlng, {icon: myIcon});

}

function defineFeaturePopup(feature, layer) {

	var props = feature.properties,
    fields = metadata.data;
    
	var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Code Regate</th><td><a href='http://www.source-organisation.courrier.intra.laposte.fr:8080/ebx/?redirect=/source-organisation/view/close.jsp&branch=BrancheSourceOrganisation&instance=InstanceSourceOrganisation&xpath=/root/D_ENTITE/T_ENTITE[./i_CODE="+ feature.properties.id +"]' target='_blanck'>" + feature.properties.regate_code + "</a></td></tr>" + "<tr><th>Nom</th><td>" + feature.properties.entity_name + "</td></tr>";
	for( var key in feature.properties.data) {
		if (key === 'length' || !feature.properties.data.hasOwnProperty(key)) continue;		
		content = content +"<tr><th>"+key+"</th><td>" + feature.properties.data[key] + "</td></tr>";
	}

	content = content +"<table><iframe src=\"http://localhost:5601/#/dashboard/New-Dashboard?embed&_g=(refreshInterval:(display:Off,section:0,value:0),time:(from:'2015-05-29T13:01:13.587Z',mode:absolute,to:'2015-05-29T14:03:40.226Z'))&_a=(filters:!(),panels:!((col:1,id:carto1,row:1,size_x:3,size_y:2,type:visualization),(col:4,id:facet,row:1,size_x:3,size_y:2,type:visualization),(col:7,id:New-Visualization,row:1,size_x:3,size_y:2,type:visualization)),query:(query_string:(analyze_wildcard:!t,query:'*')),title:'New%20Dashboard')\" height=\"600\" width=\"800\"></iframe>";

	layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.regate_code + " " +feature.properties.entity_name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

        }
      });

}

function defineClusterIcon(cluster) {
//var key_value = [
//   {
//      "key": "1",
//      "values": [
//         {
//            "value": 5
//         },
//         {
 ////           "value": 6
//         }
//      ]
//   },
//   {
//      "key": "2",
//      "values": [
//         {
//            "value": 5
////         }
 //     ]
////   }
//]


    var children = cluster.getAllChildMarkers();
	
	// calculate d3 data with key values of the childrens
	var key_value_cluster = {};
	var sumCluster = 0;
	var nbChildren = children.length;
	for(var i = 0; i < nbChildren; i++) {
		for (var key in children[i].feature.properties.data) {
		    if (key === 'length' || !children[i].feature.properties.data.hasOwnProperty(key)) continue;
		    	var value = children[i].feature.properties.data[key];
			if (!key_value_cluster[key]) {
				key_value_cluster[key]=[];
			}
			key_value_cluster[key].push(value);
			sumCluster= sumCluster +value;
		}
	}
	// adapt format to match d3 data
	var key_value_final = [];	
	for (var key in key_value_cluster) {
	    if (key === 'length' || !key_value_cluster.hasOwnProperty(key)) continue;
	    	var value = key_value_cluster[key];
		key_value_final.push({"key":key,"values":key_value_cluster[key]} );
	}
	
    //sumCluster sommme des valeurs
    var  n = sumCluster,//  sum of childrens value.   //old children.length, 
        strokeWidth = 1, //Set clusterpie stroke width
        r = rmax-2*strokeWidth-(n<10?12:n<100?8:n<1000?4:0), //Calculate clusterpie radius...

        iconDim = (r+strokeWidth)*2, //...and divIcon dimensions (leaflet really want to know the size)
        
        //bake some svg markup
        html = bakeThePie({data: key_value_final,
                valueFunc: function(d){
							var count = 0;
							var nbItem = d.values.length;
							for(var i = 0; i < nbItem; i++)
							{
								count = count + d.values[i];
							}

							return count;
			    },
                strokeWidth: 1,
                outerRadius: r,
                innerRadius: r-10,
                pieClass: 'cluster-pie',
                pieLabel: n,
                pieLabelClass: 'marker-cluster-pie-label',
                pathClassFunc: function(d) {
					// donne le style du sous bloc de pie				
					return "category-"+metadata.data[d.data.key];
				},
                pathTitleFunc: function(d){
					//affiche le texte sur survol d'un pie
					var sumValues = 0;
					var countValues = d.data.values.length;
					for(var i = 0; i < countValues; i++) {
						sumValues = sumValues + d.data.values[i];
					}
					return d.data.key +' ('+sumValues+')';
			    }
				//return metadata.fields[categoryField].lookup[d.data.key]+' ('+d.data.values.length+' accident'+(d.data.values.length!=1?'s':'')+')';}
        }),
        //Create a new divIcon and assign the svg markup to the html property
        myIcon = new L.DivIcon({
            html: html,
            className: 'marker-cluster', 
            iconSize: new L.Point(iconDim, iconDim)
        });
    return myIcon;
}






/*function that generates a svg markup for the pie chart*/
function bakeThePie(options) {
    /*data and valueFunc are required*/
    if (!options.data || !options.valueFunc) {
        return '';
    }
    var data = options.data,
        valueFunc = options.valueFunc,
        r = options.outerRadius?options.outerRadius:28, //Default outer radius = 28px
        rInner = options.innerRadius?options.innerRadius:r-10, //Default inner radius = r-10
        strokeWidth = options.strokeWidth?options.strokeWidth:1, //Default stroke is 1
        pathClassFunc = options.pathClassFunc?options.pathClassFunc:function(){return '';}, //Class for each path
        pathTitleFunc = options.pathTitleFunc?options.pathTitleFunc:function(){return '';}, //Title for each path
        pieClass = options.pieClass?options.pieClass:'marker-cluster-pie', //Class for the whole pie
        pieLabel = options.pieLabel?options.pieLabel:d3.sum(data,valueFunc), //Label for the whole pie
        pieLabelClass = options.pieLabelClass?options.pieLabelClass:'marker-cluster-pie-label',//Class for the pie label
        
        origo = (r+strokeWidth), //Center coordinate
        w = origo*2, //width and height of the svg element
        h = w,
        donut = d3.layout.pie(),
        arc = d3.svg.arc().innerRadius(rInner).outerRadius(r);
        
    //Create an svg element
    var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
    //Create the pie chart
    var vis = d3.select(svg)
        .data([data])
        .attr('class', pieClass)
        .attr('width', w)
        .attr('height', h);
        
    var arcs = vis.selectAll('g.arc')
        .data(donut.value(valueFunc))
        .enter().append('svg:g')
        .attr('class', 'arc')
        .attr('transform', 'translate(' + origo + ',' + origo + ')');
    
    arcs.append('svg:path')
        .attr('class', pathClassFunc)
        .attr('stroke-width', strokeWidth)
        .attr('d', arc)
        .append('svg:title')
          .text(pathTitleFunc);
                
    vis.append('text')
        .attr('x',origo)
        .attr('y',origo)
        .attr('class', pieLabelClass)
        .attr('text-anchor', 'middle')
        //.attr('dominant-baseline', 'central')
        /*IE doesn't seem to support dominant-baseline, but setting dy to .3em does the trick*/
        .attr('dy','.3em')
        .text(pieLabel);
    //Return the svg-markup rather than the actual element
    return serializeXmlNode(svg);
}


/*Function for generating a legend with the same categories as in the clusterPie*/
function renderTitle(title) {
    //var data = d3.entries(metadata.data);
	if (title !== "") {
	 var titlediv = d3.select('#map').append('div').attr('id','title');
	 var heading = titlediv.append('div')
        .classed('title', true)
        .text(title);
	}
}



/*Helper function*/
function serializeXmlNode(xmlNode) {
    if (typeof window.XMLSerializer != "undefined") {
        return (new window.XMLSerializer()).serializeToString(xmlNode);
    } else if (typeof xmlNode.xml != "undefined") {
        return xmlNode.xml;
    }
    return "";
}

//utilisé pour faire des heatmaps
var geoJson2heat = function(geojson, valueField) {
	return geojson.features.map(function(feature) {
		
		return [
			parseFloat(feature.geometry.coordinates[1]), 
			parseFloat(feature.geometry.coordinates[0]), 
			feature.properties[valueField]];
	});
}

 var geojson,
    metadata,
    rmax = 30, //Maximum radius for cluster pies
    markerClusters = L.markerClusterGroup({
      maxClusterRadius: 2*rmax,
      iconCreateFunction: defineClusterIcon, //this is where the magic happens
      showCoverageOnHover: false,
	//  spiderfyOnMaxZoom: true,
	//  zoomToBoundsOnClick: true,
	//  disableClusteringAtZoom: 16,
	//  maxClusterRadius: 80,
    });
 


$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10), $(this).attr("lat"), $(this).attr("lng"));
});

$(document).on("mouseover", ".feature-row", function(e) {
  highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
});

$(document).on("mouseout", ".feature-row", clearHighlight);

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(boroughs.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  highlight.clearLayers();
}


function getURLParameter(sParam) {

  var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}
$( document ).ready(function() {
  // Handler for .ready() called.

	// Récupération des paramètres d'url
	$('#style_map_color').val(getURLParameter('style_map_color'));
	$('#style_map_size').val(getURLParameter('style_map_size'));
	$('#heatmap_blur').val(getURLParameter('heatmap_blur'));
	$('#heatmap_radius').val(getURLParameter('heatmap_radius'));
	$('#heatmap_radius').val(getURLParameter('heatmap_radius'));
	if (typeof(getURLParameter('url')) != "undefined" &&  getURLParameter('url') != "" ) {
		$('#url').val(decodeURIComponent(getURLParameter('url')));
	}
	if (typeof(getURLParameter('title')) != "undefined" &&  getURLParameter('title') != "" ) {
		$('#title').val(decodeURIComponent(getURLParameter('title')));
		renderTitle($('#title').val());
	}
});

function sidebarClick(id, lat, lng) {

  if (lat) {
     map.setView([lat, lng], 17);
  }
  else{
	var layer = markerClusters.getLayer(id);
     	map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
	layer.fire("click");
  }
  
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  	/* Empty sidebar features */
  	$("#feature-list tbody").empty();
  
	/* Loop through site_data layer and add only features which are in the map bounds */
  	site_datas.eachLayer(function (layer) {
		if (map.hasLayer(site_dataLayer)) {
		  if (map.getBounds().contains(layer.getLatLng())) {
		    $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/factory.png"></td><td class="feature-name">' + layer.feature.properties.regate_code + ' ' + layer.feature.properties.entity_name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
		  }
		}
	  });
  

	  /* Update list.js featureList */
	  featureList = new List("features", {
		valueNames: ["feature-name"]
	  });
	  featureList.sort("feature-name", {
		order: "asc"
	  });
}

/* Basemap Layers */
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
var mapquestOAM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
});

var LMappopulation = new L.TileLayer("http://www.comeetie.fr/mbtiles-php/CarreauxPopShpSmall/{z}/{x}/{y}.png", {
	minZoom : 6,
	maxZoom : 9,
	attribution: '<a href="http://www.insee.fr/fr/themes/detail.asp?reg_id=0&ref_id=donnees-carroyees&page=donnees-detaillees/donnees-carroyees/donnees-carroyees-200m.htm">INSEE</a>'
});

var LMapIncomes = new L.TileLayer("http://www.comeetie.fr/mbtiles-php/CarreauxRevShpSmall/{z}/{x}/{y}.png", {
	minZoom : 6,
	maxZoom : 9,
	attribution: '<a href="http://www.insee.fr/fr/themes/detail.asp?reg_id=0&ref_id=donnees-carroyees&page=donnees-detaillees/donnees-carroyees/donnees-carroyees-200m.htm">INSEE</a>'
});

var LMaplowIncomes = new L.TileLayer("http://www.comeetie.fr/mbtiles-php/CarreauxBslrShpSmall/{z}/{x}/{y}.png", {
	minZoom : 6,
	maxZoom : 9,
	attribution: '<a href="http://www.insee.fr/fr/themes/detail.asp?reg_id=0&ref_id=donnees-carroyees&page=donnees-detaillees/donnees-carroyees/donnees-carroyees-200m.htm">INSEE</a>'
});

var LMapless25YearsOld = new L.TileLayer("http://www.comeetie.fr/mbtiles-php/CarreauxJeunesShpSmall/{z}/{x}/{y}.png", {
	minZoom : 6,
	maxZoom : 9,
	attribution: '<a href="http://www.insee.fr/fr/themes/detail.asp?reg_id=0&ref_id=donnees-carroyees&page=donnees-detaillees/donnees-carroyees/donnees-carroyees-200m.htm">INSEE</a>'
});

var LMapplus65YearsOld = new L.TileLayer("http://www.comeetie.fr/mbtiles-php/CarreauxVieuxShpSmall/{z}/{x}/{y}.png", {
	minZoom : 6,
	maxZoom : 9,
	attribution: '<a href="http://www.insee.fr/fr/themes/detail.asp?reg_id=0&ref_id=donnees-carroyees&page=donnees-detaillees/donnees-carroyees/donnees-carroyees-200m.htm">INSEE</a>'
});

		



var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);

/* Overlay Layers */
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#00FFFF",
  fillOpacity: 0.7,
  radius: 10
};



var departments = L.geoJson(null, {
  style: function (feature) {
    return {
      color: "green",
      fill: false,
      opacity: 0.4,
      width: 2,
      clickable: false
    };
  }
});
$.getJSON("data/departement.geojson", function (data) {
  departments.addData(data);
});




















/* Empty layer placeholder to add to layer control for listening when to add/remove data elasticsearch to markerClusters layer */
//svg.select("#user_layer").attr("class", palette);
// leaflet-zoom-animated
/** add newe */
function style(feature) {
    return {
        fillColor: getColor(feature.properties.value),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

/*Function for generating a legend with the same categories as in the clusterPie*/
function renderLegend() {
    var data = d3.entries(metadata.data),
      legenddiv = d3.select('#map').append('div')
        .attr('id','legend');
        
    var heading = legenddiv.append('div')
        .classed('legendheading', true)
        .text("Legende");

    var legenditems = legenddiv.selectAll('.legenditem')
        .data(data);
        
    legenditems
        .enter()
        .append('div')
        .attr('class',function(d){return 'category-'+d.value;})
        .classed({'legenditem': true})
        .text(function(d){return d.key;});
}

function numberFormat(n){
    var rx=  /(\d+)(\d{3})/;
    return String(n).replace(/^\d+/, function(w){
        while(rx.test(w)){
            w= w.replace(rx, '$1 $2');
        }
        return w;
    });
}
/*Function for generating a legend */
/* TODO : refaire ce truc */
function renderMapLegend(min, max, style_map_color) {

 	var legenddiv = d3.select('#map').append('div')
        .attr('id','legend');
        
    var heading = legenddiv.append('div')
        .classed('legendheading', true)
        .text("Legende");

    var legenditems = legenddiv.selectAll('.legenditem');

	if (style_map_color == "DIV12") {
	 	var me = legenddiv.append('div');me.append('span').attr('style','background-color:#8e0152').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(95*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#c51b7d').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(85*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#de77ae').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(75*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#f1b6da').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(65*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#fde0ef').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(55*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#f7f7f7').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(45*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#e6f5d0').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(35*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#b8e186').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(25*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#7fbc41').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(15*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#4d9221').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(5*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#276419').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' < ' + numberFormat(Math.round(5*(max-min)+min)));
	}
	else if (style_map_color == "DIV6") {
		// DIV6 color
	 	var me = legenddiv.append('div');me.append('span').attr('style','background-color:#d73027').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(80*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#fc8d59').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(60*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#fee08b').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(40*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#d9ef8b').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(20*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#91cf60').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(5*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#111').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' < ' + numberFormat(Math.round(5*(max-min)+min)));
	}
	else {
		//"PiYG6", 
	 	var me = legenddiv.append('div');me.append('span').attr('style','background-color:#8e0152').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(80*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#de77ae').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(60*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#fde0ef').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(40*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#b8e186').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(20*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#4dac26').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' > ' + numberFormat(Math.round(5*(max-min)+min)));
		var me = legenddiv.append('div');me.append('span').attr('style','background-color:#111').attr('width','15px').html('&nbsp;&nbsp;&nbsp;');me.append('span').text(' < ' + numberFormat(Math.round(5*(max-min)+min)));


	}
}


function getColor(d, style_map_color) {
//colorBrewer
	if (getURLParameter('style_map_color')  ) {
		style_map_color = getURLParameter('style_map_color');
	}
	else {
		style_map_color = "PiYG6"
	}
	if (style_map_color == "PiYG6") {
	    d=Math.round(d);
	    return d > 80 ? '#8e0152' :
		   d > 60  ? '#de77ae' :
		   d > 40  ? '#fde0ef' :
		   d > 20  ? '#b8e186' :
		   d > 5   ? '#4dac26' :
		              '#111';
	}
	if (style_map_color == "DIV6") {
	    d=Math.round(d);
	    return d > 80 ? '#d73027' :
		   d > 60  ? '#fc8d59' :
		   d > 40  ? '#fee08b' :
		   d > 20  ? '#d9ef8b' :
		   d > 5   ? '#91cf60' :
		              '#111';


	}
	if (style_map_color == "DIV12") {
	    d=Math.round(d);
	   return d > 95 ? '#8e0152' :
		   d > 85  ? '#c51b7d' :
		   d > 75  ? '#de77ae' :
		   d > 65  ? '#f1b6da' :
		   d > 55   ? '#fde0ef' :
		   d > 45   ? '#f7f7f7' :
		   d > 35   ? '#e6f5d0' :
		   d > 25   ? '#b8e186' :
		   d > 15   ? '#7fbc41' :
		   d > 5   ? '#4d9221' :
		              '#276419';
	}
    
}




function getCircleSize(d, style_map_size) {

	if (getURLParameter('style_map_size')  ) {
		style_map_size= getURLParameter('style_map_size');
	}
	else {
		style_map_size = "LIN6";
	}
	if (style_map_size == "LIN6") {
	    d=Math.round(d);
	    return d > 80 ? 16 :
		   d > 60  ? 14 :
		   d > 40  ? 12 :
		   d > 20  ? 10 :
		   d > 5   ? 8 :
		              2;
	}
	if (style_map_size == "POINT") {
	    d=Math.round(d);
	    return           2;
	}
       if (style_map_size == "LIN10") {
	    d=Math.round(d);
	    return d > 95 ? 18 :
		   d > 85  ? 17 :
		   d > 75  ? 16 :
		   d > 65  ? 15 :
		   d > 55   ? 14 :
		   d > 45   ? 13 :
		   d > 35   ? 11 :
		   d > 25   ? 10 :
		   d > 15   ? 9 :
		   d > 5   ? 8 :
		              2;
	}
}


//L.geoJson(statesData, {style: style}).addTo(map);

//var d3Layer = new L.GeoJSON.d3({...insert geojson here...});
//var map = new L.Map("map").addLayer(d3Layer);

var site_data_departmentLayer = L.geoJson(null);
var site_data_departments = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        //iconUrl: "assets/img/postbox.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NOM_DEPT,
      riseOnHover: true
    });
  },
  style: function (feature) {
    return {
        fillColor: getColor(feature.properties.value_pct, 'DIV12'),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
        clickable: true,
        width: 1,
    };
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Code Département</th><td>" + feature.properties.CODE_DEPT + "</td></tr>" + "<tr><th>Département</th><td>" + feature.properties.NOM_DEPT + "</td></tr>" + "<tr><th>Value</th><td>" + feature.properties.value + "</td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.NOM_DEPT);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
      });
      //$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/postbox.png"></td><td class="feature-name">' + layer.feature.properties.NOM_DEPT + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      
    }
  }
});
// CORS error + format : $.getJSON("http://public.opendatasoft.com/explore/dataset/points-dinterets-openstreetmap-en-france/download/?format=geojson&refine.operator=La%20Poste&refine.amenity=post_box&timezone=Europe/Berlin", function (data) {

// Récupere les données cartographiques
var site_data_department= $.getJSON( "data/departement.geojson", function() {

})
  .done(function(site_data_department) {

	//récupere les données d'elasticsearch
//	var data = $.getJSON( "data/sample_response_aggregation.geojson", function(site_data_department) {
	var data = $.getJSON( "data/sample_CA_debut_2014.geojson", function(site_data_department) {


	  //console.log( "success_AGG" );
	})
	  .done(function(data) {

	    //console.log( "second success_AGG" );
																																
		var buckets = [];
		var doc_count_total =0;
		var doc_count_max =0; // used to add color
		var doc_count_min =0; // used to add color
		var doc_count_scale =0; // used to add color

		// passe sous forme de tableau les données d'elasticsearch contenues dans le résultat aggregations, le tableau contient de departement (2pemiers car du regate)
		var bucketsLength=data.aggregations.my_agg.buckets.length; 
		for (var j=0; j<bucketsLength; j++) {
			buckets[data.aggregations.my_agg.buckets[j].key.substring(0, 2)]=data.aggregations.my_agg.buckets[j].doc_count;
			doc_count_total = doc_count_total+data.aggregations.my_agg.buckets[j].doc_count;
			if ( data.aggregations.my_agg.buckets[j].doc_count > doc_count_max) {doc_count_max= data.aggregations.my_agg.buckets[j].doc_count };
                        if ( data.aggregations.my_agg.buckets[j].doc_count < doc_count_min) {doc_count_min= data.aggregations.my_agg.buckets[j].doc_count };
		}
		doc_count_scale = doc_count_max - doc_count_min;
		// modifie le geoJson pour ajouter les valeurs
		var featuresLength=site_data_department.features.length;
		for (var i=0; i<featuresLength; i++) {
		    if (buckets[site_data_department.features[i].properties.CODE_DEPT]) {
			site_data_department.features[i].properties.value = buckets[site_data_department.features[i].properties.CODE_DEPT];
			site_data_department.features[i].properties.value_pct = (buckets[site_data_department.features[i].properties.CODE_DEPT] - doc_count_min) / doc_count_scale * 100;
		    }
		}
		//add data to the map
	  	site_data_departments.addData(site_data_department);
		//map.addLayer(site_data_departmentLayer);

	  })																																																																																											
	 .fail(function( jqxhr, textStatus, error ) {
	    var err = textStatus + ", " + error;
	    console.log( "Request Failed: " + err );
          })
	  .always(function() {
	    //console.log( "complete_AGG" );
	  });

  })
  .fail(function() {
    console.log( "error" );
  })
  .always(function() {
    //console.log( "complete" );
  });





																																																																																																																			






/* Empty layer placeholder to add to layer control for listening when to add/remove elasticsearch regate to markerClusters layer */
var site_dataLayer = L.geoJson(null);
var site_datas = L.geoJson(null, {
    pointToLayer:  function (feature, latlng) {
        return L.circleMarker(latlng, {
					    radius: getCircleSize(feature.properties.value_pct, 'LIN10'),
					    fillColor: getColor(feature.properties.value_pct, 'DIV12'),
					    color: "#fff",
					    weight: 1,
					    opacity: 0.9,
					    fillOpacity: 0.9
					}
				)
																																																																																																																																								
   },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																																			
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Code Regate</th><td><a href='http://www.source-organisation.courrier.intra.laposte.fr:8080/ebx/?redirect=/source-organisation/view/close.jsp&branch=BrancheSourceOrganisation&instance=InstanceSourceOrganisation&xpath=/root/D_ENTITE/T_ENTITE[./i_CODE="+ feature.properties.id +"]' target='_blanck'>" + feature.properties.regate_code + "</a></td></tr>" + "<tr><th>Nom</th><td>" + feature.properties.entity_name + "</td></tr>" + "<tr><th>Valeur</th><td>" + feature.properties.value + "</td></tr>" + "<table><iframe src=\"http://localhost:5601/#/dashboard/New-Dashboard?embed&_g=(refreshInterval:(display:Off,section:0,value:0),time:(from:'2015-05-29T13:01:13.587Z',mode:absolute,to:'2015-05-29T14:03:40.226Z'))&_a=(filters:!(),panels:!((col:1,id:carto1,row:1,size_x:3,size_y:2,type:visualization),(col:4,id:facet,row:1,size_x:3,size_y:2,type:visualization),(col:7,id:New-Visualization,row:1,size_x:3,size_y:2,type:visualization)),query:(query_string:(analyze_wildcard:!t,query:'*')),title:'New%20Dashboard')\" height=\"600\" width=\"800\"></iframe>";
    																																																																																							  
// layer.on('mouseover mousemove', function(e){
//ne marche pas !!!!!!
//    highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
//    var hover_bubble = new L.Rrose({ offset: new L.Point(0,-1), closeButton: false, autoPan: false })
//      .setContent(feature.properties.regate_code + " " +feature.properties.entity_name)
//      .setLatLng(e.latlng)
//      .openOn(map);
//  });
 // layer.on('mouseout', function(e){ map.closePopup() });


layer.on({
	
      click: function (e) {
          $("#feature-title").html(feature.properties.regate_code + " " +feature.properties.entity_name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
        }
});


$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/postbox.png"></td><td class="feature-name">' + layer.feature.properties.regate_code + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');

site_dataSearch.push({
        name: layer.feature.properties.regate_code + " " +layer.feature.properties.entity_name,
        source: "Site_datas",
        id: L.stamp(layer),
        bounds: layer.getBounds(),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]

      });
    }
  }
});
// CORS error + format : $.getJSON("http://public.opendatasoft.com/explore/dataset/points-dinterets-openstreetmap-en-france/download/?format=geojson&refine.operator=La%20Poste&refine.amenity=post_box&timezone=Europe/Berlin", function (data) {

function decodeURL () {
	
	if (typeof(getURLParameter('url')) == "undefined" ||  getURLParameter('url') == "" ) {
		return "http://localhost:9200/_search";
	}	
	else {
		return decodeURIComponent(getURLParameter('url')).toString();
	}	
}


function requestData () {
	// Récupere les données cartographiques
	var data_regate = $.getJSON( "data/sites_regate.geojson", function() {
	  
	})
	  .done(function(data_regate) {

	    //console.log( "success elasticsearch" );

	
	var data_request = decodeURIComponent(getURLParameter('data_request')).replace(/[Nn]ow\+-/g,'now-').replace(/[Nn]ow\++/g,'now#').replace(/\+/g,' ').replace(/now\#/g,'now+');
	if (data_request && data_request != "undefined") {
		$('#data_request').val(data_request)
	}
	else {
		data_request = $('#data_request').val();
	}
	if (data_request !== "") {
	
		//var request = $('#data_request').val();
		//todo : add json validtor error
		//var requestJson = JSON.parse(request);

		// var data = $.post( {"url": decodeURL(), "crossDomain":true, "beforeSend": function (xhr) {xhr.setRequestHeader ("Authorization", "Basic XXXXXX");}, "data": data_request}, function(data_regate) {
		var data = $.post(  decodeURL(), data_request, function(data_regate) {
		//var data = $.getJSON( "data/sample_CA_debut_2014.geojson", function(data_regate) {
				
  			//console.log( "ELASTIC sucess_elastic" );
		})
		  
		//récupere les données d'elasticsearch
		//var data = $.getJSON( "data/sample_response_aggregation.geojson", function(data_regate) {
		//var data = $.getJSON( "data/sample_CA_debut_2014.geojson", function(data_regate) {
		//  console.log( "success_AGG" );
		//})
		  .done(function(data) {

		    //console.log( "ELASTIC second success_AGG" );
			//console.log(data);					
			var buckets = [];
			var doc_count_total =0;
			var doc_count_max =0; // used to add color
			var doc_count_min =0; // used to add color
			var doc_count_scale =0; // used to add color
		
			var sub_agg_terms =[]; //liste des termes dans une sous agregation
			var sub_agg_terms_count =1;
			// passe sous forme de tableau les données d'elasticsearch contenues dans le résultat aggregations
			//plusieurs formats possibles
			// pas d'agregation
			// agregation de données : à detailler
			// double agrégation de données : nombre de TELEPHONE par SITE et par OPERATEUR --> affichera un clusteMap d3pie : sub_sub_agg
				//my_agg.buckets[].key : regate
				//my_agg.buckets[].sub_sub_agg.buckets[].key : reseau --> legende
				//my_agg.buckets[].sub_sub_agg.buckets[].sub_agg.value : valeur

			var bucketsLength=data.aggregations.my_agg.buckets.length;
			var subBucketsLength;

			// test if there is is sub_agg, to get sub_agg value instead of doc_count
			var sub_agg = false;
			if (data.aggregations.my_agg.buckets[0].sub_agg) {sub_agg=true;}
			// test if there is is sub_sub_agg, to get sub_sub_agg value instead of doc_count and to duplicate data
			var sub_sub_agg = false;
			if (data.aggregations.my_agg.buckets[0].sub_sub_agg) {sub_sub_agg=true;}

			for (var j=0; j<bucketsLength; j++) {
				//console.log(sub_sub_agg);
				if (sub_sub_agg) {

					subBucketsLength = data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets.length;
					for (var k=0; k<subBucketsLength; k++) {
						//recupere la valeur depuis les différents niveaux hierarchique d'elasticsearch et la met dans un tableau
						//buckets[1erNiveau][2emeNiveau]=valeur	
						if (!sub_agg_terms[data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].key]) {
							sub_agg_terms[data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].key] = sub_agg_terms_count;
							sub_agg_terms_count=sub_agg_terms_count+1;						
						}
						//sub_agg_terms[data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].key]="1";
						if (!buckets[data.aggregations.my_agg.buckets[j].key]) {
							buckets[data.aggregations.my_agg.buckets[j].key] = [];
						}
						if (!buckets[data.aggregations.my_agg.buckets[j].key][data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].key]) {
							buckets[data.aggregations.my_agg.buckets[j].key][data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].key] = [];
						}
						
						buckets[data.aggregations.my_agg.buckets[j].key][data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].key]=data.aggregations.my_agg.buckets[j].sub_sub_agg.buckets[k].sub_agg.value;
	
					}
				}
				else if (sub_agg) {
					buckets[data.aggregations.my_agg.buckets[j].key]=data.aggregations.my_agg.buckets[j].sub_agg.value;
					doc_count_total = doc_count_total+data.aggregations.my_agg.buckets[j].sub_agg.value;
					if ( data.aggregations.my_agg.buckets[j].sub_agg.value > doc_count_max) {doc_count_max= data.aggregations.my_agg.buckets[j].sub_agg.value};
		                	if ( data.aggregations.my_agg.buckets[j].sub_agg.value < doc_count_min) {doc_count_min= data.aggregations.my_agg.buckets[j].sub_agg.value };
				}
				
				else {
					buckets[data.aggregations.my_agg.buckets[j].key]=data.aggregations.my_agg.buckets[j].doc_count;
					doc_count_total = doc_count_total+data.aggregations.my_agg.buckets[j].doc_count;
					if ( data.aggregations.my_agg.buckets[j].doc_count > doc_count_max) {doc_count_max= data.aggregations.my_agg.buckets[j].doc_count };
		                	if ( data.aggregations.my_agg.buckets[j].doc_count < doc_count_min) {doc_count_min= data.aggregations.my_agg.buckets[j].doc_count };
				}
				
				
			}
			doc_count_scale = doc_count_max - doc_count_min;

			// modifie le geoJson pour ajouter les valeurs
			var featuresLength=data_regate.features.length;
			for (var i=0; i<featuresLength; i++) {
			    if (buckets[data_regate.features[i].properties.regate_code]) {
				if (sub_sub_agg) {
					data_regate.features[i].properties.data =buckets[data_regate.features[i].properties.regate_code];					
				}
				else {
					data_regate.features[i].properties.value = buckets[data_regate.features[i].properties.regate_code];
					data_regate.features[i].properties.value_pct = (buckets[data_regate.features[i].properties.regate_code] - doc_count_min) / doc_count_scale * 100;
				}
			    }
			}

			//ajoute les termes utilises dans le featureCollection
			if (sub_agg_terms !=="") {
				data_regate.properties={};
				data_regate.properties.data=sub_agg_terms;
			}
			
			//console.log(data_regate);


		  	site_datas.addData(data_regate);
			metadata = data_regate.properties;

			map.addLayer(site_dataLayer);

			//if sub_sub_agg, display clusterMarker d3pie type
			if (sub_sub_agg) {
				var markers = L.geoJson(data_regate, {
						pointToLayer: defineFeature,
						onEachFeature: defineFeaturePopup
				  });
				  markerClusters.addLayer(markers);
				renderLegend();
          	}
			else {
				

				// if heatmap, display heatmap  type
				if (getURLParameter('heatmap_radius')  || getURLParameter('heatmap_blur')) {
					//add heatmap data to the map
					var heatmap_radius = 20;
					if (getURLParameter('heatmap_radius') ) {
						heatmap_radius = parseInt(getURLParameter('heatmap_radius'));
					}
					var heatmap_blur = 17;
					if (getURLParameter('heatmap_blur') ) {
						heatmap_blur = parseInt(getURLParameter('heatmap_blur'));
					}
					var geoData = geoJson2heat(data_regate, "value"); 
					//supprime les valeurs nulles (bug heatmap)
					var geoDataLength=geoData.length;
					for (var i = 0; i < geoDataLength; i++) {
						if (geoData[i] && geoData[i][2] ==0) { 
							  geoData.splice(i, 1);
							  i--;
							}
					}
					var site_data_heatmapsLayer = L.heatLayer(geoData,{ radius: heatmap_radius,blur: heatmap_blur, maxZoom: 17})
					map.addLayer(site_data_heatmapsLayer);
				}
				else {
					renderMapLegend(doc_count_min, doc_count_max, getURLParameter('style_map_color'));
				}
			}

		  })
		 .fail(function( jqxhr, textStatus, error ) {
		    var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
		  })
		  .always(function() {
		    //console.log( "complete_AGG" );
		  });
	}

	  })
	  .fail(function( jqxhr, textStatus, error ) {
		    var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
		  })
	  .always(function() {
	    //console.log( "complete" );
	  });

}
requestData();












map = L.map("map", {
  zoom: 6,
  center: [46.9996919,3.1241694],
  layers: [mapquestOSM, site_datas, markerClusters, highlight],
  zoomControl: true,
  attributionControl: false
});

//map.addLayer(markerClusters);

//d3pie
 //Ready to go, load the geojson
 // d3.json(geojsonPath, function(error, data) {
 //     if (!error) {
 //         geojson = data;
 //         metadata = data.properties;
  //        var markers = L.geoJson(geojson, {
//			pointToLayer: defineFeature,
//			onEachFeature: defineFeaturePopup
//          });
////          //CSE markerClusters.addLayer(markers);
//          //map.fitBounds(markers.getBounds());
//          //map.attributionControl.addAttribution(metadata.attribution);
//          renderLegend();
////      } else {
//	  console.log('Could not load data...');
//      }
//  });




/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
 
  
  if (e.layer === site_dataLayer) {
    //markerClusters.addLayer(site_datas);
    syncSidebar();
  }
  if (e.layer === site_data_departmentLayer) {
    markerClusters.addLayer(site_data_departments);
    //syncSidebar();
  }
  
});

map.on("overlayremove", function(e) {
  
  if (e.layer === site_dataLayer) {
    //markerClusters.removeLayer(site_datas);
    syncSidebar();
  }
  if (e.layer === site_data_departmentLayer) {
    markerClusters.removeLayer(site_data_departments);
    //syncSidebar();
  }
 
  
});

/* Filter sidebar feature list to only show features in current map bounds */
map.on("moveend", function (e) {
  syncSidebar();
});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Developed by <a href='mailto:claude.seguret@laposte.fr'>clodio</> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "fa fa-location-arrow",
  metric: false,
  strings: {
    title: "Votre localisation",
    popup: "Vous êtes situés à peut près à {distance} {unit} de ce point",
    outsideMapBoundsMsg: "Vous êtes en dehors de cette carte"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Plan": mapquestOSM,
  "Carte satellite": mapquestOAM,
  "Carte avec rues": mapquestHYB,
  //"% de bas revenus": LMaplowIncomes,
  "% de moins de 25 ans": LMapless25YearsOld,
  "% de 65 ans et plus": LMapplus65YearsOld,
  "Densité de population": LMappopulation,
  "Revenus": LMapIncomes,
  "Carte avec rues": mapquestHYB

};

var groupedOverlays = {
  "Points d'interêts": {
    //"<img src='assets/img/postbox.png' width='24' height='28'>&nbsp;Boites jaunes": postboxLayer ,
     "<img src='assets/img/factory.png' width='24' height='28'>&nbsp;Sites": site_dataLayer
  },
  "Analyses": {
  
    "Analyse par site": site_datas,
    //"Prestations par Site": site_datas,
    "CA par departement": site_data_departments
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();
  /* Fit map to boroughs bounds */
  //map.fitBounds(boroughs.getBounds());
  featureList = new List("features", {valueNames: ["feature-name"]});
  featureList.sort("feature-name", {order:"asc"});

  var boroughsBH = new Bloodhound({
    name: "Arrondissements",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: boroughSearch,
    limit: 10
  });

   var sitesBH = new Bloodhound({
    name: "Sites",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: site_dataSearch,
    limit: 5
  });


 

  

  

  var geonamesBH = new Bloodhound({
    name: "GeoNames",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: "http://api.geonames.org/searchJSON?username=bootleaf&featureClass=P&maxRows=5&countryCode=US&name_startsWith=%QUERY",
      filter: function (data) {
        return $.map(data.geonames, function (result) {
          return {
            name: result.name + ", " + result.adminCode1,
            lat: result.lat,
            lng: result.lng,
            source: "GeoNames"
          };
        });
      },
      ajax: {
        beforeSend: function (jqXhr, settings) {
          settings.url += "&east=" + map.getBounds().getEast() + "&west=" + map.getBounds().getWest() + "&north=" + map.getBounds().getNorth() + "&south=" + map.getBounds().getSouth();
          $("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
        },
        complete: function (jqXHR, status) {
          $('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
        }
      }
    },
    limit: 5
  });
  boroughsBH.initialize();
  sitesBH.initialize();



  geonamesBH.initialize();

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 2,
    highlight: true,
    hint: false
  }, {
    name: "Boroughs",
    displayKey: "name",
    source: boroughsBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'>Arrondissments</h4>"
    }
  }, {
    name: "Sites",
    displayKey: "name",
    source: sitesBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/factory.png' width='24' height='28'>&nbsp;Sites</h4>"
    }
  
  }, {
    name: "GeoNames",
    displayKey: "name",
    source: geonamesBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "Boroughs") {
      map.fitBounds(datum.bounds);
    }
    if (datum.source === "Site_datas") {
      map.fitBounds(datum.bounds);
    }
    if (datum.source === "Arrondissements") {
      map.fitBounds(datum.bounds);
    }
   
    if (datum.source === "GeoNames") {
      map.setView([datum.lat, datum.lng], 14);
    }
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}
