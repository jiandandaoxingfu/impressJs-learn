function $$(id) {
	return document.getElementById(id);
}

// highlight.js配置
hljs.configure({
	languages: ['javascript', 'matlab', 'python', 'html', "mathematic", 'latex', 'R']
});

var toolbarOptions = [
	[{
		'size': ['10px', '12px', "14px", '16px', false, '20px', '22px', '24px', '26px', '32px', '48px', "60px", "72px", "96px", "144px"]
	}], // custom
	[{
		'font': ['Microsoft-YaHei', 'SimSun', 'SimHei', 'KaiTi', 'FangSong', 'Arial', 'Times-New-Roman', 'sans-serif']
	}],
	['bold', 'italic', 'underline', 'strike'], // toggled buttons
	['blockquote', 'code-block'],
	[{
		'list': 'ordered'
	}, {
		'list': 'bullet'
	}],
	[{
		'color': []
	}, {
		'background': []
	}], // dropdown with defaults from theme
	[{
		'align': []
	}],
	['link', 'image', 'video', 'formula']
];

var quill = new Quill('#editor', {
	modules: {
		toolbar: {
			container: toolbarOptions,
			handlers: {
				'video': function() {
					let range = quill.getSelection();
					index = range === null ? 0 : range.index;
					input_popup_change_view('video-select');
				}
			}
		},
		imageDrop: !0,
		syntax: !0,
		imageResize: {
			modules: ['Resize', 'DisplaySize', 'Toolbar']
		},
	},
	placeholder: '',
	readOnly: !1,
	theme: 'snow'
});

// 显示或隐藏选择视频/编辑公式框
function input_popup_change_view(id) {
	let popup = $$(id);
	if( popup.style.zIndex === '5' ) {
		popup.style.opacity = 0;
		popup.style.zIndex = -1;
	} else {
		popup.style.zIndex = 5;
		popup.style.opacity = 1;
	}
}

// 插入链接

$('.ql-toolbar .ql-link')[0].onclick = function() {
	input_popup_change_view('link-edit');
}

function insert_link() {
	input_popup_change_view('link-edit');
	
	let text = $('[name="link-text"')[0].value;
	let url = $('[name="link-url"')[0].value;

	$('[name="link-text"')[0].value = '';
	$('[name="link-url"')[0].value = '';

	$('[data-formula="e=mc^2"]')[0].value = 'url';
	$('.ql-action')[0].click();

	if( text === "" || url === "" ) return;
	let a = $$('link');
	a.innerHTML = text;
	a.href = url;
	a.removeAttribute('id');
}


// 离开选择视频框后，插入视频
var index = 0;
function insert_video() {
	let name = $('[name="video-title"')[0].value;
	let url = $('[name="video-url"]')[0].value;
	if( url === '' ) {
		if( $('[name="filename"]')[0].files.length !== 0 ) {
			url = $('[name="filename"]')[0].files[0].name;
		}
	}
	
	$('[name="video-title"')[0].value = '';
	$('[name="video-url"]')[0].value = '';
	$('[name="filename"]')[0].value = '';
	input_popup_change_view('video-select');

	if( url !== '' ) {
		if( index === 0 ) index = 1;
		quill.insertEmbed(index, 'video', url );
		$(`<p class="ql-align-center">${name}</p>`).insertAfter( $$('video') );
		$$('video').removeAttribute('id');
	}
}

// 插入视频时，800ms后显示。
function show_first_frame(video) {
    setTimeout( () => {
    	video.style.opacity = 1;
    }, 800);
}


// 插入公式

$('.ql-toolbar .ql-formula')[0].onclick = function() {
	input_popup_change_view('formula-editor');
	$$('input').focus();
}

// 离开公式编辑框后，插入公式
var islock = !1;
function insert_formula() {
	input_popup_change_view('formula-editor');
	$$('output').innerHTML = '';
	let code = $$('input').value.replace(/\n/g, '          '); // 换行符替换为10个空格，便于恢复换行符。
	$$('input').value = '';
	if( !code.match(/[a-zA-Z]/) ) return;

	let formula_2_edit = $$('formula-second-edit');
	if( formula_2_edit ) {
		katex.render(code, formula_2_edit.firstElementChild, {
            throwOnError: !1,
            errorColor: "#f00"
        });
        formula_2_edit.setAttribute('data-value', code);
        formula_2_edit.removeAttribute('id');
	} else {
		$('[data-formula="e=mc^2"]')[0].value = code;
		$('.ql-action')[0].click();
	}
}

// 双击数学公式，重新编辑
document.addEventListener('dblclick', e => {
	let ql_formula = e.path.slice(0, -4).filter( e => (e.className.toString() || '').includes('ql-formula') );
	if( ql_formula.length && ql_formula.tagName.toLowerCase() === "span" ) {
		input_popup_change_view('formula-editor');
		$$('input').focus();
		$$('input').value = ql_formula[0].getAttribute('data-value').replace(/          /g, '\n');
		ql_formula[0].id = 'formula-second-edit';
	}
})

// 公式预览
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


// 字体，颜色，对齐方式等选择框

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


// 编辑器内容变化时更新相应的slide
quill.on('text-change', () => {
	if( window.is_edit ) {
		let slide_ql_editor = document.createElement('div');
		slide_ql_editor.setAttribute('class', 'ql-editor ql-slide');
		slide_ql_editor.innerHTML = $$("editor").querySelector('.ql-editor').innerHTML;
		$('.active')[0].innerHTML = '';
		$('.active')[0].appendChild(slide_ql_editor);
	}
})