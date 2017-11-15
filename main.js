
//library/package imports
var express=require('express');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var st=require('node-static');
var http=require('http');
var fs = require('fs');

//express setup
var app=express();


// body parser (parses URL-encoded body content)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('port',process.env.PORT || 3000);

var file=new st.Server('./public');

// configure view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

//routes (map URI ->code)
app.get('/', function(request,response){
  response.render('main');
});

// this route handles the incoming file
app.post('/fileuploadHandler', function(request, response) {
  var form = new formidable.IncomingForm();

  form.parse(request);

  form.on('fileBegin', function (name, file){
      file.path = __dirname + '/uploadedFiles/' + file.name;
  });

  form.on('file', function (name, file){
      console.log('Uploaded ' + file.name);
  });

  // TODO: Redirect somewhere
  //response.sendFile(__dirname + '/index.html');
});

http.createServer(function (req, res) {
  /*
  if (req.url == '/fileupload') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      var newpath = 'D:/HonoursThesis2017/AlexLy/web-based_auto-grader/uploadedFiles/' + files.filetoupload.name;
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        res.write('File uploaded and moved!');
        res.end();
      });
 });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
  } */
}).listen(8080);

//read file
//fs.readFile('C:/Users/MrE_0/Documents/university/thesis/public/'+file, 'utf8', function (err,data) {
  //if (err) {
    //return console.log(err);
  //}
  //console.log(data);
//});

//setup HTTP listener
app.listen(app.get('port'),function(){
  console.log('listening on port ' + app.get('port'));
});
