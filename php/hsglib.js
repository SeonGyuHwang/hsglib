var express = require('express'),
	fs = require('fs'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io')(server),
	conn = null,
	params = null,
	clients = {},
	owner = null,
	turnOrd = 0,
	gameInfo = {},
	numberArr = [],
	nunchiUserObj = {},
	joinUsers = {};
	
server.listen(50);

app.use("/js", express.static( __dirname+'/js '));
app.use("/css", express.static( __dirname+'/css' ));
app.use("/img", express.static( __dirname+'/img' ));

app.get(/.*/, function(req, res){
	res.sendfile( __dirname+'/index.html' );
});

function gameReset() {
	owner = null;
	turnOrd = 0;
	joinUsers = {};
	gameInfo = {};			
	numberArr = [];	
	nunchiUserObj = {};
};

function createRandomId(){ 
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = Math.floor(Math.random() * 10) + 2;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}

	return randomstring;
};

io.on('connection', function(socket){
	
	socket.on('addClient', function(userNm){
		/*socket.userNm = ( userNm == '' || userNm == null || typeof userNm == undefined || userNm == 'undefined' ) ? 'Anonymous' : userNm;
		clients[socket.id] = ( userNm == '' || userNm == null || typeof userNm == undefined || userNm == 'undefined' ) ? 'Anonymous' : userNm;*/
		var getRandUserNm = createRandomId();
		socket.userNm = getRandUserNm;
		clients[socket.id] = getRandUserNm;
		
		io.sockets.emit('updateClient', clients, joinUsers);
		
		socket.emit('addDashboad', '<span style="color:blue;">[Notice]</span>', '<span style="color:blue;">'+encodeURIComponent('현재 익명 닉네임으로 설정 되어 있습니다.')+'</span>', socket.id);
		socket.emit('addDashboad', '<span style="color:blue;">[Notice]</span>', '<span style="color:blue;">'+encodeURIComponent('아래 본인 빨간 박스를 클릭하여 닉네임을 변경 하세요.')+'</span>');
		socket.emit('addDashboad', '<span style="color:blue;">[Notice]</span>', '<span style="color:red;">'+encodeURIComponent('어떠한 데이터도 DB에 저장되지 않습니다.')+'</span>');
		
		socket.broadcast.emit('addDashboad', '<span style="color:blue;">[Notice]</span>', socket.userNm+' has <span style="color:blue;">connected</span>');
		
	});
	
	socket.on('disconnect', function(){
		delete clients[socket.id];
		
		if( socket.userNm != null ) 
			socket.broadcast.emit('addDashboad', '<span style="color:red;">[Notice]</span>', socket.userNm+' has <span style="color:red;">disconnected</span>');
		
		if( owner != null && owner == socket.id ) {
			for(var i in joinUsers) 
				if( joinUsers[i] == 'agree' ) io.to(i).emit( 'gameThrow', '주최자가 접속을 종료하여 게임이 취소 되었습니다.' );
			
			gameReset();
		}
		
		if( Object.keys(joinUsers).indexOf(socket.id) != -1 ) {
			if( Object.keys(joinUsers)[turnOrd] == socket.id && gameInfo.gameCs == 'callUpDownGame' ) {
				turnOrd++;
				if( turnOrd >= (parseInt(Object.keys(joinUsers).length)-1) ) turnOrd = 0; 
				
				io.to(owner).emit( 'turnNotice', '참여자가 접속을 종료하여 '+clients[Object.keys(joinUsers)[turnOrd]]+' 님에게 순서가 넘어 갔습니다.', Object.keys(joinUsers)[turnOrd] );		
				for(var i in joinUsers) 
					io.to(i).emit( 'turnNotice', '참여자가 접속을 종료하여 '+clients[Object.keys(joinUsers)[turnOrd]]+' 님에게 순서가 넘어 갔습니다.', Object.keys(joinUsers)[turnOrd] );						
			}
			
			if( Object.keys(joinUsers).length > 0 && gameInfo.gameCs == 'callNunchiGame' ) {
				if( parseInt(numberArr[numberArr.length-1]) >= (parseInt(Object.keys(joinUsers).length)-1) ) {
					var noInputUser = [];
					for(var i in joinUsers) 
						if( Object.keys(nunchiUserObj).indexOf(i) == -1 ) noInputUser.push(clients[i]);
					
					for(var i in joinUsers) 
						io.to(i).emit( 'endGame', { loseNm: noInputUser.join(', '), gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs, msg: '숫자를 입력 하지 않으셨습니다.' } );
					
					gameReset();							
				}
			}
			
				
			delete joinUsers[socket.id];
			if( Object.keys(joinUsers).length < 2 ) {
				io.to(owner).emit( 'gameThrow', '게임 진행의 최소 인원 부족으로 게임이 취소 되었습니다.' );
				for(var i in joinUsers) 
					if( joinUsers[i] != 'disagree' ) io.to(i).emit( 'gameThrow', '게임 진행의 최소 인원 부족으로 게임이 취소 되었습니다.' );			
				
				gameReset();
			}
		}
		
		
		io.sockets.emit('updateClient', clients, joinUsers);
		
	});	
	
	socket.on('sendText', function(text){
		io.sockets.emit('addDashboad', socket.userNm, text);
	});
	
	socket.on('focusUser', function(id){
		var targetNm = clients[id];
		if(typeof targetNm != undefined && socket.id != id ) 
			io.to(id).emit( 'clickNotice', socket.userNm+' 님이 당신을 클릭 했습니다.' );
	});
	
	socket.on('changeNickName', function(nickname){
		var nickExists = false;
		var beforeNickName = socket.userNm;
		
		for(var id in clients) 
			if( clients[id] == encodeURIComponent(nickname) ) nickExists = true;
		
		if( !nickExists ) {
			socket.userNm = encodeURIComponent(nickname);
			clients[socket.id] = encodeURIComponent(nickname);
			
			io.sockets.emit('updateClient', clients, joinUsers);
			io.sockets.emit('addDashboad', '<span style="color:blue;">[Notice]</span>', '<span style="color:blue;">'+beforeNickName+' -> '+socket.userNm+'</span> 으로 닉네임이 변경 되었습니다.');
		} else {
			socket.emit('existsNickName', '입력하신 <span style="color:red;">'+nickname+'</span> 은(는) 이미 존재하는 닉네임 입니다.');
		}
	});
	
	socket.on('userJoinCheck', function(games){
		if( owner != null ) {
			socket.emit('addDashboad', '<span style="color:red;">[Notice]</span>', clients[owner]+' 님이 <span style="color:red;">'+gameInfo.gameNm+'</span> 게임을 추죄중 입니다.');
			socket.emit('alreadyGame');
		} else{
			gameReset();
			
			owner = games.owner;
			gameInfo = games;
			for(var i in clients) 
				joinUsers[i] = socket.id == i ? 'owner' : 'check';
			
			socket.broadcast.emit('otherUserCheck', socket.userNm, gameInfo.gameNm);
			
			setTimeout(function(){
				var res = { totalCnt: 0, agreeCnt: 0, disagreeCnt: 0, gameCs: gameInfo.gameCs };
				for(var i in joinUsers) {
					if( joinUsers[i] != 'owner' ) res.totalCnt++;
					if( joinUsers[i] == 'owner' ) {
						if( gameInfo.ownerJoin == 'on' ) {
							res.totalCnt++;
							res.agreeCnt++;
						} else {
							delete joinUsers[i];
						}
					}
					
					if( joinUsers[i] == 'agree' ) res.agreeCnt++;
					if( joinUsers[i] == 'disagree' ) res.disagreeCnt++;
					
					if( joinUsers[i] == 'check' ){ 
						res.disagreeCnt++;
						joinUsers[i] = 'disagree';
						io.to(owner).emit( 'joinAnswer', { uid: i, status: 'disagree' } );
						io.to(i).emit( 'gameThrow', '5초 이내 응답하지 않아 자동 취소 되었습니다.' );
					}
				}
				
				gameInfo.totalAgree = res.agreeCnt;
				io.to(owner).emit( 'checkResult', res );
			}, 5000);
		}
	});
	
	socket.on('userJoinType', function(users){
		joinUsers[users.user] = users.answer;
		io.to(owner).emit( 'joinAnswer', { uid: users.user, status: users.answer } );
	});
	
	socket.on('cancelGame', function(msg){
		var cancelText = '게임이 취소 되었습니다.';
		if( msg ) cancelText = msg;
		
		for(var i in joinUsers) 
			if( joinUsers[i] != 'owner' ) io.to(i).emit( 'gameThrow', cancelText );
		
		gameReset();
	});
	
	socket.on('settingGame', function(msg){
		for(var i in joinUsers) {
			if( joinUsers[i] == 'disagree' ) delete joinUsers[i];			
			if( joinUsers[i] == 'agree' ) io.to(i).emit( 'gameWating', msg );		
		}
	});
	
	socket.on('startGame', function(num){
		switch(gameInfo.gameCs) {
			case 'callUpDownGame' : 
				gameInfo.number = num;
				
				for(var i in joinUsers) 
					if( joinUsers[i] != 'owner' ) io.to(i).emit( 'gameStart', '주최자가 숫자를 설정 하였습니다. <span class="secSpan">3</span>초 후 시작됩니다.' );
				
				io.to(owner).emit( 'turnNotice', '첫번째 순서는 '+clients[Object.keys(joinUsers)[turnOrd]]+' 님 입니다.' );
				setTimeout(function(){ 
					for(var i in joinUsers) 
						if( joinUsers[i] != 'owner' ) io.to(i).emit( 'turnNotice', clients[Object.keys(joinUsers)[turnOrd]]+' 님 순서 입니다.', Object.keys(joinUsers)[turnOrd] );
				}, 3000);
			break;
			
			case 'callNunchiGame' :
				for(var i in joinUsers) {
					if( joinUsers[i] == 'disagree' ) 
						delete joinUsers[i];
					else 
						io.to(i).emit( 'gameStart', '눈치게임이 <span class="secSpan">3</span>초 후 시작됩니다.' );		
				}
				
				setTimeout(function(){ 
					for(var i in joinUsers) 
						io.to(i).emit( 'noTurnNotice', '' );
				}, 3000);
			break;
		}
	});
	
	socket.on('updownNumberSend', function(num){ 
		
		if( parseInt(num) == parseInt(gameInfo.number) ){ 
			io.to(owner).emit( 'endGame', { winNm: clients[Object.keys(joinUsers)[turnOrd]], gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs } );
			io.sockets.emit('addDashboad', '<span style="color:blue;">[Notice]</span>', '<span style="color:blue;">'+clients[owner]+'</span> 님이 주최하신 <span style="color:blue;">'+gameInfo.gameNm+'</span> 게임에서 <span style="color:blue;">'+clients[Object.keys(joinUsers)[turnOrd]]+'</span> 님이 승리 하셨습니다.');
			for(var i in joinUsers) 
				io.to(i).emit( 'endGame', { winNm: clients[Object.keys(joinUsers)[turnOrd]], gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs } );		
			
			gameReset();
		} else { 
			var UpDown = parseInt(num) > parseInt(gameInfo.number) ? 'Down' : 'Up';
			var beforeUser = clients[Object.keys(joinUsers)[turnOrd]];
			
			turnOrd++;
			if( turnOrd >= parseInt(Object.keys(joinUsers).length) ) turnOrd = 0; 
			
			io.to(owner).emit( 'turnNotice', beforeUser+' 님이 입력하신 '+num+' 보다 '+UpDown+' 입니다.', Object.keys(joinUsers)[turnOrd] );		
			for(var i in joinUsers) 
				io.to(i).emit( 'turnNotice', beforeUser+' 님이 입력하신 '+num+' 보다 '+UpDown+' 입니다.', Object.keys(joinUsers)[turnOrd] );		
			
		}
		
	});
	
	socket.on('sendNunchiNumber', function(num, user){
		var inNumber = parseInt(num), throwCheck = false;
		var nextNumber = numberArr[numberArr.length-1];
		
		if( numberArr.indexOf(num) != -1 ) {
			for(var i in joinUsers) 
				io.to(i).emit( 'endGame', { loseNm: clients[user], gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs, msg: '중복되는 숫자를 입력 하셨습니다.' } );		
			
			gameReset();				
			throwCheck = true;
		} 
		
		if( numberArr.length == '0' && num != '1' ) {
			for(var i in joinUsers) 
				io.to(i).emit( 'endGame', { loseNm: clients[user], gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs, msg: '1 부터 시작 하지 않았습니다.' } );		
			
			gameReset();		
			throwCheck = true;
		}
		
		if( numberArr.length != '0' && parseInt(num) != (parseInt(nextNumber)+1) ) {
			for(var i in joinUsers) 
				io.to(i).emit( 'endGame', { loseNm: clients[user], gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs, msg: '다음 숫자를 입력 하지 않으셨습니다.' } );		
			
			gameReset();					
			throwCheck = true;
		}
		
		numberArr.push(num);
		nunchiUserObj[user] = num;		
		
		if( numberArr.length != '0' && inNumber >= (parseInt(Object.keys(joinUsers).length)-1) ) {
			var noInputUser = [];
			for(var i in joinUsers) 
				if( Object.keys(nunchiUserObj).indexOf(i) == -1 ) noInputUser.push(clients[i]);
			
			for(var i in joinUsers) 
				io.to(i).emit( 'endGame', { loseNm: noInputUser.join(', '), gameNm: gameInfo.gameNm, gameCs: gameInfo.gameCs, msg: '숫자를 입력 하지 않으셨습니다.' } );
			
			gameReset();			
			throwCheck = true;
		}		
		
		if( !throwCheck ) {
			for(var i in joinUsers) 
				io.to(i).emit( 'changeNunchiNumber', clients[user], num );		
		}
					
	});
	
});


