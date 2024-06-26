const template = 
`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=1024" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>impress</title>
    
    <meta name="description" content="impress" />
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.7.1/katex.min.css">

    <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
    <script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/jquery-3.4.1.slim.min.js"></script>
    <script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/bootstrap.min.js"></script>

    <!-- /*  impress    */ -->
    <link href="https://jiandandaoxingfu.github.io/impressJs-learn/css/impress-demo.css" rel="stylesheet" />
    <link href="https://jiandandaoxingfu.github.io/impressJs-learn/css/impress-common.css" rel="stylesheet" />
    <link rel="shortcut icon" href="https://jiandandaoxingfu.github.io/impressJs-learn/favicon.ico" />
    
    <!-- quill -->
    <link href="https://jiandandaoxingfu.github.io/impressJs-learn/css/quill.snow.css" rel="stylesheet">
    <link rel="stylesheet" href="https://jiandandaoxingfu.github.io/impressJs-learn/css/index.css" />
    <link rel="stylesheet" href="https://jiandandaoxingfu.github.io/impressJs-learn/css/monokai-sublime.css" />

    <script src="https://jiandandaoxingfu.github.io/impressJs-learn/js/highlight.pack.js"></script>
    <script src="https://jiandandaoxingfu.github.io/impressJs-learn/js/quill.min.js"></script>
    <script src="https://jiandandaoxingfu.github.io/impressJs-learn/js/image-resize.min.js"></script>
    <script src="https://jiandandaoxingfu.github.io/impressJs-learn/js/image-drop.min.js"></script>

    <script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/template.js"></script>
    <link rel="stylesheet" type="text/css" href="https://jiandandaoxingfu.github.io/impressJs-learn/css/impress-progress.css">

    <script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/scroll.js"></script>

    <!-- MathJax -->
    <script type="text/x-mathjax-config">
            MathJax.Hub.Config({
                messageStyle: 'none',
                tex2jax: {
                    inlineMath: [['$','$']]
                },
                "HTML-CSS": {
                    scale: 80
                },
                TeX: { 
                    equationNumbers: { }
                }
            });
        </script>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=default"></script>
</head>

<body>
    <div id="style-panel">
        <div class="input-groups" id="translate">
            <h3>平移</h3>
            <div class="input-group">
                <span class="input-group-addon">X</span>
                <input type="number" max="10000" min="-10000" class="form-control" id="data-x" step="20" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="0">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">Y</span>
                <input type="number" max="10000" min="-10000" class="form-control" id="data-y" step="20" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="0">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">Z</span>
                <input type="number" max="10000" min="-10000" class="form-control" id="data-z" step="20" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="0">
            </div>
        </div>  

        <div class="input-groups" id="rotate">
            <h3>旋转</h3>
            <div class="input-group">
                <span class="input-group-addon">X</span>
                <input type="number" max="180" min="-180" class="form-control" id="data-rotate-x" step="5" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="0">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">Y</span>
                <input type="number" max="180" min="-180" class="form-control" id="data-rotate-y" step="5" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="0">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">Z</span>
                <input type="number" max="180" min="-180" class="form-control" id="data-rotate-z" step="5" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="0">
            </div>
        </div>

        <div class="input-groups" id="scale">
            <h3>放缩</h3>
            <div class="input-group">
                <span class="input-group-addon">R</span>
                <input type="number" max="10" min="0.1" step="0.1" class="form-control" id="data-scale" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="1">
            </div>
            <h3>宽度</h3>
            <div class="input-group">
                <span class="input-group-addon">W</span>
                <input type="number" max="900" min="30" step="20" class="form-control" id="data-width" onkeyup="update_step_style(this)" onchange="update_step_style(this);" value="900">
            </div>  
        </div>
    </div>

    <div id="quill">
        <div id="editor"></div>
    </div>

    <div id="insert-link">
        <div class="input-groups insert-link">
            <h3>插入链接</h3>
            <div class="input-group">
                <span class="input-group-addon">文本</span>
                <input type="text" class="form-control" name="link-text">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">地址</span>
                <input type="text" class="form-control" name="link-url">
            </div>    
            <button type="button" class="btn btn-default" onclick="insert_link();">插入</button>
        </div>
    </div>
    
    <div id="insert-video">
        <div class="input-groups insert-video">
            <h3>插入视频</h3>
            <div class="input-group">
                <span class="input-group-addon">名称</span>
                <input type="text" class="form-control" name="video-title">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">地址</span>
                <input type="text" class="form-control" name="video-url">
            </div>    
            <div class="input-group">
                <span class="input-group-addon">或者</span>
                <input type="file" class="form-control" name="video-name">
            </div>
            <div class="select-file" tabindex="0">选择文件</div>
            <button type="button" class="btn btn-default" onclick="insert_video();">插入</button>
        </div>
    </div>

    <div id="formula-editor">
        <textarea id='input' oninput="latex_render();" placeholder="输入"></textarea>
        <button type="button" class="btn btn-default" onclick="insert_formula();">插入</button>
        <div id='output'>预览</div>
        <div id="buffer"></div>
    </div>

    <div id="save-filename">
        <div class="input-groups save-filename">
            <h3>保存文件</h3>
            <div class="input-group">
                <span class="input-group-addon">文件名</span>
                <input type="text" class="form-control" name="filename">
            </div>    
            <button type="button" class="btn btn-default" onclick="save_slides();">保存</button>
        </div>
    </div>

    <div id="tool">
        <button>编辑</button>
        <button>变换</button>
        <button id="insert-slide">插入</button>
        <button id="remove-slide">删除</button>
        <button>保存</button>
        <button>演示</button>
    </div>

    <div id="impress-container">
        <div id="impress"
            data-transition-duration="500"
            data-width="1024"
            data-height="768"
            data-max-scale="3"
            data-min-scale="0"
            data-perspective="1000">
            
            STEPS_TO_REPLACE

        </div>
    </div>

<script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/quill-setup.js"></script>
<script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/edit.js"></script>
<script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/key-event.js"></script>
<script type="text/javascript" src="https://jiandandaoxingfu.github.io/impressJs-learn/js/impress.js"></script>
<script>
    impress().init();
    impress().showPage();
    impress().showProgress();
</script>

</body>
</html>
`
