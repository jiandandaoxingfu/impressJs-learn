# impressJs-learn

借助**impress，quill ，bootstrap，jquery，highlight，image-resize，image-drop，latex，katex**，我们构建了一个**可视化制作幻灯片**的工具。

## 实现
使用impress控制slide的播放，利用quill编辑slide的内容。内容支持插入视频，数学公式。其中数学公式的实现借助于latex(用作编辑公式时预览)和katex。

## 快捷方式
- ctrl + b：加粗。
- ctrl + i：斜体。
- ctrl + u：下划线。

- alt + e：编辑当前幻灯片。
- alt + t：修改幻灯片的样式：平移，旋转，缩放。
- alt + i：插入幻灯片。
- alt + r：删除幻灯片
- alt + s：保存文件。
- 双击公式：重新编辑。

## 参考资料
- [页码和进度条](https://github.com/impress/impress.js/pull/487/commits/cff83a9874bcc586cde66345d4134e014aff2b1f), [yalishizhude](https://github.com/yalishizhude).
