
function Swipe(obj){
	this.id = obj.id;
	this.cas = document.getElementById(this.id);
	this.context = this.cas.getContext("2d");
	this._w = obj._w;
	this._h = obj._h;
	this.radius = obj.radius;
	this.posX = 0; //保存鼠标点击时的x坐标
	this.posY = 0; //保存鼠标点击时的y坐标
	this.isMouseDown = false; //鼠标状态，没按下为false，按下为true
	this.coverType = obj.coverType;
	this.mask = obj.mask;
	this.percent = obj.percent;
	this.callback = obj.callback; // 用户自定义的函数名
	// 先调用初始化
	this.init();
	this.addEvent();
}
// 设置canvas的图像组合方式，并填充指定的颜色
Swipe.prototype.init = function(){
	// 如果coverType是颜色
	if( this.coverType === "color" ){
		this.context.fillStyle = this.mask;
		this.context.fillRect(0,0,this._w,this._h);
		this.context.globalCompositeOperation = "destination-out";
	}
	// 如果coverType是图片
	if( this.coverType === "img" ){
		var that = this;
		var image = new Image();
		image.src = this.mask;
		image.onload = function(){
			that.context.drawImage(this,0,0,this.width,this.height,0,0,that._w,that._h);
			that.context.globalCompositeOperation = "destination-out";
		};
	}
};
// 添加自定义监听事件，PC端为mousedown，mousemove,移动端touchstart，touchmove
Swipe.prototype.addEvent = function(){
	// 判断是移动设备还是pc端,true为移动端，false为PC端
	this.device = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()));
	this.clickEvent = this.device ? "touchstart" : "mousedown";
	this.moveEvent = this.device ? "touchmove" : "mousemove";
	this.endEvent = this.device ? "touchend" : "mouseup";
	// 添加鼠标点击或手指监听事件
	var that = this;
	this.cas.addEventListener(this.clickEvent,function(evt){
		var event = evt || window.event;
		// 获取鼠标点击或手指点击时的视口坐标
		that.posX = this.device ? event.touches[0].clientX - that.getAllOffset(that.cas).allLeft :event.clientX - that.getAllOffset(that.cas).allLeft;
		that.posY = this.device ? event.touches[0].clientY -that.getAllOffset(that.cas).allTop :event.clientY -that.getAllOffset(that.cas).allTop;
		// 点击时调用画圆的方法
		that.drawArc(that.posX,that.posY);
		that.isMouseDown = true; //鼠标按下
		console.log(that.getAllOffset(that.cas).allTop);
	});
	this.cas.addEventListener(this.moveEvent,function(evt){
		if( !that.isMouseDown ){
			return false;
		}else{
			var event = evt || window.event;
			// 调用canvas画线，将鼠标移动时坐标作为lineTo()参数传入。注意上一次点击时的坐标点作为画线的起始坐标
			var ax = this.device ? event.touches[0].clientX - that.getAllOffset(that.cas).allLeft :event.clientX - that.getAllOffset(that.cas).allLeft;
			var ay = this.device ? event.touches[0].clientY -that.getAllOffset(that.cas).allTop :event.clientY -that.getAllOffset(that.cas).allTop;
			that.drawLine(that.posX,that.posY,ax,ay);
			//鼠标边移动边画线，因此需要把上一次移动的点作为下一次画线的起始点
			that.posX = ax;
			that.posY = ay;	
		}
	});
	this.cas.addEventListener(this.endEvent,function(evt){
		that.isMouseDown = false; //鼠标未按下
		//检测透明点的个数
		var n = that.getPercent();
		// 调用同名的全局函数
		that.callback.call(null,n);
		if( n > that.percent ){
			// alert("擦除完成");
			that.context.clearRect(0,0,that._w,that._h);
		}
	});
};
Swipe.prototype.drawArc = function(x1,y1){
	this.context.save();
	this.context.beginPath();
	this.context.arc(x1,y1,this.radius,0,2*Math.PI);
	this.context.fillStyle = "red";
	this.context.fill();
	this.context.stroke();
	this.context.restore();
};
Swipe.prototype.drawLine = function(x1,y1,x2,y2){
	this.context.save();
	this.context.beginPath();
	this.context.moveTo(x1,y1);
	this.context.lineTo(x2,y2);
	this.context.lineWidth =this.radius*2;  //笔刷线条的大小
	this.context.lineCap = "round"; // 连接点效果为圆的
	this.context.strokeStyle = "rgb(255,125,40)"; //笔刷的颜色
	this.context.stroke();	
	this.context.restore();
};
Swipe.prototype.getPercent = function(){
	var num=0;
	var imgData = this.context.getImageData(0,0,this._w,this._h);
	for (var i = 0; i < imgData.data.length; i+=4) {
		if( imgData.data[i+3] === 0){
			num++;
		}
	}
	var transpercent = (num/(this._w*this._h))*100;
	console.log( "透明点占总面积的百分比："+ transpercent.toFixed(2) + "%" );
	return transpercent;
};
// 获取偏移量函数
Swipe.prototype.getAllOffset = function(objs) {
	var Top = 0;
	var Left = 0;
	while(objs){
		Top += objs.offsetTop + objs.clientTop;
		Left += objs.offsetLeft + objs.clientLeft;
		objs = objs.offsetParent;
	}
	return {"allTop":Top,"allLeft":Left};
};