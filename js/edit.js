window.is_edit = !1;
function $$(id) {
	return document.getElementById(id);
}

$$('container').style.opacity = 1;
$$('quill').style.opacity = 0;

document.addEventListener('click', e => {
	let ele = e.target,
		action = ele.innerText || '';
	if( action === "编辑" ) {
		window.is_edit = !window.is_edit;
		let opacity = 1;
		if( $$('container').style.opacity === "1" ) {
		 	opacity = 0;
		}
		setTimeout(() => {
			$$('container').style.display = opacity ? "block" : "none";
		}, 1 + 500 * !opacity);
		$$('quill').style.opacity = 1 - opacity;
		$$('container').style.opacity = opacity;
	} else if( action === "样式" ) {

	} else if( action === "添加" ) {

	}
})