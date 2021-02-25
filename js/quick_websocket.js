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
var closeConnection  = document.getElementById("closeConnection"); //关闭连接按钮

//脚本监听
var btn_quickConnect = document.getElementById("btn_quickConnect");
btn_quickConnect.addEventListener("click", function() {
	mui.toast("Quick Connect.....");
		
	console.log("服务器地址为：" + url);	
	console.log("登录json为:" + json_login);
	
	// 调用主模块
	ConnectAndLoginWebsocket(url);
});




/***********************************主模块封装***********************************/
function ConnectAndLoginWebsocket(url) 
{
/*********连接ws**********************************************/
	var ws = new WebSocket(url);
	ws.onopen = function() 
	{
		// console.log("Connected!");
		me_console.innerText = "Connected!";
	    Check_ws_state(ws);//通信检测
		
	};
	//收到连接成功的json回复消息，说明连接成功
	ws.onmessage = function(evt)
	{
		var received_msg = evt.data;
		me_console.innerText = received_msg;
		console.log(received_msg);
/*********登录ws上创建的设备**********************************************/
		//发送json查询状态(在服务器返回结果中：connected代表已连接服务器尚未登录，checked代表已连接且登录成功)
		ws.send('{"M":"status"}');
		
		//如果连接成功
		if(received_msg = {"M":"connected"})
		{
			console.log("连接成功：" +  '{"M":"connected"}');
			ws.send(json_login);
			//如果登录成功
			if(received_msg = {"M":"checked"})
			{
				console.log("登录成功:"+  '{"M":"checked"}');
				SetCirleState_teal();
				
/*****************************检测到登录成功后，连接数据模块***************************/
                Hand_fanSpeed_range(ws); // 手动滑块控制风机速度模块
				
			}else
			{
				SetCirleState_teal();
			}
		}else
		{
			SetCirleState_teal();
		}
	};
	
	//手动点击右上角icon关闭连接
	closeConnection.addEventListener("click",function()
	{
		ws.close();
		ws.onclose = function()
		{
			mui.toast("Break Connection!");
			SetCirleState_red();
			me_console.innerText = "Disconnected.....";
		}
	});
}


/*************************************子模块封装*******************************************/

/**********************************网络状态检测模块封装**************************************/
	 // 通信状态实时检测（不包含登录检测）
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
				SetCirleState_red();
	 			break;
	 		default:
	 			break;
	 	}
	 }
	 
    
/**********************************UI动态模块封装*******************************************/
	 // setInterval(Check_broken_cirleState, 10000); //利用该函数可以反复执行,10s
	 function SetCirleState_red()    //未连接或未登录，状态球变为红色
	 {
			// console.log("Nothing sent within 1min,Connection is Broken!"); 
			// me_console.innerText = "Nothing sent within 1min,Connection is Broken!";
			cirle_state.className = "ui red right floated header";
			closeConnection.className = "ui hidden content";
	 }
	 function SetCirleState_teal()   //已连接且已登录，状态球变为绿茶色
	 {
		 cirle_state.className = "ui teal right floated header";
		 //显示关闭按钮
		 closeConnection.className = "ui power off icon";
	 }
	 
 /**********************************数据模块封装*******************************************/
	 //------------风机滑块手动调速模块
     function Hand_fanSpeed_range(ws)
	 {
		 var fanSpeed_range = document.getElementById("fanSpeed_range");
		 //滑动条滑动监听
		 fanSpeed_range.addEventListener("touchmove", function()
		 {
		 	//注意不能直接将该条放在监听外面，他会默认等于value的默认值
		 	var json_rangeToSend = '{"M":"say","ID":"'+userID+'","C":"'+fanSpeed_range.value+'","SIGN":"xx3"}';
		 	ws.send(json_rangeToSend);
		 });	
	 }
	 
	