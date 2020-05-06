// 根据屏幕宽度和slide宽度，在编辑状态时，对slide进行缩放。
(function add_style() {
	let style = document.createElement('style');
	style.setAttribute('type', 'text/css');
	style.setAttribute('name', 'zoom');
	let width = window.innerWidth;
	style.innerHTML = 
		`.impress-editing #impress .step {
			zoom: ${0.4 * width / 900};
		}`
	document.head.appendChild(style);
})();

window.onresize = function() {
	let width = window.innerWidth;
	$('[name="zoom"]')[0].innerHTML = 
		`.impress-editing #impress .step {
			zoom: ${0.4 * width / 900};
		}`
}


window.is_edit = !1;
window.is_style = !1;

// 初始时，隐藏编辑框和样式框
$$('quill').style.left = '-60%';
$$('style-panel').style.bottom = '-165px';

function quill_change_view() {
	if( $$('style-panel').style.bottom === "0px" ) style_panel_change_view();
	if( $('.active')[0].id === "overview" ) {
		$$('overview').classList.remove('active');
		$(".step")[0].classList.add('active');
	}
	let left = $$('quill').style.left;
	$$('quill').style.left = left === "-60%" ? 0 : "-60%";
	window.is_edit = !window.is_edit;
	let active_slide_index = $('#impress .step').index( $('.active')[0] );
	if( window.is_edit ) {
		$$('impress-container').className = 'impress-editing';
		impress().tear();
		$('.step')[active_slide_index].classList.add('active');
		$$('insert-slide').style.display = 'block';
		$$('remove-slide').style.display = 'block';
	} else {
		$$('impress-container').className = "none";
		$$('insert-slide').style.display = 'none';
		$$('remove-slide').style.display = 'none';
		impress().init();
		impress().goto($('.step')[active_slide_index]);
	}
}

function edit_slide() {
	let	active_slide = $('.active')[0];
	if( window.is_edit ) {
		let ele = active_slide.querySelector('.ql-slide');
		$$("editor").querySelector('.ql-editor').innerHTML = ele ? ele.innerHTML.replace(/(^\s+|\s+$)/g, '') : "";
	}
}

function style_panel_change_view() {
	window.is_style = !window.is_style;
	if( window.is_edit ) quill_change_view();
	let bottom = $$('style-panel').style.bottom;
	$$('style-panel').style.bottom = bottom === "0px" ? '-165px' : "0";
	if( bottom === "-165px" ) {
		let active_slide = $('.active')[0];
		active_slide.classList.add('style-active');
		update_style_panel();
		impress().goto('overview');
	} else {
		impress().goto($('.style-active')[0]);
		$('.style-active')[0].classList.remove('style-active');
	}
}

// 更新style-panel中input的值
function update_style_panel() {
	let active_slide = $('.style-active')[0];
	['data-x', 'data-y', 'data-z',
		'data-rotate-x', 'data-rotate-y', 'data-rotate-z',
	].forEach( id => {
		 $$(id).value = parseFloat( active_slide.getAttribute(id) ) || 0;
		} )
	$$('data-scale').value = parseFloat( active_slide.getAttribute('data-scale') ) || 1;
}

// 根据style-panel中input的值更新slide样式。
function update_step_style(ele) {
	let attr = ele.id;
	let active_slide = $('.style-active')[0] || $$('overview');
	let data = parseFloat( ele.value );
	if( data ) {
		active_slide.setAttribute(attr, ele.value);
		let event = document.createEvent("HTMLEvents");
        event.initEvent("resize", true, true);
        window.dispatchEvent(event);
	}
}

function insert_slide() {
	let active_slide = $('.active')[0];
	$('<div class="step"></div>').insertAfter(active_slide);
	let insert_slide = active_slide.nextElementSibling;
	insert_slide.classList.add('active');
	active_slide.classList.remove('active');
}

function remove_slide() {
	if( $('.step').length === 2 ) return;
	let active_slide = $('.active')[0];
	let next_slide = active_slide.nextElementSibling || active_slide.previousElementSibling;
	if( next_slide.id === 'overview' ) next_slide = active_slide.previousElementSibling;
	$$('impress').removeChild(active_slide);
	next_slide.classList.add('active');
}

function save_slides() {
	input_popup_change_view('input-filename');
	let filename = $('[name="file-name"]')[0].value;
	if( filename === "" ) return;

	let first = $$('impress').firstElementChild;
	let slides = ( first.className.includes('step') ? $$('impress') : first ).innerHTML;
	slides = slides.replace(/style=".*?preserve-3d;"/g, '');
	template = template.replace('STEPS_TO_REPLACE', slides);

	let a = document.createElement('a');
	let blob = new Blob([template]);
	a.download = filename + '.html';
	a.href = URL.createObjectURL(blob);
	a.click();
	URL.revokeObjectURL(blob);
}

function play_slides() {
	if( window.is_edit ) {
		quill_change_view();
	} else if( window.is_style ) {
		style_panel_change_view();
	}
	if( $$('impress-container').classList.contains('impress-playing') ) {
		$$('impress-container').classList.remove('impress-playing');
	} else {
		$$('impress-container').classList.add('impress-playing');
		impress().goto($$('step-1'));
	}

}

function update_page_number() {
	let active_slide = $(".style-active")[0] || $('.active')[0];
	let index = $("#impress .step").index(active_slide) + 1;
	$('footer')[0].innerText = index + '/' + ($("#impress .step").length - 1);
}

function editing_change_slide(slide) {
	if( slide.id === 'overview' ) {
		slide = $('.step')[0];
	}
	$('.active')[0].className = 'step';
	slide.className = "step active";
	update_page_number();
	edit_slide();
}

function styling_change_slide(slide) {
	$('.style-active')[0].classList.remove('style-active');
	slide.classList.add('style-active');
	update_page_number();
	update_style_panel();
}

document.addEventListener('click', e => {
	let ele = e.target,
		cn = ele.className || '',
		slide_with_ele = e.path.slice(0, -4).filter( e => {
			let cn = e.className.toString();
			return cn.includes('step') && !cn.includes('active');
		}),
		action = ele.innerText || '';

	if( action === "编辑" ) {
		quill_change_view();
		edit_slide();
	} else if( action === "变换" ) {
		style_panel_change_view();
	} else if( action === "插入" && !cn.includes('btn') ) {
		insert_slide();
		update_page_number();
		edit_slide();
	} else if( action === "删除" ) {
		remove_slide();
		update_page_number();
		edit_slide();
	} else if( action === "保存" && !cn.includes('btn') ) {
		input_popup_change_view('input-filename');
	} else if( action === "演示" ) {
		play_slides();
	} else if( window.is_edit && slide_with_ele.length ) { // 编辑幻灯片内容时，点击幻灯片进行切换。
		editing_change_slide(slide_with_ele[0]);
	} else if( window.is_style && slide_with_ele.length ) { // 编辑幻灯片样式时，点击幻灯片进行切换。
		styling_change_slide(slide_with_ele[0]);
	}
})

// 切换幻灯片时，将上一个幻灯片中正在播放的视频暂停。
document.addEventListener("impress:stepleave", function(event) {
	let videos = event.target.querySelectorAll('video');
	for(let video of videos) {
		video.pause();
	}
}, false)