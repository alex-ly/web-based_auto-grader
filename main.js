
//library/package imports
var express = require('express');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var st = require('node-static');
var http = require('http');

//for saving the uploaded files
var fs = require('fs');
var path = require('path');

//generate unique filenames
var uuid=require('node-uuid');

//communication with docker
var Docker = require('dockerode');
var docker = new Docker({protocol: 'http', host: 'localhost', port: 3000});

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
  response.render('upload');
});


app.post("/fileuploadhandle", function(req, res){

  if (req.url == '/fileuploadhandle') {
    var form = new formidable.IncomingForm();
    var filename=uuid.v4();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;

      console.log('Old path: '+oldpath);

      var newpath = __dirname+'/uploadedFiles/'+filename+'.py';

      console.log('New path: '+newpath);
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        res.write('File uploaded and moved!');
        fs.readFile(newpath,'utf8', function (err,data) {

          if (err) {
            return console.log(err);
          }
          console.log(data);
        });

        // create docker container

        docker.createContainer({Image: 'python', Cmd: ['python', 'uploadedFiles/'+filename+'.py'], name: 'python-test'}, function (err, container) {
          //container.start(function (err, data) {
          //  console.log(data);
          //});
        });


        //var container=docker.getContainer('test');
        //
        docker.run('python', ['python', 'uploadedFiles/'+filename+'.py'], process.stdout, function(err, data, container){
          console.log(data);
        });

        // TODO: share uploaded file with docker


        //run the uploaded file from docker container

        res.end();

      });


 });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileuploadhandle" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    //res.render('upload');
    return res.end();
  }
});



//setup HTTP listener
app.listen(app.get('port'),function(){
  console.log('listening on port'+app.get('port'));
});
