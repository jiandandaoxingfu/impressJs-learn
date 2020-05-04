function $$(id) {
	return document.getElementById(id);
}

(function add_style() {
	let style = document.createElement('style');
	style.setAttribute('type', 'text/css');
	style.setAttribute('name', 'zoom');
	let width = window.innerWidth;
	style.innerHTML = 
		`.impress-editing #impress .step {
			zoom: ${0.36 * width / 900};
		}`
	document.head.appendChild(style);
})();

window.onresize = function() {
	let width = window.innerWidth;
	$('[name="zoom"]')[0].innerHTML = 
		`.impress-editing #impress .step {
			zoom: ${0.36 * width / 900};
		}`
}

window.is_edit = !1;
window.is_style = !1;
var ql_editor = $$("editor").querySelector('.ql-editor');
$$('quill').style.left = '-60%';
$$('style-panel').style.bottom = '-165px';

function quill_change_view() {
	if( $$('style-panel').style.bottom === "0px" ) style_panel_change_view();
	if( $('.active')[0].id === "overview" ) return;
	let left = $$('quill').style.left;
	$$('quill').style.left = left === "-60%" ? 0 : "-60%";
	window.is_edit = !window.is_edit;
	let active_slide_index = $('#impress .step').index( $('.active')[0] );
	if( window.is_edit ) {
		$$('impress-container').className = 'impress-editing';
		impress().tear();
		$('.step')[active_slide_index].classList.add('active');
		$$('add-slide').style.display = 'block';
	} else {
		$$('impress-container').className = "none";
		$$('add-slide').style.display = 'none';
		impress().init();
		impress().goto($('.step')[active_slide_index]);
	}
}
function update_style_panel() {
	let active_slide = $('.style-active')[0];
	['data-x', 'data-y', 'data-z',
		'data-rotate-x', 'data-rotate-y', 'data-rotate-z',
	].forEach( id => {
		 $$(id).value = parseFloat( active_slide.getAttribute(id) ) || 0;
		} )
	$$('data-scale').value = parseFloat( active_slide.getAttribute('data-scale') ) || 1;
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

function close_quill_and_style_panel() {
	if( $$('quill').style.left === "0px" ) quill_change_view();
	if( $$('style-panel').style.bottom === "0px" ) style_panel_change_view();
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
		edit();
	} else if( action === "变换" ) {
		style_panel_change_view();
	} else if( action === "添加" ) {
		if( window.is_edit ) {
			$('<div class="step"></div>').insertAfter($('.active')[0])
		}
	} else if( action === "保存" ) {

	} else if ( window.is_edit && slide_with_ele.length ) { // 编辑幻灯片内容时，点击幻灯片进行切换。
		$('.active')[0].className = 'step';
		slide_with_ele[0].className = "step active";
		edit();
	} else if( window.is_style && slide_with_ele.length ) {
		$('.style-active')[0].classList.remove('style-active');
		slide_with_ele[0].classList.add('style-active');
		update_style_panel();
	}
})

document.addEventListener('dblclick', e => {
	let ql_formula = e.path.slice(0, -4).filter( e => (e.className.toString() || '').includes('ql-formula') );
	if( ql_formula.length ) {
		input_popup_change_view('formula-editor');
		$$('input').focus();
		$$('input').value = ql_formula[0].getAttribute('data-value').replace(/          /g, '\n');
		ql_formula[0].id = 'formula-second-edit';
	}
})

document.body.onkeydown = function(e) {
	var keyCode = e.keyCode || e.which || e.charCode;
	var altKey = e.altKey;
	if( altKey ) {
		if( keyCode === 69 ) {
			quill_change_view();
			edit();
		} else if( keyCode === 84 ) {
			style_panel_change_view();
		} else if( keyCode === 73 ) {

		} else if( keyCode === 83 ) {

		}
	}
}


// 渲染数学公式
islock = !1;

$("button.ql-formula")[0].onclick = () => {
	input_popup_change_view('formula-editor');
	$$('input').focus();
}

$$('formula-editor').onmouseleave = () => {
	input_popup_change_view('formula-editor');
	$$('output').innerHTML = '';
	let code = $$('input').value.replace(/\n/g, '          '); // 换行符替换为10个空格，便于恢复换行符。
	$$('input').value = '';
	if( !code.match(/[a-zA-Z]/) ) return;

	if( $$('formula-second-edit') ) {
		katex.render(code, $$('formula-second-edit').firstElementChild, {
            throwOnError: !1,
            errorColor: "#f00"
        });
        $$('formula-second-edit').setAttribute('data-value', code);
        $$('formula-second-edit').removeAttribute('id');
	} else {
		$('[data-formula="e=mc^2"]')[0].value = code;
		$('.ql-action')[0].click();
	}
}

function latex_render() {
	if( islock ) return;
	islock = true;
	$$('buffer').innerHTML = '$' + $$('input').value.replace(/\n/g,"<br />") + '$';
	window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, $$('buffer')], [preview_math, $$("output")]);
} 

function preview_math() {
	islock = false;
	$$('output').innerHTML = $$('buffer').innerHTML;
}

function close_picker() {
	let picker = $('.ql-expanded')[0];
	if( !picker ) return;
	picker.className = picker.className.replace('ql-expanded', '');
	picker.firstElementChild.setAttribute('aria-expanded', 'false');
	picker.firstElementChild.nextElementSibling.setAttribute('aria-hidden', 'true');
}

function open_picker(picker) {
	picker.parentElement.className += ' ql-expanded';
	picker.setAttribute('aria-expanded', 'true');
	picker.nextElementSibling.setAttribute('aria-hidden', 'false');
}

document.addEventListener('mousemove', e => {
	let picker = e.path.slice(0, -4).filter( ele => (ele.className.toString() || '').includes('ql-picker-label') );
	if( picker.length ) {
		let cn = picker[0].parentElement.className;
		if( !cn.includes('ql-expanded') ) {
			close_picker();
			open_picker(picker[0]);
		}
	} else if( e.target.id === 'editor' ) {
		close_picker();
	}
})

function edit() {
	let	active_slide = $('.active')[0];
	if( window.is_edit ) {
		let ele = active_slide.querySelector('.ql-slide');
		ql_editor.innerHTML = ele ? ele.innerHTML.replace(/(^\s+|\s+$)/g, '') : "";
	}
}

quill.on('text-change', () => {
	if( window.is_edit ) {
		let slide_ql_editor = document.createElement('div');
		slide_ql_editor.setAttribute('class', 'ql-editor ql-slide');
		slide_ql_editor.innerHTML = ql_editor.innerHTML;
		$('.active')[0].innerHTML = ''
		$('.active')[0].appendChild(slide_ql_editor);
	}
})

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


function show_first_frame(video) {
    setTimeout( () => {
    	video.style.opacity = 1;
    }, 800);
}

document.addEventListener("impress:stepleave", function(event) {
	let videos = event.target.querySelectorAll('video');
	for(let video of videos) {
		video.pause();
	}
}, false);