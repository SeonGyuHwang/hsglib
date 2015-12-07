(function($){
	"use strict";
	var socket = io.connect(location.protocol +"//"+ location.hostname +":"+ location.port);
	var me = null, pageMove = true, joinCheck = false;
	window.onunload = function(){ socket.disconnect(); };
	
	/*$('#frm').ajaxForm({
		dataType: 'json',
		resetForm: true,
	    beforeSend: function() {
	    	$('#status').empty();
			$.blockUI({ 
				message: '0%',
				showOverlay: false,
				css: { 
					left: '40%',
					width: '10%',
					border: 'none', 
					padding: '20px', 
					backgroundColor: '#000', 
					'-webkit-border-radius': '10px', 
					'-moz-border-radius': '10px', 
					color: '#fff'
				} 
			});		        
	    },
	    uploadProgress: function(event, position, total, percentComplete) {
	        var percentVal = percentComplete + '%';
	        $('.blockMsg').html(percentVal);
	    },
	    success: function(data) {
		    console.log(data);
	    },
		complete: function(xhr) {
			console.log(xhr);
			$.unblockUI();
		}
	});*/ 			
	
	if (!Object.keys) {
		Object.keys = function(obj) {
			var keys = [];

			for (var i in obj) {
				if (obj.hasOwnProperty(i)) {
					keys.push(i);
				}
			}

			return keys;
		};
	}
	
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(elt /*, from*/)
		{
			var len = this.length >>> 0;

			var from = Number(arguments[1]) || 0;
			from = (from < 0) ? Math.ceil(from) : Math.floor(from);
			if (from < 0)
				from += len;

			for (; from < len; from++) {
				if (from in this && his[from] === elt)
					return from;
			}
			return -1;
		};
	}	
	
	var delay = (function(){
		var timer = 0;
		return function(callback, ms){
			clearTimeout (timer);
			timer = setTimeout(callback, ms);
		};
	})();

	var publicLayer = {
		'useLayer': false,
		'o': '_layer_',
		'v': '_layerOveray_',
		'w': $(window).width()*0.8,
		'h': $(window).height()*0.8,
		'reset': function(){
			$("._layers_").remove();

			this.useLayer = false;
			this.w = $(window).width()*0.8;
			this.h = $(window).width()*0.8;
			this.o = '_layer_';
			this.v = '_layerOveray_';

		},
		'resize': function(){
			if( this.useLayer ) {
				$('.'+this.o).css({
					'top' :  ( $(window).scrollTop() + ($(window).height() - parseInt(this.h)) / 2 )+'px',
					'left' :  ( $(window).width() / 2 ) - ( parseInt(this.w) / 2 ) +'px'
				});

				$('.'+this.v).css({
					'width': $(document).width()+'px',
					'height': $(document).height()+'px'
				});
			}
		},
		'setCss': function(options){
			if( options )
				$('.'+this.o).css(options);
		},
		'setHtml': function(addHtml){
			$('body').append( '<div class="'+ this.o +' _layers_"></div>' );
			$('body').append( '<div class="'+ this.v +' _layers_"></div>' );

			$('.'+this.v).css({
				'width': $(document).width()+'px',
				'height': $(document).height()+'px',
				'position': 'absolute',
				'top': '0',
				'left': '0',
				'z-index': '1004',
				'filter': 'alpha(opacity=50)',
				'-khtml-opacity': '0.5',
				'-moz-opacity': '0.5',
				'opacity': '0.5',
				'background-color': '#000',
				'display': 'none'
			});

			$('.'+this.o).css({
				'top': ( $(window).scrollTop() + ($(window).height() - this.h) / 2 )+'px',
				'left': ( $(window).width() / 2 ) - ( this.w / 2 )+'px',
				'width': this.w,
				'height': this.h,
				'position': 'absolute',
				'padding': '0px',
				'background-color': '#fff',
				'border-radius': '10px',
				'-moz-border-radius': '10px',
				'-webkit-border-radius': '10px',
				'overflow-y': 'auto',
				'cursor': 'default',
				'z-index': '1005',
				'display': 'none'
			});

			$('.'+this.o).html(addHtml);
		},
		'setSize': function(w, h){
			this.w = w || $(window).width()*0.8;
			this.h = h || $(window).height()*0.8;
		},
		'init': function(){
			this.useLayer = true;
			$('._layers_').show();

			$(window).resize(function(){ publicLayer.resize(); });
			$(window).scroll(function(){ publicLayer.resize(); });
			$(document).on('click touchstart', '.'+this.v, function(){ publicLayer.reset(); });
		}
	};

	var queryString = {
		'setArr' : [],
		'init': function(){
			var URI = location.href.split("?");
			if(URI.length > 1){
				URI = URI[1].split("&");
				for(var i in URI)
					if(URI[i])
						this.setArr[this.setArr.length] = { key: URI[i].split("=")[0], value: URI[i].split("=")[1] };
			}
		},
		'getParam': function(getKey){
			var getValue = null;
			if(this.setArr.length > 0){
				for(var i in this.setArr)
					if(this.setArr[i].key == getKey)
						getValue = this.setArr[i].value;
			}

			return getValue;
		}
	};


	var htmlspecialchars = function (string, quote_style, charset, double_encode) {
		var optTemp = 0, i = 0, noquotes = false;
		if (typeof quote_style === 'undefined' || quote_style === null) {
			quote_style = 2;
		}
		string = string.toString();
		if (double_encode !== false) {
			// Put this first to avoid double-encoding
			string = string.replace(/&/g, '&amp;');
		}
		string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');

		var OPTS = {
			'ENT_NOQUOTES' : 0,
			'ENT_HTML_QUOTE_SINGLE' : 1,
			'ENT_HTML_QUOTE_DOUBLE' : 2,
			'ENT_COMPAT' : 2,
			'ENT_QUOTES' : 3,
			'ENT_IGNORE' : 4
		};
		if (quote_style === 0) {
			noquotes = true;
		}
		if (typeof quote_style !== 'number') {
			// Allow for a single string or an array of string flags
			quote_style = [].concat(quote_style);
			for (i = 0; i < quote_style.length; i++) {
				// Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
				if (OPTS[quote_style[i]] === 0) {
					noquotes = true;
				} else if (OPTS[quote_style[i]]) {
					optTemp = optTemp | OPTS[quote_style[i]];
				}
			}
			quote_style = optTemp;
		}
		if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
			string = string.replace(/'/g, '&#039;');
		}
		if (!noquotes) {
			string = string.replace(/"/g, '&quot;');
		}

		return string;
	};



	var dashBoardScroll = function(){
		//var _height = parseInt($('.dashBoardText li').length);
		/*$('.dashBoardText').animate({
		 scrollTop: $(".dashBoardText")[0].scrollHeight
		 }, 'fast');*/
		$('.dashBoardText').scrollTop($(".dashBoardText")[0].scrollHeight);
	};

	var showMessage = function(text, type, icon){
		if( !icon ) icon = '/img/green_c.png';
		var div = '<div class="checkMsgSwap">';
				div += '<div class="checkMsg"><img src="'+icon+'" class="width_24" alt="checkBox" />'+decodeURIComponent(text)+'</div>';
			div += '</div>';
		$('.checkMsgSwap').remove();
		$('body').append(div);
		if( type == true )
			removeMessage( $('.checkMsgSwap') );
	};

	var removeMessage = function(o){
		delay(function(){
			o.fadeOut("slow", function(){
				o.remove();
			});
		}, 2500);
	};

	var layerCenter = function(w, h, o, v){
		if( $("._layerOveray_").length < 1 && $('.gameJoinCheckDiv').length == '0' )
			$('body').append( '<div class="_layerOveray_"></div>' );

		var width = $(window).width() <= 400 ? 250 : w || $(window).width()*0.8;
		var height = $(window).width() <= 400 ? parseInt(h)+40 : h || $(window).height()*0.8;

		var layer = o || $('._layer_');
		var overay = v || $('._layerOveray_');

		var top = ( $(window).scrollTop() + ($(window).height() - height) / 2 );
		var left = ($(window).width()/2) - (width/2);

		overay.css({
			width: $(document).width()+'px',
			height: $(document).height()+'px'
		});

		layer.css({
			top: top,
			left: $(window).width() <= 400 ? parseInt(left)-10 : left,
			width: width,
			height: height
		});
	};

	var layerNotice = function(msg){
		$('._layer_,._layerOveray_').remove();
		var div = '<div class="_layer_">';
				div += '<div class="gameJoinCheckDiv">'+msg+'</div>';
			div += '</div>';
		$('body').append(div);
	};

	$(function(){
		queryString.init();
		/*window.onbeforeunload = function (e) { 
			e = e || window.event; 
			if (e) 
				e.returnValue = '현재 페이지를 벗어 나시겠습니까?'; 
			return '현재 페이지를 벗어 나시겠습니까?'; 
		};*/

		
		$(window).resize(function(){
			if( $('._layer_').length > 0 ) 
				layerCenter($('._layer_').width(), $('._layer_').height());
		}).resize();
		
		socket.on('connect', function(){ 
			socket.emit('addClient', 'Anonymous');
			pageMove = false;
		});

		socket.on('addDashboad', function(userNm, data, m){
			var addText = '<li>'+userNm+' : '+data+'</li>';
			$('.dashBoardText ul').append( decodeURIComponent(addText) );
			if( m ) {
				me = m;
				$('.tradeItem[data-uid="'+me+'"]').addClass('me').find('span').append('(본인)');
			}
			
			dashBoardScroll();
		});
		
		socket.on('updateClient', function(data, gameUser){
			$('.tradeSwap').empty();
			$.each(data, function(k, v) {
				var addDiv = '<div class="tradeItem" data-uid="'+k+'">';
						addDiv += '<span class="nickNm">'+decodeURIComponent(v)+'</span>';
					addDiv += '</div>';
					
				$('.tradeSwap').append(addDiv);
			});
			$('.tradeItem[data-uid="'+me+'"]').addClass('me').find('span').append('(본인)');
			//$('#connUserCnt').html("Welcome ~ 현재 접속자 : "+$('.tradeItem').length+"명");
			
			if( Object.keys(gameUser).indexOf(me) != -1 ) {
				$.each(gameUser, function(k, v){
					var img = "";
					if( v == 'check' ) img = '<img src="/img/yellow_q.png" class="width_24" alt="체크중" />';
					else if ( v == 'agree' ) img = '<img src="/img/green_c.png" class="width_24" alt="동의" />';
					else if ( v == 'disagree' ) img = '<img src="/img/red_x.png" class="width_24" alt="비동의" />';
					if( me != k ) 
						$('.tradeItem[data-uid="'+k+'"]').find('span').append(img);
				});
			}
			
			dashBoardScroll();
		});
		
		socket.on('clickNotice', function(msg){
			$('.dashBoardText ul').append('<li><span style="color:green;">[Notice]</span> : '+decodeURIComponent(msg)+'</li>');
			showMessage(msg, true);
			dashBoardScroll();
		});
		
		socket.on('existsNickName', function(msg){
			$('.dashBoardText ul').append('<li><span style="color:red;">[Notice]</span> : '+msg+'</li>');
			showMessage(msg, false);
			dashBoardScroll();
		});
		
		socket.on('alreadyGame', function(){
			$('.tradeItem .width_24').remove();
			$('._layer_,._layerOveray_').remove();
		});
		
		socket.on('otherUserCheck', function(owner, gameNm){
			var intoText = '<h2><span class="gameText">'+decodeURIComponent(owner)+'</span> 님이 <span class="gameText">'+decodeURIComponent(gameNm)+'</span> 게임을 주최 하였습니다.</h2>';
				intoText += '<h2>참여 하시겠습니까? 5초 이내에 참가여부를 선택하세요.</h2>';
				intoText += '<p class="btnP"><button class="joinBtns defaultBtn" data-type="agree">참가</button><button class="joinBtns defaultBtn" data-type="disagree">거부</button></p>';
			layerNotice( intoText );
			layerCenter( 400, 150 );		
			
		});
		
		socket.on('joinAnswer', function(answer){
			var src = (answer.status == 'agree') ? '/img/green_c.png' : '/img/red_x.png';
			$('.tradeItem[data-uid="'+answer.uid+'"]').find('img').attr('src', src);
		});
		
		socket.on('checkResult', function(res){
			var resText = '<h2>총 '+res.totalCnt+' 명중 참여자는 '+res.agreeCnt+' 명 입니다.</h2>';
			if( parseInt(res.agreeCnt) > 1 ) {
				resText += '<h2>게임을 시작 하시겠습니까?</h2>';
				resText += '<p class="btnP"><button class="gameWating defaultBtn" data-type="start" data-game-type="'+res.gameCs+'">시작</button><button class="gameWating defaultBtn" data-type="cancel" data-game-type="'+res.gameCs+'">취소</button></p>';
			} else {
				resText += '<h2>동의 인원이 부족하여 주최를 종료합니다.</h2>';
				resText += '<p class="btnP"><button class="gameWating defaultBtn" data-type="cancel">닫기</button></p>';
				socket.emit('cancelGame');
			}
			layerNotice(resText);
			layerCenter( 400, 130 );			
		});
		
		socket.on('gameThrow', function(msg){
			showMessage(msg, true, '/img/red_p.png');
			$('.tradeItem img').remove();
			$('._layer_,._layerOveray_').remove();
		});
		
		socket.on('gameWating', function(msg){
			layerNotice('<h2>'+msg+'</h2>');
			layerCenter( 400, 40 );			
		});
		
		socket.on('gameStart', function(msg){
			layerNotice('<h2>'+msg+'</h2>');
			layerCenter( 400, 40 );				
		});
		
		socket.on('turnNotice', function(msg, uid){
			var turnText = "<h2>"+decodeURIComponent(msg)+"</h2>";
			if( uid == me ){ 
				turnText += '<p class="textP"><input type="text" class="sendNumberText noticeLayerDefaultText" /></p>';
				turnText += '<p class="btnP"><button class="sendNumberBtn defaultBtn" data-type="cancel">입력</button></p>';
			}
			
			layerNotice( turnText );
			layerCenter( 400, uid == me ? 140 : 60 );							
		});
		
		socket.on('noTurnNotice', function(msg){
			var noTurnText = '<h2 class="changeNunchiNum">'+decodeURIComponent(msg)+'</h2>';
				noTurnText += '<p class="textP"><input type="text" class="sendNunchiNumberText noticeLayerDefaultText" /></p>';
				noTurnText += '<p class="btnP"><button class="sendNunchiNumberBtn defaultBtn" data-type="cancel">입력</button></p>';
			
			layerNotice( noTurnText );
			layerCenter( 400, 140 );							
			
			$('.sendNunchiNumberText').focus();
		});
		
		socket.on('endGame', function(d){
			var turnText = '';
			
			switch(d.gameCs) {
				case 'callUpDownGame':
					turnText = '<h2><span class="gameText">'+decodeURIComponent(d.gameNm)+'</span> 게임의 승자는</h2>';
					turnText += '<h2><span class="gameText">'+decodeURIComponent(d.winNm)+'</span> 님 입니다. 축하 드립니다.</h2>';
					turnText += '<p class="btnP"><button class="winnerClose defaultBtn" data-type="cancel">닫기</button></p>';
					
				break;
				
				case 'callNunchiGame':
					turnText = '<h2><span class="gameText">'+decodeURIComponent(d.gameNm)+'</span> 게임의 패자는 <span class="gameText">'+decodeURIComponent(d.loseNm)+'</span> 님 입니다.</h2>';
					turnText += '<h2><span class="gameText">'+d.msg+'</span></h2>';
					turnText += '<p class="btnP"><button class="winnerClose defaultBtn" data-type="cancel">닫기</button></p>';
				break;
			}
			
			layerNotice( turnText );
			layerCenter( 400, 140 );			
			
			$('.tradeItem .width_24').remove();
		});
		
		socket.on('changeNunchiNumber', function(userNm, num){
			$('.changeNunchiNum').html( decodeURIComponent(userNm)+' 님이 [ '+num+' ] 를 입력 하셨습니다.' );
		});
		
		$(this).on('click', '.inputBtn', function(e){
			socket.emit('sendText', htmlspecialchars($('.inputText').val()));
			$('.inputText').val('').focus();
		});
		
		$(this).on('click', '.layerCloseBtn,.winnerClose', function(e){
			$('._layer_,._layerOveray_').remove();
		});
		
		$(this).on('click', '.tradeItem', function(e){
			var uId = $(this).data('uid');
			
			if( me == uId ) {
				var div = '<div class="_layer_">';
						div += '<div class="changeNickNameDiv">';
							div += '<h2>변경하실 닉네임을 입력하세요.</h2>';
							div += '<p class="textP"><input type="text" class="changeNickNameText" /></p>';
							div += '<p class="btnP"><button class="changeNickNameBtn changeNickNameRegBtn">변경</button><button class="changeNickNameBtn layerCloseBtn">닫기</button></p>';
						div += '</div>';
					div += '</div>';
				$('body').append(div);
				$('.changeNickNameText').focus();
				layerCenter( 300, 150 );
					
			} else {
				socket.emit('focusUser', uId);
			}
		});
		
		$(this).on('keypress', '.changeNickNameText', function(e){
			if( e.which == '13' ) 
				$('.changeNickNameBtn').trigger('click');
		});
		
		$(this).on('click', '.changeNickNameRegBtn', function(e){
			e.preventDefault();
			
			if( $('.changeNickNameText').val().replace(/\s*/g, '') == '' ) {
				alert('닉네임을 입력하세요.');
				$('.changeNickNameText').focus();
				return false;
			}
			
			socket.emit('changeNickName', htmlspecialchars($('.changeNickNameText').val()));
			$('.layerCloseBtn').trigger('click');
		});
		
		$(this).on('click', '.checkMsgSwap', function(e){
			$(this).fadeOut("slow", function(){
				$(this).remove();
			});
		});
		
		$(this).on('click', '.helpBtn', function(e){
			var div = '<div class="_layer_">';
					div += '<div class="helpDiv">';
						div += '<h2>도움말</h2>';
						div += '<p class="left"><span>* (본인) 박스를 누르면 닉네임을 변경 하실 수 있습니다.</span></p>';
						div += '<p class="left"><span>* 본인을 제외한 타인을 클릭하면 상대방에게 클릭했는지 알려줍니다.</span></p>';
						div += '<p class="btnP"><button class="layerCloseBtn">닫기</button></p>';
					div += '</div>';
				div += '</div>';
			$('body').append(div);			
			layerCenter( 400, 150 );
		});
		
		$(this).on('click', '.gameBtn', function(e){
			var div = '<div class="_layer_">';
					div += '<div class="gameChoiceDiv">';
						div += '<h2>게임리스트</h2>';
						div += '<div class="games" data-game-name="업다운" data-game-class="callUpDownGame" data-min-user="3" data-owner-join="off"><img src="/img/updownGameIcon.png" class="width_48" alt="업다운" /><h1>Up Down</h1></div>';
						div += '<div class="games" data-game-name="눈치" data-game-class="callNunchiGame" data-min-user="2" data-owner-join="on"><img src="/img/nunchiGameIcon.png" class="width_48" alt="눈치" /><h1>눈치게임</h1></div>';
						div += '<p class="btnP"><button class="layerCloseBtn">닫기</button></p>';
					div += '</div>';
				div += '</div>';
			$('body').append(div);			
			//layerCenter( 400, 200 );
			layerCenter( 171, 200 );
			
		});
		
		$(this).on('click', '.games', function(e){ 
			var _go = $(this);
			if( $('.tradeItem').length < parseInt(_go.data('min-user')) ) {
				alert('접속자가 '+_go.data('min-user')+'명 이상 있어야 가능합니다.');
				return false;
			} else {
				if( confirm('[ '+_go.data('game-name')+' ] 을 주최 하시겠습니까?\n※참여자가 없을경우 주최가 자동 취소 됩니다.') ) {
					layerNotice('<h2>다른 접속자에게 게임 참여여부를 체크중 입니다.</h2>');
					layerCenter( 400, 40 );
					
					$('.tradeItem .nickNm').append('<img src="/img/yellow_q.png" class="width_24" alt="체크중" />');
					$('.me .width_24').remove();
					socket.emit('userJoinCheck', { owner: me, gameNm: encodeURIComponent(_go.data('game-name')), gameCs: _go.data('game-class'), ownerJoin: _go.data('owner-join') } );
				} 
			}
		});
		
		$(this).on('click', '.joinBtns', function(e){
			joinCheck = true;
			var _a = $(this).data('type');
			socket.emit('userJoinType', { user: me, answer: _a } );
			if( _a == 'agree' ) {
				layerNotice('<h2>다른 접속자에게 게임 참여여부를 대기중 입니다.</h2>');
				layerCenter( 400, 40 );				
			} else {
				$('._layer_,._layerOveray_').remove();
			}
		});
		
		$(this).on('click', '.gameWating', function(e){
			var _o = $(this), gameSettingText = '';
			if( _o.data('type')  == 'cancel') {
				socket.emit('cancelGame', '주최자가 게임을 취소 하였습니다.');
				$('.tradeItem img').remove();
				$('._layer_,._layerOveray_').remove();
			} else {
				switch(_o.data('game-type')) {
					case 'callUpDownGame':
						gameSettingText = '<h2>1 부터 500 사이의 숫자를 입력하세요.</h2>';
						gameSettingText += '<p class="textP"><input type="text" class="upDownNumberText defaultTextP" /></p>';
						gameSettingText += '<p class="btnP"><button class="gameStart defaultBtn">설정</button></p>';
						socket.emit('settingGame', '주최자가 숫자를 설정중 입니다.');
						layerNotice(gameSettingText);
						layerCenter( 400, 140 );						
					break;
					
					case 'callNunchiGame':
						socket.emit('startGame');
					break;
					
					default:
						socket.emit('cancelGame', '잘못된 접근 입니다.');
					break;
				}
				
			}
		});
		
		$(this).on('keyup', '.upDownNumberText,.sendNumberText,.sendNunchiNumberText', function(e){
			$(this).val( $(this).val().replace(/[^\d]/g, '') );
		});
		
		$(this).on('keypress', '.sendNunchiNumberText', function(e){
			if( e.which == '13' ) 
				$('.sendNunchiNumberBtn').trigger('click');
			
		});
		
		$(this).on('click', '.gameStart', function(e){
			$('.upDownNumberText').val( $('.upDownNumberText').val().replace(/[^\d]/g, '') );
			var _num = parseInt($('.upDownNumberText').val());
			
			if( _num == '' ) {
				alert('숫자를 입력하세요.');
				$('.upDownNumberText').focus();
				return false;
			}
			
			if( _num<0 || _num>500 ) {
				alert('숫자 범위가 비정상 입니다.\n\n다시 입력 해주세요.');
				$('.upDownNumberText').focus();
				return false;
			}
			
			if( confirm('입력하신 '+$('.upDownNumberText').val()+' 로 설정 하시겠습니까?') ) 
				socket.emit('startGame', $('.upDownNumberText').val());
			
		});
		
		$(this).on('click', '.sendNumberBtn', function(){
			if( $('.sendNumberText').val() == "" ) {
				alert('숫자를 입력하세요.');
				$('.sendNumberText').focus();
				return false;
			}
			
			socket.emit('updownNumberSend', $('.sendNumberText').val());
		});
		
		$(this).on('click', '.sendNunchiNumberBtn', function(){
			if( $('.sendNunchiNumberText').val() == '' ) {
				alert('숫자를 입력하세요.');
				$('.sendNunchiNumberText').focus();
				return false;
			}
			
			socket.emit('sendNunchiNumber', $('.sendNunchiNumberText').val(), me);
			$('.sendNunchiNumberText').val('').focus();
		});
		
		/*pjax.connect({
			"container": "swap",
			"beforeSend": function(){
				
			},
			"complete": function(){
				
			}
		});*/	
	});
	
})( jQuery );