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
				},
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

function input_popup_change_view(id) {
	let popup = $$(id);
	if( popup.style.zIndex === '5' ) {
		popup.style.opacity = 0;
		setTimeout( () => {
			popup.style.zIndex = -1;
		}, 500)
	} else {
		popup.style.zIndex = 5;
		popup.style.opacity = 1;
	}
}

var index = 0;
$('#video-select')[0].onmouseleave = (e) => {
	let name = $('[name="video-title"')[0].value;
	let url = $('[name="url"]')[0].value;
	if( url === '' ) {
		if( $('[name="filename"]')[0].files.length !== 0 ) {
			url = $('[name="filename"]')[0].files[0].name;
		}
	}
	if( url !== '' ) {
		quill.insertEmbed(index, 'video', url );
		$(`<p class="ql-align-center">${name}</p>`).insertAfter( $$('video') );
		$$('video').removeAttribute('id');
	}

	$('[name="url"]')[0].value = '';
	$('[name="filename"]')[0].files = null;
	$('[name="video-title"')[0].value = '';
	input_popup_change_view('video-select');
}

