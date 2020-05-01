hljs.configure({
  	languages: ['javascript', 'matlab', 'python', 'html', "mathematic", 'latex', 'R']
});

var toolbarOptions = [
	[{ 'size': ['10px', '12px', false, '16px' ,'18px', '20px', '22px', '24px', '26px', '32px', '48px'] }],  // custom
	[{ 'font': ['SimSun', 'SimHei','Microsoft-YaHei','KaiTi','FangSong','Arial','Times-New-Roman','sans-serif'] }],
  	['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  	['blockquote', 'code-block'],
	[{ 'list': 'ordered'}, { 'list': 'bullet' }],
  	[{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  	[{ 'align': [] }],
  	['link', 'image', 'video', 'formula'],
];
var editor = new Quill('#editor', {
	debug: 'info',
  	modules: {
    	toolbar: toolbarOptions,
    	imageDrop: true,
    	syntax: true,
    	imageResize: {
    		modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
    	},
  	},
  	placeholder: '',
  	readOnly: false,
  	theme: 'snow'
});