
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

var Writable = require('stream').Writable;
var actualStream = new Writable();
var expectedStream = new Writable();

var actual_output = '';
var expected_output='';

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

/*function runExec(container, filename){
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

}*/

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
        //res.write('File uploaded and moved!');
        //read file
        fs.readFile(newpath,'utf8', function (err,data) {

          if (err) {
            return console.log(err);
          }
          console.log(data);
        });

        // create docker container

        var createOptions = {
          Tty: false,
          'Binds': ['/c/Users/MrE_0/Documents/university/thesis/uploadedFiles:/data']
        };

        //run uploaded file
        //var command = ['/usr/local/bin/python', '/data/'+filename+'.py'];
        //var command = ['/usr/local/bin/python', '/data/'+filename+'.py'];//,'>actual_output.txt'];

        actualStream._write = function write(doc, encoding, next) {
          var StringDecoder = require('string_decoder').StringDecoder;
          var decoder = new StringDecoder('utf8');
          var result = decoder.write(doc);
          actual_output += result;
          next()
          // resolve(result);  // Moved the resolve to the handler, which fires at the end of the stream
        };
        expectedStream._write = function write(doc, encoding, next) {
          var StringDecoder = require('string_decoder').StringDecoder;
          var decoder = new StringDecoder('utf8');
          var result = decoder.write(doc);
          expected_output += result;
          next()
          // resolve(result);  // Moved the resolve to the handler, which fires at the end of the stream
        };

        function handler(error, data, container) {
          if (error) {
            console.log({ 'status': 'error', 'message': error });
            reject(error)
          }
          //resolve(output);
          //return output;
        };



        docker.run('test', ['/usr/local/bin/python', '/data/'+filename+'.py'], actualStream, createOptions, function(error, data, container){
          console.log('Actual output: '+actual_output);

          docker.run('test', ['/usr/local/bin/python', '/data/hello-world.py'], expectedStream, createOptions, function(error, data, container){
            console.log('Expected output: '+expected_output);
            var msg;
            if(actual_output!=expected_output){
              msg='Outputs are not the same';
            }else{
              msg='Outputs are the same';
            }
            //res.writeHead(200);

            res.render('feedback', { Output: actual_output, Message: msg });
            return res.end();

            //return container.remove();
          });
          //return container.remove();

        });

        /*docker.run('test', ['/usr/local/bin/python', '/data/'+filename+'.py'], actualStream, createOptions, handler);
        docker.run('test', ['/usr/local/bin/python', '/data/hello-world.py'], expectedStream, createOptions, handler);
        console.log('Actual output: '+actual_output);

        console.log('Expected output: '+expected_output);
        var msg;
        if(actual_output!=expected_output){
          msg='Outputs are not the same';
        }else{
          msg='Outputs are the same';
        }*/

        //res.render('feedback', { Output: actual_output, Message: msg });
        //return res.end();
        /*

        docker.run('test', command, actualStream, createOptions, function(err, data, container) {
          if (err) {
            console.log('Error:', err);
          }
          //console.log(process.stdout);

          console.log('Command: ', command.join(' '));
          console.log('Data: ', data);
          console.log('Started container ', container.id);

          //run master program
          //command = ['/usr/local/bin/python', '/data/hello-world.py'];
          command = ['/usr/local/bin/python', '/data/hello-world.py','>/data/expected_output.txt'];
          //command=[];
          docker.run('test', command, process.stdout, createOptions, function(err, data, container) {
            if (err) {
              console.log('Error:', err);
            }
            //console.log(process.stdout);
            console.log('Command: ', command.join(' '));
            console.log('Data: ', data);
            console.log('Started container ', container.id);

            fs.readFile('/data/expected_output.txt','utf8',function(err,data){
              console.log(data);
            });

            fs.readFile('actual_output.txt','utf8',function(err,data){
              console.log(data);
            });
            return container.remove();
          });
          return container.remove();

        });
        */

        //res.end();

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
