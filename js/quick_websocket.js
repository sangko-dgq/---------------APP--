//主要负责  ： QuickConnect的功能

var site = "ws://www.bigiot.net";
var port = "8383";
var ID = "20959";
var apikey = "6d2ac0601";

var userID = "U14887";
var arduinoID = "D21129";

var user_apiID = "U14887";  //贝壳微信小程序里登录userID,可以模拟Arduino向APP发送实时数据等。（用不同SIGN的Range可以快速模拟温湿度发送指令）

var url = site + ":" + port;
var json_login = ' {"M":"checkin","ID":"' + ID + '","K":"' + apikey + '"}';


var me_console = document.getElementById("me_console"); //调试窗
var cirle_state = document.getElementById("cirle_state"); //状态球
var closeConnection = document.getElementById("closeConnection"); //关闭连接按钮


//会自动在调用的时候，会刷新变量。就不能累次push追加了。所有应该放在全局作用域上
var Arr_TP_value = [];
var Arr_hum_value = [];
var Arr_CO2_value = [];
var Arr_dust_value = [];
// var Arr_fan_value = [];



//脚本监听
var btn_quickConnect = document.getElementById("btn_quickConnect");

btn_quickConnect.addEventListener("click", function() {
	mui.toast("Quick Connect.....");
	// 调用主模块
	ConnectAndLoginWebsocket(url);
});



/***********************************主模块封装***********************************/
function ConnectAndLoginWebsocket(url) {
	/*********连接ws**********************************************/
	var ws = new WebSocket(url);
	ws.onopen = function() {
		// console.log("Connected!");
		Check_ws_state(ws); //通信检测

	};

	ws.onmessage = function(evt) {
		/*********登录ws上创建的设备**********************************************/
		ws.send('{"M":"status"}');

		//如果连接成功
		if (evt.data = {
				"M": "connected"
			}) {
			// console.log("连接成功：" +  '{"M":"connected"}');
			ws.send(json_login);
			//如果登录成功
			if (evt.data = {
					"M": "checked"
				}) {
				SetCirleState_teal();
				HideC_ShowHome()

				/****************检测到登录成功后，连接数据模块***************************/
				Hand_fanSpeed_range(ws); // 手动滑块控制风机速度模块
				Hand_Or_Auto(ws); //风机手自动切换模块
				ShowTemp(ws);

			} else {
				SetCirleState_teal();
			}
		} else {
			SetCirleState_teal();
		}
	};

	//手动点击右上角icon关闭连接
	closeConnection.addEventListener("click", function() {
		ws.close();
		ws.onclose = function() {
			mui.toast("Break Connection!");
			SetCirleState_red();
			me_console.innerText = "Disconnected.....";
		}
		/*******检测到关闭连接后后，自动切换回connect页面*****/
		HideH_ShowConnect();
	});
}


/*************************************子模块封装*******************************************/

/**********************************UI动态模块封装*******************************************/
// setInterval(Check_broken_cirleState, 10000); //利用该函数可以反复执行,10s
function SetCirleState_red() //未连接或未登录，状态球变为红色
{
	// console.log("Nothing sent within 1min,Connection is Broken!"); 
	// me_console.innerText = "Nothing sent within 1min,Connection is Broken!";
	cirle_state.className = "ui red right floated header";
	closeConnection.className = "ui hidden content";
}

function SetCirleState_teal() //已连接且已登录，状态球变为绿茶色
{
	cirle_state.className = "ui teal right floated header";
	//显示关闭按钮
	closeConnection.className = "ui power off icon";
}

function HideC_ShowHome() {
	// 隐藏connect页面,显示Home页面
	var view01 = document.getElementById("view01");
	var view02 = document.getElementById("view02");
	view01.style.display = "none";
	view02.style.display = "block";

	//禁用Home按钮
	btn_home.className = " ui disable button";
	//开启connect按钮
	btn_connect.className = " ui positive button";

}

function HideH_ShowConnect() {
	// 显示connect页面,隐藏Home页面
	var view01 = document.getElementById("view01");
	var view02 = document.getElementById("view02");
	view01.style.display = "block";
	view02.style.display = "none";

	//开启Home按钮
	btn_home.className = " ui positive button";
	//禁用connect按钮
	btn_connect.className = " ui disable button";
}
/**********************************封装风机手动滑块调速模块****************************/
function Hand_fanSpeed_range(ws) {
	var fanSpeed_range = document.getElementById("fanSpeed_range");
	//滑动条滑动监听
	fanSpeed_range.addEventListener("touchmove", function() {
		//向ArduinoID发送动态滑块值
		//注意不能直接将该条放在监听外面，他会默认等于value的默认值
		var json_rangeToSend = '{"M":"say","ID":"' + arduinoID + '","C":"' + fanSpeed_range.value + '","SIGN":"fan_speed_hand_range"}';
		ws.send(json_rangeToSend);

		ws.onmessage = function(evt) {
			console.log(evt.data);
			//接收从服务端发来的消息监听
			me_console.innerText = evt.data;
		}

	});
}

/**********************************封装风机手自动切换模块***********************/
function Hand_Or_Auto(ws) {
	var btn_autoFan = document.getElementById("btn_autoFan");
	var range_lable = document.getElementById("range_lable");
	var json_rangeToSend;
	btn_autoFan.addEventListener("toggle", function(event) {
		if (event.detail.isActive) {
			mui.toast("Auto-fan is open!");
			//向ArduinoID发送"Auto-fan is open!"
			json_rangeToSend = '{"M":"say","ID":"' + arduinoID + '","C":"OpenAuto_fan!","SIGN":"fan_hand_auto"}';
			
			//隐藏手动Range
			range_lable.style.display = "none";
			
			
		} else {
			mui.toast("Auto-fan is close!");
			//向ArduinoID发送"Auto-fan is close!"
			json_rangeToSend = '{"M":"say","ID":"' + arduinoID + '","C":"CloseAuto_fan!","SIGN":"fan_hand_auto"}';
			
			//显示手动Range
			range_lable.style.display = "block";
			
		}

		if (json_rangeToSend) //如果不为空才发送，默认为空
		{
			ws.send(json_rangeToSend);
			console.log(json_rangeToSend);
		}
	});
}

//数据显示
/*********************************************封装温湿度显示模块 ******************************************************/
function ShowTemp(ws) {

	ws.onmessage = function(evt) {
		var obj = JSON.parse(evt.data); //解析
		me_console.innerText = evt.data;
		console.log(evt.data);

		if (obj.M == "say" && obj.ID == arduinoID) //由D21129（Arduino）发过来的say
		{
			switch (obj.SIGN) {
				case "hum":
					var Re_hum_value = parseFloat(obj.C); //转换为浮点number
		            Arr_hum_value.push(Re_hum_value);
					break;
			    case "temp":
				    var Re_TP_value = parseFloat(obj.C);
                    Arr_TP_value.push(Re_TP_value);
				default:
					break;
			}

			// if(obj.SIGN == "temp")
			// {
			// var Re_TP_value = parseFloat(obj.C); //转换为浮点number
			// console.log("温度:" + Re_TP_value);
			// }
			
		}
		
	   

		//满12个元素后便清空数组,以保证重新push
		if (Arr_TP_value.length >= 12) {
			Arr_TP_value.splice(0, Arr_TP_value.length);
		}
		
		
		// Temp+Hum
		creat_TempHum_echarts(Arr_TP_value,Arr_hum_value);	
	}
}

//Echarts
/*******************************************绘制温湿度Echarts模块**********************************************/
function creat_TempHum_echarts(Arr_TP_value,Arr_hum_value) {

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
			data: ['Temperature', 'Humidity']
		},
		grid: {
			top: 70,
			bottom: 50
		},
		xAxis: [{
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
						formatter: function(params) {
							return 'value  ' + params.value +
								(params.seriesData.length ? '：' + params.seriesData[0].data : '' + "°C");
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
						formatter: function(params) {
							return 'value  ' + params.value +
								(params.seriesData.length ? '：' + params.seriesData[0].data : '' + "%");
						}
					}
				},
				data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
			}
		],
		yAxis: [{
			type: 'value'
		}],
		series: [{
				name: 'Temperature',
				type: 'line',
				xAxisIndex: 1,
				smooth: true,
				emphasis: {
					focus: 'series'
				},
				data: Arr_TP_value    //温度数组
			},
			{
				name: 'Humidity',
				type: 'line',
				smooth: true,
				emphasis: {
					focus: 'series'
				},
				data: Arr_hum_value  //湿度数值
			}
		]
	};
	option && myChart.setOption(option);
}

/*******************************************绘制CO2浓度Echarts模块**********************************************/

function creat_co2_echarts(Arr_CO2_value) {

	// 传入数组并配置index中Temp Echarts,来动态绘制温度变化图

	var chartDom = document.getElementById('CO2_DOM');
	var myChart = echarts.init(chartDom, 'dark');
	var option;

	var colors = ['#ffaaff'];

	option = {
		color: colors,
		tooltip: {
			trigger: 'none',
			axisPointer: {
				type: 'cross'
			}
		},
		legend: {
			data: ['CO2']
		},
		grid: {
			top: 70,
			bottom: 50
		},
		xAxis: [{
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
						formatter: function(params) {
							return 'value  ' + params.value +
								(params.seriesData.length ? '：' + params.seriesData[0].data : '' + "°C");
						}
					}
				},
				data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
			}],
		yAxis: [{
			type: 'value'
		}],
		series: [{
				name: 'CO2',
				type: 'line',
				xAxisIndex: 1,
				smooth: true,
				emphasis: {
					focus: 'series'
				},
				data: Arr_CO2_value    //温度数组
			}]
	};
	option && myChart.setOption(option);
}
/*******************************************绘制灰尘浓度Echarts模块**********************************************/
function creat_dust_echarts(Arr_dust_value) {

	// 传入数组并配置index中Temp Echarts,来动态绘制温度变化图

	var chartDom = document.getElementById('dust_DOM');
	var myChart = echarts.init(chartDom, 'dark');
	var option;

	var colors = ['#55007f'];

	option = {
		color: colors,
		tooltip: {
			trigger: 'none',
			axisPointer: {
				type: 'cross'
			}
		},
		legend: {
			data: ['Dust']
		},
		grid: {
			top: 70,
			bottom: 50
		},
		xAxis: [{
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
						formatter: function(params) {
							return 'value  ' + params.value +
								(params.seriesData.length ? '：' + params.seriesData[0].data : '' + "m2");
						}
					}
				},
				data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
			}],
		yAxis: [{
			type: 'value'
		}],
		series: [{
				name: 'Dust',
				type: 'line',
				xAxisIndex: 1,
				smooth: true,
				emphasis: {
					focus: 'series'
				},
				data: Arr_CO2_value    //温度数组
			}]
	};
	option && myChart.setOption(option);
}

/*******************************************绘制fan speed监听Echarts模块**********************************************/
