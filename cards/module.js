var fuseOptions = {
	shouldSort: true,
	threshold: 0.6,
	location: 0,
	distance: 100,
	maxPatternLength: 32,
	minMatchCharLength: 1,
	keys: ["name"]
};
let request = function(url){
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", url, false );
	xmlHttp.send( null );
	return JSON.parse(xmlHttp.responseText);
};
let lists = {
	cards: [],
	series: []
};
let marketCache = {};
let cardLock = false;
let SVGassets = [
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_clear_white_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_clear_black_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_search_black_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_clear_black_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_keyboard_arrow_up_white_24px.svg"
];
let DCLookup = {
	loadStartingResults: function(){
		document.querySelector(".results").innerHTML += `<h1>Search by Series...</h1>`;
		lists.series.sort(function(a, b) {return a.id - b.id;}).map(s=>{document.querySelector(".results").innerHTML +=  `<div class="series" onclick="DCLookup.append('series:${s.id}')"><img src="http://discord.cards/i/s/${s.id}.png" draggable=false><br><span>${s.name}</span></div>`});
		document.querySelector(".results").innerHTML += `<h1>...or by Rarity.</h1>`;
		[{id:"c",name:"Common",c:"768ab3"},{id:"uc",name:"Uncommon",c:"97c15f"},{id:"r",name:"Rare",c:"d0c653"},{id:"sr",name:"Super Rare",c:"c75950"},{id:"l",name:"Limited",c:"ff8602"}].map(s=>{document.querySelector(".results").innerHTML +=  `<div class="series" onclick="DCLookup.append('rarity:${s.id}')"><span style="background: #${s.c}">${s.name}</span></div>`});
	},
	loadCard: function(card){
		document.querySelector(".results").innerHTML +=  `<div class="card"><img src="http://discord.cards/i/c/${card.id}.png" draggable=false onclick="DCLookup.showCard('${card.id}')"></div>`
	},
	clearSearch: function(){
		document.querySelector("input").value = "";
		DCLookup.parseSearch();
	},
	preloadImage: function(url){
		let img = new Image();
		img.src = url;
		img.onload = ()=>{document.querySelector(".loading progress").value++};
	},
	parseResults: function(cards){
		if(cards.length === 0){
			document.querySelector(".results").innerHTML +=  `<h1 class='none'>No results :/</h1>`;
			return;
		}
		cards.map(card => {
			DCLookup.loadCard(card);
		});
	},
	append: function(string){
		document.querySelector("input").value = string + " " + document.querySelector("input").value;
		document.querySelector("input").focus();
		DCLookup.parseSearch();
	},
	parseSearch: function(){
		document.querySelector(".results").innerHTML = "";
		let search = document.querySelector("input").value.trim();
		let params = {series:null,rarity:null}
		let currentCards = lists.cards.sort(function(a, b) {return a.id - b.id;});
		if(search.match(/series:(\d+)/)){
			params.series = search.match(/series:(\d+)/)[1];
			search = search.replace(/series:(\d+)/, "").trim();
		}
		if(search.match(/rarity:(\w+)/)){
			params.rarity = search.match(/rarity:(\w+)/)[1].toLowerCase();
			search = search.replace(/rarity:(\w+)/, "").trim();
		}
		if(!params.series && !params.rarity && search === ""){
			DCLookup.loadStartingResults();
			document.querySelector("#no-content").className = "";
			document.querySelector(".searching #close").className = "hide";
			document.querySelector(".searching #link").className = "hide";
			document.querySelector(".searching #link").href = "#";
			return;
		}
		if(params.series && !DCLookup.pickOff(lists.series, {id:params.series})){
			document.querySelector(".results").innerHTML +=  `<h1 class='error'>Error: No series with that ID exists.</h1>`;
			return;
		}
		if(params.rarity && !["c","uc","r","sr","l"].includes(params.rarity)){
			document.querySelector(".results").innerHTML +=  `<h1 class='error'>Error: Invalid rarity.</h1>`;
			return;
		}
		currentCards = currentCards.filter(card => {
			if(params.series || params.rarity){
				if(params.series === card.series && !params.rarity || params.rarity === card.rarity && !params.series || params.rarity === card.rarity && params.series === card.series){
					return true;
				}else{
					return false;
				}
			}else if(params.limited !== undefined && params.limited === (card.series === null)){
				return true;
			}else{
				return true;
			}
		});
		//console.log(search, params, currentCards);
		document.querySelector("#no-content").className = "hide";
		document.querySelector(".searching #close").className = "";
		document.querySelector(".searching #link").className = "";
		document.querySelector(".searching #link").href = "#"+encodeURI(document.querySelector("input").value.trim());
		if(search === ""){
			DCLookup.parseResults(currentCards);
			return;
		}
		DCLookup.parseResults(new Fuse(currentCards, fuseOptions).search(search));
	},
	pickOff: function(array, e){
		let a = undefined;
		let v = Object.keys(e)[0]
		array.map(i=>{
			if(e[v] === i[v]){
				a = i;
			}
		});
		return a;
	},
	requestCardMarketData: function(id){
		if(marketCache[id]) return marketCache[id];
		marketCache[id] = request(`https://api.discord.cards/card/${id}/market`);
		return marketCache[id];
	},
	showCard: function(id){
		//<p><span id="selling_count">1,062</span> Servers</p>
		let card = DCLookup.pickOff(lists.cards, {id:id});
		let series = card.series ? DCLookup.pickOff(lists.series, {id:card.series}) : null;
		let rarityName = "Common"
		switch(card.rarity){
			case "c":
				rarityName = "Common";
				break;
			case "uc":
				rarityName = "Uncommon";
				break;
			case "r":
				rarityName = "Rare";
				break;
			case "sr":
				rarityName = "Super Rare";
				break;
			case "l":
				rarityName = "Limited";
				break;
		}
		document.querySelector(".load").className = "load";
		document.querySelector(".card-preview").className = "card-preview show";
		document.querySelector(".main-card").src = `https://discord.cards/i/c/${id}.png`;
		document.querySelector("#card-name").innerText = `#${id} - ${card.name}`;
		document.querySelector("#card-series").innerText = series ? `Series ${series.id} - ${series.name}`: "";
		document.querySelector("#card-rarity").innerText = rarityName;
		document.querySelector(".selling.offer").innerHTML = "";
		document.querySelector(".buying.offer").innerHTML = "";

		let mData = DCLookup.requestCardMarketData(id);
		if(mData.sell.count !== 0){
			document.querySelector(".selling.offer").innerHTML += `<h6>Selling Offer<br>Market Data</h6><p>Count: <span>${mData.sell.count}</span></p><p>Average: <span>${mData.sell.avg}</span></p><p>Lowest: <span>${mData.sell.low}</span></p>`;
		}
		if(mData.buy.count !== 0){
			document.querySelector(".buying.offer").innerHTML += `<h6>Buying Offer<br>Market Data</h6><p>Count: <span>${mData.buy.count}</span></p><p>Average: <span>${mData.buy.avg}</span></p><p>Highest: <span>${mData.buy.high}</span></p>`;
		}

		document.querySelector(".load").className = "load hide";
	},
	hideCard: function(force){
		if(!cardLock || force) document.querySelector(".card-preview").className = "card-preview";
	}
};
// Finish Loading sequence
let loadingtxt = document.querySelector(".loading b");
let loadingprog = document.querySelector(".loading progress");
loadingtxt.innerText = "Loading Data...";
try{
	lists.cards = request("https://api.discord.cards/list/cards");
	lists.series = request("https://api.discord.cards/list/series");
	loadingtxt.innerText = "Loading Images...";
	loadingprog.className = "";
	loadingprog.max = lists.cards.length+lists.series.length+SVGassets.length;
	lists.cards.map(c=>DCLookup.preloadImage(`https://discord.cards/i/c/${c.id}.png`));
	lists.series.map(s=>DCLookup.preloadImage(`https://discord.cards/i/c/${s.id}.png`));
	SVGassets.map(url=>DCLookup.preloadImage(url));
	window.onload = ()=>{
		loadingprog.className = "hide";
		loadingtxt.innerText = "Preparing...";
		DCLookup.loadStartingResults();
		let hashQuery = decodeURI(location.hash.substring(1)).trim();
		if(hashQuery !== ""){
			document.querySelector("input").value = hashQuery;
			DCLookup.parseSearch();
		}
		window.scrollTo(0,0);
		document.body.removeChild(document.querySelector(".loading"));
	}
	window.onscroll = ()=>{
		if(window.scrollY > 100){
			document.querySelector(".stt").className = "stt show";
		}else{
			document.querySelector(".stt").className = "stt";
		}
	}
}catch(e){
	loadingtxt.innerText = "Failed to load data, reloading in 10 seconds...";
	setTimeout(()=>{window.location.reload()}, 10000);
	console.error(e);
}

