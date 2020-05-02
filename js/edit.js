window.is_edit = !1;
function $$(id) {
	return document.getElementById(id);
}

$$('quill').style.left = '-30%';
$$('style-panel').style.top = '100%';

function quill_change_view() {
	let left = $$('quill').style.left;
	$$('quill').style.left = left === "-30%" ? 0 : "-30%";
	window.is_edit = !window.is_edit;
}

function style_panel_change_view() {
	let top = $$('style-panel').style.top;
	$$('style-panel').style.top = top === "72%" ? '100%' : "72%";
	if( top === "100%" ) {
		let active_slide = document.querySelector('.active');
		['data-x', 'data-y', 'data-z', 
		 'data-rotate-x', 'data-rotate-y', 'data-rotate-z', 
		].forEach( id => {
		 	$$(id).value = parseFloat( active_slide.getAttribute(id) ) || 0;
		 } )
		$$('data-scale').value = parseFloat( active_slide.getAttribute('data-scale') ) || 1;
	}

}
document.addEventListener('click', e => {
	let ele = e.target,
		action = ele.innerText || '';
	if( action === "编辑" ) {
		quill_change_view();
		edit();
	} else if( action === "变换" ) {
		if( window.is_edit ) quill_change_view();
		style_panel_change_view();
	} else if( action === "添加" ) {

	}
})

document.addEventListener('mousemove', e => {
	let className = e.target.className.toString() || '';
	if( className.includes('ql-picker-label') ) {
		let last = document.querySelector('.ql-expanded');
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
	let	active_slide = document.querySelector('.active');
	if( window.is_edit ) {
		let ele = active_slide.querySelector('.ql-slide');
		ql_editor.innerHTML = ele ? ele.innerHTML.replace(/(^\s+|\s+$)/g, '') : "";
	}
}

ql_editor.addEventListener('keyup', e => {
	if( window.is_edit ) {
		document.querySelector('.active').innerHTML = 
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
	let active_slide = document.querySelector('.active');
	let data = parseFloat( ele.value );
	if( data ) {
		active_slide.setAttribute(attr, ele.value);
		active_slide.click();
	}
}