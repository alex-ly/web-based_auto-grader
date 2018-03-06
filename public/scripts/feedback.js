window.onload=function(){
  console.log("Feedback given");
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/python");
  console.log('file'); // ??
}
