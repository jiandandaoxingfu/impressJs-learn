hljs.configure({
  	languages: ['javascript', 'matlab', 'python', 'html', "mathematic", 'latex', 'R']
});

var toolbarOptions = [
	[{ 'size': ['10px', '12px', "14px", '16px', "18px", '20px', '22px', '24px', '26px', '32px', '48px', "60px", "72px", "96px", "144px"] }],  // custom
	[{ 'font': ['SimSun', 'SimHei','Microsoft-YaHei','KaiTi','FangSong','Arial','Times-New-Roman','sans-serif'] }],
  	['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  	['blockquote', 'code-block'],
	[{ 'list': 'ordered'}, { 'list': 'bullet' }],
  	[{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  	[{ 'align': [] }],
  	['link', 'image', 'video', 'formula']
];
var quill = new Quill('#editor', {
  	modules: {
    	toolbar: {
    		container: toolbarOptions,
    		handlers: {
    			'video': function() {
    				let range = this.quill.getSelection();
    				let index = range === null ? 0 : range.index;
    				console.log(index);
            		let url = prompt("输入地址");
            		this.quill.insertEmbed(index, 'video', url);
            		if( index === 0 ) {
              			$$('editor').querySelector('.ql-editor').innerHTML = '<p>&nbsp;</p>' + 
                			$$('editor').querySelector('.ql-editor').innerHTML;
            		}
    			},
          		'formula': function() {
          		}
    		}
    	},
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