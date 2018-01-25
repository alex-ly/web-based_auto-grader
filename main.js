
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
//var docker = new Docker({protocol: 'http', host: 'localhost', port: 3000});
var docker = new Docker();

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

function runExec(container, filename){
  var options={
    Cmd:['bash', '-c', 'python '+__dirname +'/uploadedFiles/'+filename+'.py'],
    AttachStdout: true,
    AttachStderr: true
  };

  container.exec(options, function(err, exec){
    //console.log('Error: '+err);
    console.log(exec);
    if (err) return;
    exec.start(function(err, stream){
      container.modem.demuxStream(stream, process.stdout, process.stderr);
      exec.inspect(function(err, data){
        console.log(data);
      });
    });
  });

}

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
        //read file
        fs.readFile(newpath,'utf8', function (err,data) {

          if (err) {
            return console.log(err);
          }
          console.log(data);
        });

        // create docker container

        //docker.createContainer({Image: 'python', Cmd: ['~/Windows/WinSxS/amd64_microsoft-windows-lxss-bash_31bf3856ad364e35_10.0.16299.15_none_62878a822db68b25/bash'], name: 'python-test'}, function (err, container) {

        //var container=docker.getContainer('8997365d2511');
        //container.start(function (err, data) {
        //  console.log(data);
        //});

        docker.createContainer({Image: 'test', Cmd: ['/usr/local/bin/python', '/data/'+ filename+'.py'], name: '07d'}, function (err, container) {
          console.log('Error: '+err);
          console.log('Command: '+Cmd);
          container.start(function (err, data) {
            console.log('Accessed container: '+container.id);
            console.log('Error: '+err);
            console.log('Data: '+data);
            //runExec(container, filename);
          });
        });


        //var container=docker.getContainer('test');
        //
        //docker.run('python', ['python', 'uploadedFiles/'+filename+'.py'], process.stdout, function(err, data, container){
          //console.log(data);
        //});

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
