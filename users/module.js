var fuseOptions = {
	shouldSort: true,
	threshold: 0.2,
	location: 0,
	distance: 100,
	maxPatternLength: 32,
	minMatchCharLength: 1,
	keys: ["searchname"]
};
let request = function(url){
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.open( "GET", url, false );
	xmlHttp.send( null );
	return JSON.parse(xmlHttp.responseText);
};
//let users = [{"avatar":"024f5df29e91370bb6b232c52dc9c2b5","badges":{"1":1487809227864,"3":1489193343063,"dev":1487797409058,"featured":1487797065190,"oneshot":1487797060110},"daily":{"streak":3,"time":1490831577458},"discriminator":"0371","id":"158049329150427136","inv":{"1":2,"2":2,"6":2,"7":1,"15":3,"16":2,"17":2,"19":1,"20":1,"27":1,"31":1,"33":2,"34":1,"35":1,"36":2,"37":2,"38":2,"39":null,"41":2,"42":2,"43":1,"44":2,"48":1,"49":3,"50":3,"51":3,"52":1,"53":2,"54":3,"55":7,"56":2,"57":3,"58":19,"59":7,"60":null,"61":24,"62":8,"63":7,"64":13,"65":32,"66":null,"67":17,"68":3,"69":20,"70":null,"71":21,"72":13,"73":11,"74":5,"75":4,"76":null,"77":null,"78":19,"79":15,"80":26,"81":21,"82":18,"83":7,"84":2,"85":13,"86":11,"87":16,"88":6,"89":5,"90":15,"92":6,"93":15,"95":16,"96":19,"97":13,"98":14,"99":19,"101":8,"103":1,"106":1,"108":2,"111":1,"115":1,"116":1,"117":1,"118":1,"119":1,"pack1":null,"pack2":null,"pack3":null,"pack4":null,"pack5":null},"money":736,"name":"Snazzah","settings":{"displayColor":16525609,"notifs":false,"trades":false}}];
let badges = [];
let users = [];
let cards = [];
let series = [];
let queuedTimeouts = [];
let avatarHashes = [
  "6debd47ed13483642cf09e832ed0bc1b",
  "322c936a8c8be1b803cd94861bdfa868",
  "dd4dbc0016779df1378e7812eabaa04d",
  "0e291f67c9274a1abdddeb3fd919cbaa",
  "1cbd08c76f8af6dddce02c5138971129"
];
let SVGassets = [
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_clear_white_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_clear_black_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_search_black_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_clear_black_24px.svg",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_keyboard_arrow_up_white_24px.svg",
	"http://emojipedia-us.s3.amazonaws.com/cache/8e/ca/8ecaeec21d2d10fb84faa23f968ff890.png",
	"https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_launch_white_18px.svg"
];
let cardLock = false;
let DCLookup = {
	loadStartingResults: function(){
		document.querySelector(".results").innerHTML += `<h1 class='warning'>Warning: This site deals with a large database of users. Loading a generic search can result in too many users.</h1>`;
		document.querySelector(".results").innerHTML += `<h1>You can search a user with name and discord tag.</h1>`;
		document.querySelector(".results").innerHTML += `<h1>You can also search if that user has a badge:</h1>`;
		badges.sort(function(a, b) {return a.id - b.id;}).map(b=>{document.querySelector(".results").innerHTML +=  `<div class="badge" onclick="DCLookup.append('has-badge:${b.id}')"><img src="http://discord.cards/i/b/${b.id}.png" draggable=false><br><span>${b.name}</span></div>`});
	},
	loadUser: function(u){
		document.querySelector(".results").innerHTML += `<div class="user" onclick="DCLookup.showUser('${u.id}')"><img src="${u.avatar_url}" draggable=false><span class="name"></span><span class="discriminator">#${u.discriminator}</span></div>`
		document.querySelector(`[onclick*="${u.id}"] .name`).innerText = u.name;
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
	parseResults: function(users){
		if(users.length === 0){
			document.querySelector(".results").innerHTML +=  `<h1 class='none'>No results :/</h1>`;
			return;
		}
		users.map(user => {
			if(users.indexOf(user) > 50) return;
			//queuedTimeouts.push(setTimeout(()=>{
				DCLookup.loadUser(user);
			//}, users.indexOf(user)*100));
		});
	},
	append: function(string){
		document.querySelector("input").value = string + " " + document.querySelector("input").value;
		document.querySelector("input").focus();
		DCLookup.parseSearch();
	},
	parseSearch: function(){
		document.querySelector(".results").innerHTML = "";
		queuedTimeouts.map(t=>clearTimeout(t));
		queuedTimeouts = [];
		let search = document.querySelector("input").value.trim();
		let params = {badge:null};
		let currentUsers = users.sort(function(a, b) {return a.name - b.name;});
		if(search.match(/has\-badge:(.+)/)){
			params.badge = search.match(/has\-badge:(.+)/)[1];
			search = search.replace(/has\-badge:(.+)/, "").trim();
		}
		if(params.badge && !DCLookup.pickOff(badges, {id:params.badge})){
			document.querySelector(".results").innerHTML +=  `<h1 class='error'>Error: No badge with that ID exists.</h1>`;
			return;
		}
		if(!params.badge && search === ""){
			DCLookup.loadStartingResults();
			document.querySelector("#no-content").className = "";
			document.querySelector(".searching #close").className = "hide";
			document.querySelector(".searching #link").className = "hide";
			document.querySelector(".searching #link").href = "#";
			return;
		}
		currentUsers = currentUsers.filter(user => {
			if(params.badge){
				//if(params.series === card.series && !params.rarity || params.rarity === card.rarity && !params.series || params.rarity === card.rarity && params.series === card.series){
				if(params.badge && Object.keys(user.badges).includes(params.badge)){
					return true;
				}else{
					return false;
				}
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
			DCLookup.parseResults(currentUsers);
			return;
		}
		DCLookup.parseResults(new Fuse(currentUsers, fuseOptions).search(search));
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
	showUser: function(id){
		//<p><span id="selling_count">1,062</span> Servers</p>
		let user = DCLookup.pickOff(users, {id:id});
		document.querySelector(".load").className = "load";
		document.querySelector(".user-preview .badges").innerHTML = "";
		document.querySelector(".user-preview .cards").innerHTML = "";
		document.querySelector(".user-preview").className = "user-preview show";
		document.querySelector(".user-preview #name").innerText = user.name;
		document.querySelector(".user-preview #discriminator").innerText = "#"+user.discriminator;
		document.querySelector(".user-preview .badges").innerHTML += `<div class="money"><p>${user.money}</p></div>`;
		Object.keys(user.badges).map(b=>{
			document.querySelector(".user-preview .badges").innerHTML += `<img draggable=false src="http://discord.cards/i/b/${b}.png">`
		});
		Object.keys(user.badges).map(b=>{
			finalelm = document.createElement("p");
			finalelm.innerText = DCLookup.pickOff(badges, {id:b}).name;
			Tipped.create(`.user-preview .badges img[src*="${b}"]`, finalelm);
		});
		document.querySelector(".avatar").src = user.avatar_url;
		Object.keys(user.inv).map(c=>{
			if(user.inv[c]) document.querySelector(".user-preview .cards").innerHTML += `<div><img draggable=false src="${c.startsWith("pack") ? `http://discord.cards/i/s/${c.slice(4)}.png` : `http://discord.cards/i/c/${c}.png`}"><p>${user.inv[c]}x</p></div>`
		});
		Object.keys(user.inv).map(c=>{
			finalelm = c.startsWith("pack") ? document.createElement("p") : document.createElement("span");
			finalelm.innerText += `${c.startsWith("pack") ? `Card Pack #${c.slice(4)} - ${DCLookup.pickOff(series, {id:c.slice(4)}).name}` : `#${c} - ${DCLookup.pickOff(cards, {id:c}).name}`}`;
			if(!c.startsWith("pack")) finalelm.innerHTML += `<a href="http://lookup.discord.cards/cards/#${encodeURI(DCLookup.pickOff(cards, {id:c}).name)}"><img width=20 src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_launch_white_18px.svg"></a>`
			if(user.inv[c]) Tipped.create(c.startsWith("pack") ? '.user-preview .cards img[src*="http://discord.cards/i/s/'+c.slice(4)+'.png"]' : '.user-preview .cards img[src*="http://discord.cards/i/c/'+c+'.png"]', finalelm);
		});

		document.querySelector(".load").className = "load hide";
	},
	hideUser: function(force){
		if(!cardLock || force) document.querySelector(".user-preview").className = "user-preview";
	}
};
// Finish Loading sequence
let loadingtxt = document.querySelector(".loading b");
let loadingprog = document.querySelector(".loading progress");
loadingtxt.innerText = "Loading Data...";
try{
	users = request("https://api.discord.cards/list/users");
	badges = request("https://api.discord.cards/list/badges");
	cards = request("https://api.discord.cards/list/cards");
	series = request("https://api.discord.cards/list/series");
	users = users.filter(u=>u.discriminator!==undefined)
	users = users.map(u=>{u.searchname = `${u.name}#${u.discriminator}`; u.avatar_url = u.avatar ? (u.avatar.startsWith("a_") ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.gif?size=1024` : `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=1024`) : `https://discordapp.com/assets/${avatarHashes[u.discriminator % avatarHashes.length]}.png`; return u;})
	loadingtxt.innerText = "Loading Images...";
	loadingprog.className = "";
	loadingprog.max = badges.length+cards.length+series.length+SVGassets.length;
	cards.map(s=>DCLookup.preloadImage(`https://discord.cards/i/c/${s.id}.png`));
	badges.map(s=>DCLookup.preloadImage(`https://discord.cards/i/b/${s.id}.png`));
	series.map(s=>DCLookup.preloadImage(`https://discord.cards/i/s/${s.id}.png`));
	SVGassets.map(url=>DCLookup.preloadImage(url));
	window.onload = ()=>{
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

