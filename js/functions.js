

var DEBUG = (window.location.hash.substr(1) == 'watson_debug');
var PROXY_URL = "";


//
var store;
var session = true;
var session_time = 10;
var started = false;
var start_message = "hola";
var watson_status;

// global variables
var WW;
var WH;

// global objets
var $body;
var $openChat;
var $closeChat;
var $minimizeChat;
var $chatMessage;
var $chatWindow;

var $imgViewer;
var $sendButton;
var $messengerBody;

var $closePopup;
var $acceptClosePopup;
var $cancelClosePopup;

var $satisfaction;
var $sendSatisfaction;
var $closeSatisfaction;
var $minimizeSatisfaction;
var $stars;

var value;
var Contexto = '';
var Datos = '';
// ---



// READY

// document ready
document.addEventListener('DOMContentLoaded', function(event) {

	$body = document.getElementsByTagName("BODY")[0];
	$openChat = document.getElementsByClassName('launcher')[0];
	$messengerBody = document.getElementsByClassName('messenger-body')[0];
	$closeChat = document.getElementById('closeChat');
	$minimizeChat = document.getElementById('minimizeChat');
	$minimizeChat = document.getElementById('minimizeChat');
	$chatMessage = document.getElementById('chatMessage');
	$chatWindow = document.getElementById('chatWindow');

	$imgViewer = document.getElementById("img-viewer");
	$sendButton = document.getElementById("send-button");

	$closePopup = document.getElementById("closePopup");
	$acceptClosePopup = document.getElementById("acceptClosePopup");
	$cancelClosePopup = document.getElementById("cancelClosePopup");

	$satisfaction = document.getElementById("satisfaction");
	$sendSatisfaction = document.getElementById("sendSatisfaction");
	$closeSatisfaction = document.getElementById("closeSatisfaction");
	$minimizeSatisfaction = document.getElementById("minimizeSatisfaction");
	$stars = document.querySelectorAll('[data-star]');

	// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/false || !!document.documentMode;
	if(isIE){
		document.getElementById('watson_container').className = 'isIE';
	}

	$openChat.addEventListener("click", openChat, false);
	$closeChat.addEventListener("click", closeChat, false);
	$minimizeChat.addEventListener("click", minimizeChat, false);

	$closeSatisfaction.addEventListener("click", sendNoSatisfaction, false);
	$minimizeSatisfaction.addEventListener("click", minimizeSatisfaction, false);
	$sendSatisfaction.addEventListener("click", sendSatisfaction, false);

	$chatWindow.addEventListener("click", chatWindowClick, false);

	$acceptClosePopup.addEventListener("click", acceptClosePopup, false);
	$cancelClosePopup.addEventListener("click", cancelClosePopup, false);

	for(var i = 0; i<$stars.length; i++){
		$stars[i].addEventListener("click", starClick, false);
		$stars[i].addEventListener("mouseover", starOver, false);
		$stars[i].addEventListener("mouseout", starOut, false);
	}

	$chatMessage.onkeypress = function (e) {
		if (e.keyCode == 13 && !e.shiftKey) {
			writeAndSendMessage($chatMessage.value);
		//	speechRecognizer.stop();
			return false;
		}
	};

	$sendButton.addEventListener("click", sendButton, false);

	document.addEventListener("click", documentClick, false);
	document.addEventListener("_se", documentSe, false);

	var stayonthis = true;
	window.onbeforeunload = function(e) {
		var className = $body.className;
		if(stayonthis && className.indexOf('display-chat')>-1) {
			stayonthis = false;
			return true;
		}
	}

	tryProxy(ready);

});
// ---


// FUNCTIONS
function ready(){
	if(watson_status == 200){
		try{
			startChat();
		}catch (error){
			if(DEBUG) startChat();
		}
	}else{
		if(DEBUG) startChat();
	}
}
//startChat
function startChat(){


	resetStore();

	setTimeout(function () {

		$openChat.className += " active";

		setTimeout(function () {
			$openChat.className += " inital-view";
			setTimeout(function () {
					$openChat.className = $openChat.className.replace("inital-view", "");
			}, 4000);
		}, 1000);

	}, 1000);

	if(session){
		var previous = store.getConversation();
		if(previous){//start previousconversration
			startConversation(previous)
		}
	}

}

//click listeners
function openChat(e){
	if(DEBUG) console.log('openChat');
	startConversation();
}

function closeChat(e){
	e.preventDefault();
	trackPageClose();
	showClosePopup();
}

function minimizeChat(event){
	event.preventDefault();
	trackEvent('Minimizar chat','Chat minimizado');
	pauseConversation();
}

// POP UP
function showClosePopup(){
	$closePopup.className = $closePopup.className.replace("active", "");
	$closePopup.className+= " active";
}

function hideClosePopup(){
	$closePopup.className = $closePopup.className.replace("active", "");
}

function acceptClosePopup(event){
	event.preventDefault();
	trackEvent('Cierre del chat','Aceptar');
	showSatisfaction();
}

function cancelClosePopup(event){
	event.preventDefault();
	trackEvent('Cierre del chat','Cancelar');
	hideClosePopup();
}

//SATISFACTION
function showSatisfaction(){
	if(DEBUG) console.log('showSatisfaction');

	resetStars();

	hideClosePopup();

	resetStore();

	$satisfaction.className = $satisfaction.className.replace("active", "");
	$satisfaction.className+= " active";
}

function sendSatisfaction(event){
	event.preventDefault();
	if($sendSatisfaction.className.indexOf('active')>-1 ) {
		if($satisfaction.className.indexOf('success')<0){
			trackEvent('Satisfaccion', actual_star.toString());
		}
		//closeSatisfaction();
		$satisfaction.className = $satisfaction.className.replace("success", "");
		$satisfaction.className+= " success";
	}
}

function sendNoSatisfaction(event){
	event.preventDefault();
	if($satisfaction.className.indexOf('success')<0){
		trackEvent('Satisfaccion', 'Cerrar sin calificar');
	}
	closeSatisfaction();
}

function closeSatisfaction(){
	$satisfaction.className = $satisfaction.className.replace("active", "");
	$satisfaction.className = $satisfaction.className.replace("success", "");
	$body.className = $body.className.replace("display-chat", "").trim();
}

function minimizeSatisfaction(event){
	event.preventDefault();
	pauseConversation();
}

function documentClick(event){
	//close image
	if (event.target.tagName.toLowerCase() != 'img' && event.target != $imgViewer) {
		hideImageViewer();

	}
}

function sendButton(e){
	e.preventDefault();
    speechRecognizer.stop();

	if ($chatMessage.value) {
		writeAndSendMessage($chatMessage.value);
        speechRecognizer.stop();
	}
    speechRecognizer.stop();
    $("input[name=mensajeAEnviar]").val("");

}

function documentSe(e){
	if(DEBUG) console.log('session expired');
	session = false;
	$chatMessage.value = '';
	struct = document.createElement("div");
	struct.className = "message error";
	struct.innerHTML = '<div class="message-meta"></div><div class="message-block"><p>Tu sesión ha expirado.</p></div>';
	$chatWindow.appendChild(struct);
	$chatWindow.scrollTop = $chatWindow.scrollHeight;
}

function chatWindowClick(e){
	if(e.target.className == "showPossibleQuestions"){
		showPossibleQuestions(e.target);
		trackEvent('Confirmacion respuesta valida','No');
	}else
	if(e.target.className == "removePossibleQuestions"){
		removePossibleQuestions(e.target);
		trackEvent('Confirmacion respuesta valida','Si');
	}else
	if(e.target.className == "possibleQuestion"){
		trackEvent('Eleccion pregunta alternativa', e.target.text);
	}else
	//open image
	if (e.target.tagName.toLowerCase() === 'img') {
		showImageViewer(e.target);
	}
}

//startConversation
function startConversation(previous){
	$chatWindow.innerHTML = '';
	previous = (previous) ? previous : store.getConversation();
	var className = $body.className;
	className += ' display-chat';
	$body.className = className;
	trackPageOpen();
	if(previous){//start previousconversration
		if(DEBUG) console.log('previous conversation');
		renderConversation(previous);
	}else{//else, start conversation automatically
		session = true;
		sendMessage(start_message);
	}
}

//resetConversation
function resetConversation(){
	resetStore();

	var className = $body.className;
	className = className.replace("display-chat", "").trim();
	$body.className = className;
}

//pauseConversation
function pauseConversation(){
	var className = $body.className;
	className = className.replace("display-chat", "").trim();
	$body.className = className;
}



//answerBack
function answerBack(data) {
	var confidence = getConfidence(data);
	var html_message = '';
	if(typeof(data.output.error) == "string"){
		html_message+= 'Hubo un error. Por favor intenta más tarde.';
		//html_message+= '<p>'+data.output.error+'</p>';
	}else{
        //alert(data.output.text);

        for(var i in data.output.text){
			if(data.output.text[i].substring(0, 2) == '<p'){
				html_message+=data.output.text[i];
			}else{
				html_message+="<p>"+data.output.text[i]+"</p>";
			}
		}
        if(data.context.options){
            html_message+='<ul class="answer-options">';
            for(i in data.context.options){
                html_message+='<li><a onclick="writeAndSendMessage(\''+data.context.options[i]+'\');">'+data.context.options[i]+'</a></li>';
            }
            html_message+='</ul>';
        }

		// if(data.context.not_confident){
		// 	for(i in data.context.possibleQuestions){
		// 		html_message+='<p><a onclick="writeAndSendMessage(\''+data.context.possibleQuestions[i]+'\');">'+data.context.possibleQuestions[i]+'</a></p>';
		// 	}
		// }
	}
	var imageProcess = addZoomToImages(html_message);

	html_message = imageProcess.html;

	var html_suggestion_topics = '';
	if(data.context){
		if(data.context.suggestion_topic && data.context.suggestion_topics.length){
			html_suggestion_topics+='<div class="header"><h2>Puedo sugerirte</h2></div>';
			html_suggestion_topics+= '<ul>';
			for(var i in data.context.suggestion_topics){
				html_suggestion_topics+='<li><a onclick="writeAndSendMessage(\''+data.context.suggestion_topics[i]+'\');">'+data.context.suggestion_topics[i]+'</a></li>';
			}
			html_suggestion_topics+= '</ul>';
		}
	}

	var html_possible_questions = '';
	if( data.context.ask_answer_was_useful && data.context.possibleQuestions.length){
		html_possible_questions+= '<ul class="answer-options">';
		for(var i = 0; i<data.context.possibleQuestions.length; i++){
			html_possible_questions+='<li><a class="possibleQuestion" onclick="writeAndSendMessage(\''+data.context.possibleQuestions[i]+'\');">'+data.context.possibleQuestions[i]+'</a></li>';
		}
		html_possible_questions+= '</ul>';
	}

	var obj_msg = {
		'from': 'watson',
		'message': html_message,
		'suggestion': html_suggestion_topics,
		'possible_questions': html_possible_questions,
		'confidence': confidence,
		'time': currentTime()
	};

	store.saveMessage(obj_msg);
	obj_msg.context = data.context;
	writeAnswer(obj_msg);

	var intent = (data.intents.length) ? data.intents[0].intent : '';
	/*
		Respuesta
		Desambiguación
		Sugerencia
		Respuesta con imagen.
	*/
	var respuesta = (imageProcess.has_images) ? 'Respuesta con imagen' : 'Respuesta';

	var regex = /(<([^>]+)>)/ig;

	trackResponse(html_message.replace(regex, ""), respuesta, intent, confidence+'%');

}


function writeAnswer(obj){
	hideLoading();

	messageSuccess = document.createElement("div");
	messageSuccess.className = "message received";
	messageSuccess.innerHTML = '<div class="message-block">'+obj.message+'</div><div class="time">'+obj.time+'</div>';
	$chatWindow.appendChild(messageSuccess);

	addMessageClear();

	var _height = messageSuccess.offsetHeight+20;

	if(obj.possible_questions){


		var possibleQuestions = document.getElementsByClassName('possible-questions');
		for(var i= 0; i<possibleQuestions.length; i++){
			$chatWindow.removeChild(possibleQuestions[i]);
		}

		messagePossibleQuestions = document.createElement("div");
		messagePossibleQuestions.className = "possible-questions";
		messagePossibleQuestions.innerHTML = '<p>¿Esto responde a tu pregunta? <a class="removePossibleQuestions" id="bad">Si</a> - <a class="showPossibleQuestions">No</a></p><div class="hidden-possible-questions"><p>A lo mejor quisiste preguntar por esto:</p>'+obj.possible_questions+'</div>';
		messagePossibleQuestions.innerHTML+= '<div class="clear"></div>';
		$chatWindow.appendChild(messagePossibleQuestions);

		_height= _height + messagePossibleQuestions.offsetHeight+20
	}


	if(obj.suggestion){
		messageSuggestionTopics = document.createElement("div");
		messageSuggestionTopics.className = "suggestion-topics";
		messageSuggestionTopics.innerHTML = obj.suggestion;
		$chatWindow.appendChild(messageSuggestionTopics);

		addMessageClear();

		_height= _height + messageSuggestionTopics.offsetHeight+20;
	}

	$chatWindow.scrollTop = $chatWindow.scrollHeight-_height-35;
}

function writeAndSendMessage(message){
	if(message == '') return;

	var formatted_message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');

	var obj_msg = {
		'from': 'user',
		'message': formatted_message,
		'time': currentTime()
	};
	if(DEBUG) console.log(obj_msg);
	store.saveMessage(obj_msg);
	writeMessage(obj_msg);
	if(session){
		sendMessage(message);
	}else{
		session = true;
		sendMessage(start_message);
	}
}

function writeMessage(obj){
	if(session){
		$chatMessage.value = '';
		struct = document.createElement("div");
		struct.className = "message send";
		struct.innerHTML = '<div class="message-meta"></div><div class="message-block"><p>'+obj.message+'</p></div><div class="time">'+obj.time+'</div>';

		$chatWindow.appendChild(struct);

		addMessageClear();
	}
}

function renderConversation(previous){
	showLoading();

	//set global context
	context = JSON.stringify(previous.context);

	//remove context of each watson
	for(var i = 0; i<previous.conversation.length; i++){
		if(previous.conversation[i].from == 'watson'){
			previous.conversation[i].context = {};
			if(i+1 < previous.conversation.length){
				previous.conversation[i].possible_questions = '';
			}
		}
	}

	//add context to last watson
	for(var i = previous.conversation.length-1; i>=0; i--){
		if(previous.conversation[i].from == 'watson'){
			previous.conversation[i].context = previous.context;
			break;
		}
	}

	//write messages
	for(var i = 0; i<previous.conversation.length; i++){
		var c = previous.conversation[i];
		if(c.from == 'watson'){
			writeAnswer(c);
		}else{
			writeMessage(c);
		}
	}

}

function sendMessage(text) {



     if (text == "hola"){
         PROXY_URL="json/data0.json";
     };

     if (text == "Cuáles son las novedades en política de hoy?" || text == "Cuáles son las novedades en política de hoy" || text == "Saber sobre las novedades en política de hoy" ){
         PROXY_URL="json/data1.json";
     };
	 if (text == "Noticia 1"){
        PROXY_URL="json/data3.json";
     };

     if (text == "Saber sobre lebac"){
         PROXY_URL="json/data4.json";
     };

    if (text == "Cinco claves para entender el laboratorio del Dr. Sturzenegger"){
	 	PROXY_URL="json/data5.json";
	 };

    if (text == "Y qué pasó en Londres"){
        PROXY_URL="json/data6.json";
    };

    if (text == "Sentinel del norte La misteriosa isla donde los visitantes mueren"){
        PROXY_URL="json/data7.json";
    };


    if (text == "ver el video más visto de tecnología y bebés" || text == "Ver el video más visto de tecnología y bebés" ){
        PROXY_URL="json/data11.json";
    };

    if (text == "ver diariero cerca" || text == "Ver diariero cerca" ){
        PROXY_URL="json/data12.json";



    };



	showLoading();

	var params =  {
		"Datos": {
		"TextoConsulta":"donde esta el cajero mas cercano?",
		"idConversacion": "1ag8302o-838e"
		}
	}

    $.getJSON(PROXY_URL, function(data) {
        answerBack(data);
        if(PROXY_URL === "json/data12.json"){
            initMap();
		}
    });


/*
	// var nu_context= context.replaceAll("input","in_rep");
	// nu_context= nu_context.replaceAll("INPUT","in_rep");
    //
	// try{
	// 	var context_edit = JSON.parse(nu_context);
	// 	context_edit.disclaimer_procrear = "";
	// 	if(context!=''){
	// 		params+="&context="+ encodeURIComponent(JSON.stringify(context_edit));
	// 	}
    //
	// }catch(err){
    //
	// }

	var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

	xhr.open('POST', PROXY_URL, true);

	xhr.onreadystatechange = function() {
		console.log(xhr);
		alert("entro");
		if(xhr.readyState == 4 && xhr.status == 201) {
			alert(xhr.responseText);
		}
		//xhr.send(params);
        alert("clau2");
		if (xhr.readyState>3){
			watson_status = xhr.status;


			if(xhr.status==201){
				console.log(xhr)
				var json_data = JSON.parse(xhr.responseText);

				console.log(json_data);

				if(DEBUG) console.log(json_data);

				console.log(json_data.Datos.Contexto);

				store.saveContext(json_data.Datos.Contexto);
				try{
					context = JSON.stringify(json_data.Datos.Contexto);

				}catch(e){}

				answerBack(json_data);
			}else{
				if(DEBUG) console.log(xhr.statusText);
				showError();
			}
		}

	};
    alert(xhr.response.output.text);
    xhr.send(text);


	//xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	//xhr.send(params);
	return xhr;

	*/
}


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function tryProxy(callback){
	var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
	xhr.open('GET', PROXY_URL);
	xhr.onreadystatechange = function() {
		if (xhr.readyState>3){
			watson_status = xhr.status;
			if(callback != undefined) callback();
		}
	};
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
	xhr.send();
	return xhr;
}


var showPossibleQuestions = function(target){
	var $parent = target.parentElement.parentElement;

	var html_message = $parent.getElementsByClassName('hidden-possible-questions')[0].innerHTML;

	var obj_msg = {
		'from': 'watson',
		'message': html_message,
		'confidence': '',
		'time': currentTime()
	};

	store.saveMessage(obj_msg);

	//obj_msg.context = context;
	writeAnswer(obj_msg);

	removePossibleQuestions(target);
}

var removePossibleQuestions = function(target){
	var $parent = target.parentElement.parentElement;
	$chatWindow.removeChild($parent);
}

//stars
var actual_star = 1;
var starOver = function(e){
	var star = parseInt(e.target.getAttribute('data-star'));
	for(var i=1; i<=star; i++){
		var selector = document.querySelectorAll('[data-star="'+i+'"]')[0];
		var className = selector.className;
		if(className.indexOf('active')<0) {
			selector.className+= ' active';
		}
	}
}

var starOut = function(){
	for(var i=0; i<$stars.length; i++){
		var selector = $stars[i];
		var className = selector.className;
		if(className.indexOf('hold')<0) {
			selector.className = '';
		}
	}
}

var starClick = function(event){
	event.preventDefault();
	var star = parseInt(event.target.getAttribute('data-star'));
	actual_star = star;
	for(var i=1; i<$stars.length; i++){
		var selector = $stars[i];
		selector.className = '';
	}
	for(var i=1; i<=star; i++){
		var selector = document.querySelectorAll('[data-star="'+i+'"]')[0];
		var className = selector.className;
		selector.className= 'active hold';
	}

	$sendSatisfaction.className = $sendSatisfaction.className.replace("active", "");
	$sendSatisfaction.className+= " active";
}

var resetStars = function(){
	actual_star = 1;
	for(var i=0; i<$stars.length; i++){
		var selector = $stars[i];
		selector.className = '';
	}
	$sendSatisfaction.className = $sendSatisfaction.className.replace("active", "");
}

// image viewer
var showImageViewer = function(target){
	$target = target.cloneNode();
	var className = $body.className.replace("viewerEvent", "").trim();
	$body.className = className+' viewerEvent';
	$imgViewer.innerHTML = '';
	$imgViewer.appendChild($target);
}
var hideImageViewer = function(){
	var className = $body.className;
	$body.className = className.replace("viewerEvent", "").trim();
	$imgViewer.innerHTML = '';
}

//MESSAGES

//Loading
messageLoading = document.createElement("div");
messageLoading.id = "loading-message";
messageLoading.className = "loading";
messageLoading.innerHTML = '<span class="dot dot1"></span><span class="dot dot2"></span><span class="dot dot3"></span>';

function showLoading(){
	//hideError();
	hideLoading();
	$chatWindow.appendChild(messageLoading);

	addMessageClear('clear-loading');

	$chatWindow.scrollTop = $chatWindow.scrollHeight;
}
function hideLoading(){
	var itemNode = document.getElementById("loading-message");
	if(itemNode){
		itemNode.parentNode.removeChild(itemNode);
	}
	var itemNode = document.getElementById("clear-loading");
	if(itemNode){
		itemNode.parentNode.removeChild(itemNode);
	}
}

//Error
function showError(){
	var  messageError = document.createElement("div");
	messageError.id = "error-message";
	messageError.className = "message error";
	messageError.innerHTML = '<div class="message-block"><p>Error no se pudo enviar el mensaje</p></div>';
	//hideError();
	hideLoading();
	$chatWindow.appendChild(messageError);
	addMessageClear();
}
function hideError(){
	var itemNode = document.getElementById("error-message");
	if(itemNode){
		itemNode.parentNode.removeChild(itemNode);
	}
}

//HELPERS

//confidence to %
var getConfidence = function(data){
	var confidence = '';
	if(!data) return confidence;
	if(!data.intents) return confidence;
	if(data.intents.length)	confidence = parseInt(data.intents[0].confidence*100);
	return confidence;
}

var addZoomToImages = function(html){
	var $tmp = document.createElement("div");
	$tmp.innerHTML = html;

	var zoom = document.createElement("span");
	zoom.className = "zoom";

	var images = $tmp.getElementsByTagName("img");

	for(var i = 0; i<images.length; i++){
		if(images[i].nextElementSibling == null){
			images[i].parentNode.insertBefore(zoom, images[i].nextSibling);
		}else if(images[i].nextElementSibling.className != 'zoom'){
			images[i].parentNode.insertBefore(zoom, images[i].nextSibling);
		}
	}
	var obj ={
		html: $tmp.innerHTML,
		has_images: !!images.length
	}
	return obj;
}

var addMessageClear = function(id){
	var messageClear = document.createElement("div");
	messageClear.className = "clear";
	if(typeof id != "undefined") messageClear.id = id;
	$chatWindow.appendChild(messageClear);
}

var currentTime=function(){var d = new Date();var t=_z(d.getHours(),2)+":"+_z(d.getMinutes(),2);return t;}
var _z=function(n, p){return (''+(Math.pow(10,p)+n)).slice(1)};

var resetStore = function(){
	if (store) store.stop();
	if (store) store.clearConversation();
	store = new Store(renderConversation);
}

var Store = function(callback){
	var _ = this;
	var w = 'w', wl = 'wl';
	var timer;
	_.length = 0;

	this.init = function(){
		_.supported = isSupported();
		started = false;
		if(_.supported){
			if(!get(w,1) && !get(wl)){
				if(DEBUG) console.log('no wl');
				_.clearConversation();
			}else{
				_.length = get(wl);
			}
			x = null;
		}
	}

	this.stop = function(){
		if (timer) clearInterval(timer);
	}

	this.saveContext = function(context){
		if (!_.supported) return;
		var tmp = get(w,1);
		if(tmp != undefined){
			tmp.context = context
			save(w,tmp,1);
		}
	}

	this.saveMessage = function(message){
		if (!_.supported) return;
		var tmp = get(w,1);
		if(typeof tmp=="object"){
			tmp.conversation.push(message);
			_.length = tmp.conversation.length;
			save(w,tmp,1);
			save(wl,_.length);
		}else{
			_.clearConversation();
		}
		setTimer();
	}

	this.getConversation = function(){
		var tmp = get(w,1);
		if(tmp == undefined) return;
		if(JSON.stringify(tmp.context) == '{}' && !tmp.conversation.length) return;
		setTimer();
		return tmp;
	}

	this.clearConversation = function(){
		if (!_.supported) return;
		save(w,{context:{},conversation:[]},1);
		save(wl,0);
		_.length = 0;
		session = true;
	}

	var isSupported = function(){
		try{
			localStorage.setItem('supported', 'supported');
			localStorage.removeItem('supported');
			if(DEBUG) console.log('localStorage supported');
			return true
		}catch (error){
			if(DEBUG) console.log('localStorage unsupported');
			return false;
		}
	}

	var save = function(var_name, var_value, r){
		if (!_.supported) return;
		var tmp = JSON.stringify(var_value);
		if(r) tmp=_e(tmp,var_name);
		localStorage.setItem(var_name,tmp);
	}

	var get = function(var_name, r){
		if (!_.supported) return;
		var tmp = localStorage.getItem(var_name);
		if (!tmp) return;
		if (r) tmp=_d(tmp,var_name);
		if (r && tmp==false) return
		tmp = JSON.parse(tmp);
		return tmp;
	}

	var remove = function(var_name){
		if (!_.supported) return;
		localStorage.removeItem(var_name);
	}

	var setTimer = function(){
		started = true;
		timer = (!timer) ? setInterval(checkLength, 2000) : timer;
	}

	var checkLength = function() {
		var tmp = parseInt(get(wl));
		var diff = Math.abs(_.length - tmp);
		if(diff){
			if(DEBUG) console.log('sincro');
			var tmp = _.getConversation();
			if(typeof tmp=="object"){
				var l = tmp.conversation.length;
				tmp.conversation.splice(0, _.length);
				_.length = l;
				save(wl,_.length);
				callback(tmp);
			}else{
				_.clearConversation();
			}
		}
	}

	this.init();
}

var _e=function(d,n){return sjcl.encrypt(_p(0),d)}

var _d = function(d,n){
	try {
		var r = sjcl.decrypt(_p(0),d);
		return r;
	}
	catch(e) {
		try {
			var r = sjcl.decrypt(_p(1), d);
			var _r = sjcl.encrypt(_p(0),r);
			localStorage.setItem(n,_r);
			return r;
		}
		catch(e) {
			session = false;
			if(started) document.dispatchEvent(new CustomEvent('_se'));
			return false;
		}
	}
}

var _m = session_time;
var _p=function(i){var d=new Date();if(i)d.setMinutes(d.getMinutes()-_m);var t =6E4*_m, ht=3E4*_m,b=d.getTime()+ht,c=b%t,r=Math.round(new Date(ht>=c?b-c:b+t-c).getTime()/1E3).toString();return r}
var _ls=function(){var _lsT=0,_xL,_x,_t;for(_x in localStorage){_xL=((localStorage[_x].length+_x.length)*2);_lsT+=_xL;}_t=(_lsT/1024).toFixed(2)+" KB";return _t}

//analytics
var trackEvent = function(action, label){
	var data = {
		'event': 'trackEvent',
		'eventCategory': 'Watson',
		'eventAction': action,
		'eventLabel': label
	};
	pushDataLayer(data);
}

var trackResponse = function(label, tipo, intencion, confianza){
	var data = {
		'event': 'trackEvent',
		'eventCategory': 'Watson',
		'eventAction': 'Respuesta',
		'eventLabel': label,
		'Tipo': tipo,
		'Intencion': intencion,
		'Confianza': confianza
	};
	pushDataLayer(data);
}

var trackPage = function(pageName){
	var data = {
		'event': 'trackPageview',
		'pageName': pageName,
	};
	pushDataLayer(data);
}

var trackPageOpen = function(){trackPage('/banco/online/personas/watson/chat')};

var trackPageClose = function(){trackPage('/banco/online/personas/watson/cierre')};

var pushDataLayer = function(data){
	if(DEBUG) console.log(data);
	if(typeof(dataLayer) == "undefined") return false;
	dataLayer.push(data);
}
