//主要负责  ： QuickConnect的功能

var site = "ws://www.bigiot.net";
var port = "8383";
var ID = "20959";
var apikey = "6d2ac0601";

var userID = "U14887";

var url = site + ":" + port;
var json_login =' {"M":"checkin","ID":"'+ ID +'","K":"'+ apikey +'"}';


var me_console = document.getElementById("me_console");//调试窗
var cirle_state = document.getElementById("cirle_state"); //状态球

//脚本监听
var btn_quickConnect = document.getElementById("btn_quickConnect");
btn_quickConnect.addEventListener("click", function() {
	mui.toast("Quick Connect.....");
		
	console.log("服务器地址为：" + url);	
	
	// 1. Connect+Login
	ConnectAndLoginWebsocket(url);
});

//create websocket
function ConnectAndLoginWebsocket(url) 
{
	var ws = new WebSocket(url);

	
	ws.onopen = function() 
	{
		// console.log("Connected!");
		me_console.innerText = "Connected!";
	    Check_ws_state(ws);//通信检测
	};
	
	//收到消息，说明连接成功
	ws.onmessage = function(evt)
	{
		var received_msg = evt.data;
		console.log(received_msg);
		me_console.innerText = received_msg;
			
		//发送json登录指令
		//{"M":"checkin","ID":"xx1","K":"xx2"}	
		console.log(json_login);
		ws.send(json_login);

		
		//SEND MESSAGE
		
		//{"M":"say","ID":"xx1","C":"xx2","SIGN":"xx3"}	
		var fanSpeed_range = document.getElementById("fanSpeed_range");
		//滑动条滑动监听
		fanSpeed_range.addEventListener("touchmove", function()
		{
			//注意不能直接将该条放在监听外面，他会默认等于value的默认值
			var json_rangeToSend = '{"M":"say","ID":"'+userID+'","C":"'+fanSpeed_range.value+'","SIGN":"xx3"}';
			ws.send(json_rangeToSend);
		});	
	};
	
	//如果收到返回登录消息，说明登录登录成功
	//将状态圆变成绿色
	if(me_console.innerText !=' {"M":"WELCOME TO BIGIOT"}' && me_console.innerText != '{"M":"ping"}')
	{
		// console.log("All is done!"); 
		//修改cirle_state的样式类名为green
		cirle_state.className = "ui teal right floated header";
	}
	
	//连接手动关闭时，自动调用（注意：1min无send这种,自动关闭不会调用）
		ws.onclose = function()
		{
			// SetCirleState_red();
			console.log("Nothing sent within 1min,Connection is Broken!");
		};
}



//2, 由于函数只会调用一次，所以单独把断线状态球恢复为red方法写在点击时间的外面
//设备登录后，如果在1分钟内无数据传送，连接将被自动关闭。状态球恢复为红色状态
	 // setInterval(Check_broken_cirleState, 10000); //利用该函数可以反复执行,10s
	 function SetCirleState_red()
	 {
			// console.log("Nothing sent within 1min,Connection is Broken!"); 
			me_console.innerText = "Nothing sent within 1min,Connection is Broken!";
			cirle_state.className = "ui red right floated header";
	 }
	 
	 // 函数封装模块： 通信状态实时检测（不包含登录检测）
	 function Check_ws_state(ws)
	 {
	 	var ws_state = ws.readyState;
	 	switch (ws_state) {
	 		case 0:
	 			console.log("ws state: disconnected!");
	 			break;
	 		case 1:
	 			console.log("ws state: connected! Please Login Or json!");
	 			break;
	 		case 2:
	 			console.log("ws state: ws is ing closing!");
	 			break;
	 		case 3:
	 			console.log("ws state: ws closed!");
	 			break;
	 		default:
	 			break;
	 	}
	 }