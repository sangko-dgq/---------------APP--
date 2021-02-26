//主要负责  ： QuickConnect的功能

var site = "ws://www.bigiot.net";
var port = "8383";
var ID = "20959";
var apikey = "6d2ac0601";

var userID = "U14887";
var arduinoID = "D21129";

var url = site + ":" + port;
var json_login =' {"M":"checkin","ID":"'+ ID +'","K":"'+ apikey +'"}';


var me_console = document.getElementById("me_console");//调试窗
var cirle_state = document.getElementById("cirle_state"); //状态球
var closeConnection  = document.getElementById("closeConnection"); //关闭连接按钮


//会自动在调用的时候，会刷新变量。就不能累次push追加了。所有应该放在全局作用域上
var Re_TP_value;
var Arr_TP_value = [];

		
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
	    Check_ws_state(ws);//通信检测
		
	};
	//收到连接成功的json回复消息，说明连接成功
	ws.onmessage = function(evt)
	{
		var received_msg = evt.data;
		
		//接收数据
		var obj = JSON.parse(received_msg);
		me_console.innerText = received_msg;
		console.log(received_msg);
		var obj = JSON.parse(received_msg);
		
		/**************************************接收温度接口的数据*********************************/
		//U14887为sangko(web),这里以后应设置应限制为温度接口相关条件
		if(obj.M == "say"  && obj.ID == "U14887")
		{
			Re_TP_value = parseFloat(obj.C); //转换为浮点number
			console.log(Re_TP_value);
			
			TP_value = Re_TP_value;
			
			//通过风机滑块监听测试温度数值是否实时传入
			// fanSpeed_range.value = Re_TP_value;
			// fanSpeed_text.innerText =  Re_TP_value;		
		}
		
/******************************************************************************/
/*********登录ws上创建的设备**********************************************/
		//发送json查询状态(在服务器返回结果中：connected代表已连接服务器尚未登录，checked代表已连接且登录成功)
		ws.send('{"M":"status"}');
		
		//如果连接成功
		if(received_msg = {"M":"connected"})
		{
			// console.log("连接成功：" +  '{"M":"connected"}');
			ws.send(json_login);
			//如果登录成功
			if(received_msg = {"M":"checked"})
			{
				console.log("登录成功");
				SetCirleState_teal();
/*****************************检测到登录成功后，自动切换页面***************************/
                    // 隐藏connect页面,显示Home页面
					var view01 = document.getElementById("view01");
					var view02 = document.getElementById("view02");
					view01.style.display = "none";
					view02.style.display = "block";
                    
					//禁用Home按钮
					btn_home.className = " ui disable button";
					//开启connect按钮
					btn_connect.className = " ui positive button";

/************************************************************************************/

/************************Test（登录成功才能发送到设备，否则无效代码）*****************************/
		    // Test_send_to_Temp_Interface(ws);
		/*********************************************************/



/*****************************弹出确认欢迎框***************************/
				     // mui.alert(ID, "welcome!" );
/*********************************************************************/
/*****************************检测到登录成功后，连接数据模块***************************/
                Hand_fanSpeed_range(ws); // 手动滑块控制风机速度模块
				Hand_Or_Auto(ws); //风机手自动切换模块
				
				ShowTemp(Re_TP_value);
				
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
		/*****************************检测到关闭连接后后，自动切换回connect页面***************************/
		// 显示connect页面,隐藏Home页面
		var view01 = document.getElementById("view01");
		var view02 = document.getElementById("view02");
		view01.style.display = "block";
		view02.style.display = "none";
		
		//开启Home按钮
		btn_home.className = " ui positive button";
		//禁用connect按钮
		btn_connect.className = " ui disable button";
	});
}


/*************************************子模块封装*******************************************/

/**********************************网络状态检测模块封装**************************************/
	 // 通信连接状态实时检测（不包含登录检测）
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
	 
 /**********************************封装风机手动滑块调速模块*******************************************/
     function Hand_fanSpeed_range(ws)
	 {
		 var fanSpeed_range = document.getElementById("fanSpeed_range");
		 //滑动条滑动监听
		 fanSpeed_range.addEventListener("touchmove", function()
		 {
			 //向ArduinoID发送动态滑块值
		 	//注意不能直接将该条放在监听外面，他会默认等于value的默认值
		 	var json_rangeToSend = '{"M":"say","ID":"'+arduinoID+'","C":"'+fanSpeed_range.value+'","SIGN":"xx3"}';
		 	ws.send(json_rangeToSend);
			
			ws.onmessage = function(evt){
				console.log(evt.data);
				//接收从服务端发来的消息监听
				me_console.innerText = evt.data;
			}
			
		 });	
	 }
	 
	/**********************************封装风机手自动切换模块*******************************************/
	function Hand_Or_Auto(ws)
	{
		var btn_autoFan = document.getElementById("btn_autoFan");
		var json_rangeToSend;
		btn_autoFan.addEventListener("toggle", function(event) {
			if (event.detail.isActive) {
				mui.toast("Auto-fan is open!");
				//向ArduinoID发送"Auto-fan is open!"
				 json_rangeToSend = '{"M":"say","ID":"'+arduinoID+'","C":"OpenAuto_fan!","SIGN":"xx3"}';
			} else {
				mui.toast("Auto-fan is close!");
				//向ArduinoID发送"Auto-fan is close!"
				json_rangeToSend = '{"M":"say","ID":"'+arduinoID+'","C":"CloseAuto_fan!","SIGN":"xx3"}';
			}
			if(json_rangeToSend) //如果不为空才发送，默认为空
			{
				ws.send(json_rangeToSend);
				console.log(json_rangeToSend);
			}
		})
		
	}
	
	/*********************************************封装温度模块 ********************************************/
	function ShowTemp(Re_TP_value)
	{
		console.log("Realtime Temperture" + Re_TP_value); 
		//创建温度数组 
		/*********************************************************/
		//第一次push得到的数组，给第二次push。。。，循环12次，从头再来
		//注意追加后arr2 为number 新数组的长度，而arr1变成了新数组。我们应使用arr1
		// console.log(arr2);// 4
			if(Re_TP_value) //如果不为空 即有服务器数value更新
			{
				
				//会自动在调用的时候，会刷新变量。就不能累次push追加了。所有应该放在全局作用域上
				// var Arr_TP_value = [];
				// var arr_m = [];
				
				Arr_TP_value.push(Re_TP_value);
				console.log(Arr_TP_value);
				// console.log(typeof(Re_TP_value));
				// console.log(typeof(Arr_TP_value));	
			}
			//满12个元素后便清空数组,以保证重新push
			if(Arr_TP_value.length >= 12)
			{
				Arr_TP_value.splice(0,Arr_TP_value.length);//满12个元素后便清空数组
			}
			/*********************************************************/
		
		// 传入数组并配置index中Temp Echarts,来动态绘制温度变化图
		
		var chartDom = document.getElementById('temp_DOM');
		var myChart = echarts.init(chartDom, 'dark');
		var option;
		
		var colors = ['#5470C6', '#EE6666'];
		
		option = {
		    color: colors,
		    tooltip: {
		        trigger: 'none',
		        axisPointer: {
		            type: 'cross'
		        }
		    },
		    legend: {
		        data:['Temperature', 'Humidity']
		    },
		    grid: {
		        top: 70,
		        bottom: 50
		    },
		    xAxis: [
		        {
		            type: 'category',
		            axisTick: {
		                alignWithLabel: true
		            },
		            axisLine: {
		                onZero: false,
		                lineStyle: {
		                    color: colors[1]
		                }
		            },
		            axisPointer: {
		                label: {
		                    formatter: function (params) {
		                        return 'value  ' + params.value
		                            + (params.seriesData.length ? '：' + params.seriesData[0].data : '');
		                    }
		                }
		            },
		            data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
		        },
		        {
		            type: 'category',
		            axisTick: {
		                alignWithLabel: true
		            },
		            axisLine: {
		                onZero: false,
		                lineStyle: {
		                    color: colors[0]
		                }
		            },
		            axisPointer: {
		                label: {
		                    formatter: function (params) {
		                        return 'value  ' + params.value
		                            + (params.seriesData.length ? '：' + params.seriesData[0].data : '');
		                    }
		                }
		            },
		            data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
		        }
		    ],
		    yAxis: [
		        {
		            type: 'value'
		        }
		    ],
		    series: [
		        {
		            name: 'Temperature',
		            type: 'line',
		            xAxisIndex: 1,
		            smooth: true,
		            emphasis: {
		                focus: 'series'
		            },
		            data: Arr_TP_value
		        },
		        {
		            name: 'Humidity',
		            type: 'line',
		            smooth: true,
		            emphasis: {
		                focus: 'series'
		            },
		            data: [3.9, 5.9, 11.1, 18.7, 48.3, 69.2, 231.6, 46.6, 55.4, 18.4, 10.3, 0.7]
		        }
		    ]
		};
		
		option && myChart.setOption(option);

		
	}
	/******************************************************************************************************/							
	
	
	/********************************************测试模拟模块**************************************************/
	//1  模拟温度传感器向 服务器UID的设备下的温度接口发送数据
	    // {"M":"update","ID":"xx1","V":{"id1":"value1",...}}   虚拟设备ID下面的接口id
		
		//ID = 20959; 温度id1 = 19017
	// 	var id_temp = "19017";
	// function Test_send_to_Temp_Interface(ws)
	// {
	// 	// ws.send(' {"M":"update","ID":'+ ID +',"V":{' + id1 + ':"23"}} ');
	// 	ws.send(' {"M":"update","ID":'+ ID +',"V":{' +id_temp+':'+ Re_TP_value +'}} ');
	// 	console.log("向接口发送温度");
	// 	var json2 = '{' +id_temp+':'+ Re_TP_value +'}';
		
	// 	console.log(' {"M":"update","ID":'+ ID +',"V": '+ json2+'} ');
		
	// 	ws.send(' {"M":"update","ID":'+ ID +',"V":{"19017":'+ Re_TP_value +'}} ');
	// 	console.log("向接口发送温度");
		
	// }
		
		
	
	/********************************************************************************************************/