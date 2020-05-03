function $$(id) {
	return document.getElementById(id);
}

window.is_edit = !1;
var ql_editor = $$("editor").querySelector('.ql-editor');
$$('quill').style.left = '-60%';
$$('style-panel').style.top = '100%';

function quill_change_view() {
	if( $$('style-panel').style.top === "72%" ) style_panel_change_view();
	if( $('.active')[0].id === "overview" ) return;
	let left = $$('quill').style.left;
	$$('quill').style.left = left === "-60%" ? 0 : "-60%";
	window.is_edit = !window.is_edit;
	let active_slide_index = parseInt( $('.active')[0].id.split('-')[1] );
	if( window.is_edit ) {
		$$('impress-container').className = 'impress-editing';
		impress().tear();
		$('.step')[active_slide_index - 1].className += ' active';
	} else {
		$$('impress-container').className = "none";
		impress().init();
	}
}

function style_panel_change_view() {
	if( window.is_edit ) quill_change_view();
	let top = $$('style-panel').style.top;
	$$('style-panel').style.top = top === "72%" ? '100%' : "72%";
	if( top === "100%" ) {
		let active_slide = $('.active')[0];
		['data-x', 'data-y', 'data-z',
		 'data-rotate-x', 'data-rotate-y', 'data-rotate-z', 
		].forEach( id => {
		 	$$(id).value = parseFloat( active_slide.getAttribute(id) ) || 0;
		 } )
		$$('data-scale').value = parseFloat( active_slide.getAttribute('data-scale') ) || 1;
		
		impress().goto('overview');
		active_slide.className += ' style-active';
	} else {
		impress().goto($('.style-active')[0]);
		$('.style-active')[0].className = $('.style-active')[0].className.replace(' style-active', '');
	}
}

function close_quill_and_style_panel() {
	if( $$('quill').style.left === "0px" ) quill_change_view();
	if( $$('style-panel').style.top === "72%" ) style_panel_change_view();
}

document.addEventListener('click', e => {
	let ele = e.target,
		cn = ele.className || '',
		slide_with_ele = e.path.slice(0, -4).filter( e => e.className.toString() === 'step' ),
		action = ele.innerText || '';

	if( action === "编辑" ) {
		quill_change_view();
		edit();
	} else if( action === "变换" ) {
		style_panel_change_view();
	} else if( action === "添加" ) {

	} else if( action === "保存" ) {

	} else if ( window.is_edit && slide_with_ele.length ) {
		$('.active')[0].className = 'step';
		slide_with_ele[0].className = "step active";
		edit();
	} else if( ele.tagName.toLowerCase() === "body" ) {
		close_quill_and_style_panel();
	}
})


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
		$('.active')[0].innerHTML = 
			`<div class="ql-editor ql-slide">
				${ql_editor.innerHTML}
			</div>`;
	}
})

ql_editor.addEventListener('keydown', e => {
	if( e.keyCode === 34 || e.keyCode === 33  ) {
		e.preventDefault();
		return;
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
    video.muted = !0;
    video.play();
    setTimeout( () => {
        video.pause();
        video.muted = !1;
        video.style.opacity = 1;
    }, 500)
}