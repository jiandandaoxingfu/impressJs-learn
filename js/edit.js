window.is_edit = !1;
function $$(id) {
	return document.getElementById(id);
}

$$('impress-container').style.opacity = 1;
$$('edit-container').style.opacity = 0;

document.addEventListener('click', e => {
	let ele = e.target,
		action = ele.innerText || '';
	if( action === "编辑" ) {
		let opacity = 1;
		if( $$('impress-container').style.opacity === "1" ) {
		 	opacity = 0;
		}
		setTimeout(() => {
			$$('impress-container').style.display = opacity ? "block" : "none";
		}, 1 + 500 * !opacity);
		$$('edit-container').style.opacity = 1 - opacity;
		$$('impress-container').style.opacity = opacity;
		window.is_edit = !window.is_edit;
		edit();
	} else if( action === "样式" ) {

	} else if( action === "添加" ) {

	}
})

var ql_editor = $$("editor").querySelector('.ql-editor');
function edit() {
	let	active_slide = document.querySelector('.active');
	if( window.is_edit ) {
		let ele = active_slide.querySelector('.ql-slide');
		ql_editor.innerHTML = ele ? ele.innerHTML.replace(/(^\s+|\s+$|\n)/g, '') : "";
	} else {
		active_slide.innerHTML =
			`<div class="ql-editor ql-slide">
				${ql_editor.innerHTML}
			</div>`
	}
}

ql_editor.addEventListener('keyup', e => {
	if( window.is_edit ) {
		$$("edit-preview").innerHTML = 
			`<div class="ql-editor ql-preview">
				${ql_editor.innerHTML}
			</div>`;

	}
})