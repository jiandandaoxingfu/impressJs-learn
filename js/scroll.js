var scroll = {
	timeStamp: 15,
	scrollTimes: 10,
	isScroll: !0,

	// 滚动页面，使焦点元素处在屏幕中央(竖直方向)
	// ref: https://www.cnblogs.com/hjqbit/p/7260989.html
	scroll2middle: function(ele) { 
		if( !this.isScroll ) return;
		var doc = $('.impress-editing')[0];	// 电脑端
		var s = doc.scrollTop; 				// 网页被卷去部分的高
        var h1 = window.innerHeight; 		// 文档可视区的高度
        var h2 = ele.clientHeight;			// 元素的高度
        var off = this.getHeight(ele) * parseFloat( $('.step').css('zoom') ); 		// 元素距离文档顶部的距离
       	var addScroll = (off + h2/2) - (s + h1/2); 	// 元素中心高度与可视区域中心高度之差
		if( addScroll + s < 0 ) { // 下滑到头
			addScroll = - doc.scrollTop;
		} else if( addScroll > doc.scrollHeight - h1 ) { // 上滑到底
			addScroll = doc.scrollHeight - h1 - doc.scrollTop;  // 前两个元素是文档总高度与可视区域之差，即最大上滑距离
		}
		if( addScroll !== 0 ) {
			this.isScroll = !1;
			this.smoothScroll(addScroll, this.scrollTimes);
		}
	},

	getHeight: function(ele) { // 获取元素距离文档顶部的距离
		var h = 0;  
		var obj = ele;
		while (obj) {
			h += obj.offsetTop; // 不断累加e元素和其每个父元素的offsetTop
			obj = obj.offsetParent;
		}
		return h;
	},

	smoothScroll: function(dist, count) {
		if( count > 0 ) {
			setTimeout( () => {
				$(".impress-editing")[0].scrollTop += dist/this.scrollTimes; // 电脑
				this.smoothScroll(dist,  --count);
			}, this.timeStamp);
		} else {
			this.isScroll = !0;
		}
	}
}