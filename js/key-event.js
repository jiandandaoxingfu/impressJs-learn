// 快捷键
document.body.onkeydown = function(e) {
	// alt组合键
	let key = e.key;
	if( e.altKey ) {
		e.preventDefault();

		if( key === 'e' ) { // 打开/关闭编辑器
			quill_change_view();
			edit_slide();
		} else if( key === 't' ) { // 打开/关闭样式框
			style_panel_change_view();
		} else if( key === 's' ) {
			input_popup_change_view('input-filename');
		} else if( key === 'ArrowUp' || key === "ArrowDown" ) { // 编辑器或样式框状态下切换幻灯片
			let slide = $('.style-active')[0] || $('.active')[0];
			let next_slide = key === 'ArrowUp' ? slide.previousElementSibling : slide.nextElementSibling;
			if( next_slide ) {
				if( window.is_style ) {
					styling_change_slide(next_slide);
				} else if( window.is_edit ) {
					editing_change_slide(next_slide);
				}
			}
		} else if( key === "ArrowLeft" || key === "ArrowRight" && window.is_edit ) { // 编辑器下，切换文本对齐方式
			let selected = $('.ql-align .ql-selected')[0] || $('.ql-align .ql-picker-options')[0].children[0];
			let next = key === 'ArrowLeft' ? selected.previousElementSibling : selected.nextElementSibling;
			if( next ) {
				next.click();
			}
		} else if( window.is_edit ) { // 编辑器工作中
			if( key === 'i' ) { // 插入幻灯片
				insert_slide();
				update_page_number();
			} else if( key === 'r' ) { // 删除幻灯片
				remove_slide();
				update_page_number();
			} else if( key === 'p' ) { // 打开/关闭公式图片选择框
				$('button.ql-image')[0].click();
			} else if( key === 'm' ) { // 打开/关闭公式编辑器
				$('button.ql-formula')[0].click();
			} else if( key === 'v' ) { // 打开/关闭视频选择框
				$('button.ql-video')[0].click();
			} else if( key === 'l' ) { // 插入链接
				$('button.ql-link')[0].click();
			}
		}
	}
}