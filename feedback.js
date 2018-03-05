window.onload=function(){
  console.log("Feedback given");
  var editor = ace.edit("editor");
  editor.setTheme("ace-master/lib/ace/theme/monokai");
  editor.session.setMode("ace-master/lib/ace/mode/javascript");
  console.log('file');
}
