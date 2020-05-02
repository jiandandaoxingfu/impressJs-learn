window.is_edit = !1;
function $$(id) {
	return document.getElementById(id);
}

$$('quill').style.left = '-60%';
$$('style-panel').style.top = '100%';

function quill_change_view() {
	if( $$('style-panel').style.top === "72%" ) style_panel_change_view();
	if( $('.active')[0].id === "overview" ) return;
	let left = $$('quill').style.left;
	$$('quill').style.left = left === "-60%" ? 0 : "-60%";
	window.is_edit = !window.is_edit;
	if( window.is_edit ) {
		$$('impress').className = 'impress-editing';
	} else {
		$$('impress').className = "none";
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
	}
}

function close_quill_and_style_panel() {
	if( $$('quill').style.left === "0px" ) quill_change_view();
	if( $$('style-panel').style.top === "72%" ) style_panel_change_view();
}

document.addEventListener('click', e => {
	let ele = e.target,
		action = ele.innerText || '';
	if( action === "编辑" ) {
		quill_change_view();
		edit();
	} else if( action === "变换" ) {
		style_panel_change_view();
	} else if( action === "添加" ) {

	} else if( ele.tagName.toLowerCase() === "body" ) {
		close_quill_and_style_panel();
	}
})

document.addEventListener('mousemove', e => {
	let className = e.target.className.toString() || '';
	if( className.includes('ql-picker-label') ) {
		let last = $('.ql-expanded')[0];
		if( last ) {
			last.className = last.className.replace('ql-expanded', '');
			last.firstElementChild.setAttribute('aria-expanded', 'false');
			last.firstElementChild.nextElementSibling.setAttribute('aria-hidden', 'true');
		}

		e.target.parentElement.className += ' ql-expanded';
		e.target.setAttribute('aria-expanded', 'true');
		e.target.nextElementSibling.setAttribute('aria-hidden', 'false');
	}
})

var ql_editor = $$("editor").querySelector('.ql-editor');
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


function update_step(ele) {
	let attr = ele.id;
	let active_slide = $('.active')[0];
	let data = parseFloat( ele.value );
	if( data ) {
		active_slide.setAttribute(attr, ele.value);
		active_slide.click();
		if( active_slide.id === "overview" ) {
			let event = document.createEvent("HTMLEvents");
            event.initEvent("resize", true, true);
            window.dispatchEvent(event);
		}
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