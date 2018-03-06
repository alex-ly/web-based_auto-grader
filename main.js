
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

//database setup
var mongoose=require('mongoose');


var Writable = require('stream').Writable;
var actualStream = new Writable();
var expectedStream = new Writable();

var actual_output = '';
var expected_output='';
var actual_code='';

// body parser (parses URL-encoded body content)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('port',process.env.PORT || 3000);

var file=new st.Server('./public');

// configure view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

mongoose.connect('localhost:27017/');

var Schema = mongoose.Schema;

//user profile
var userSchema = new Schema({
	role: String
}, {collection: 'User'});
var User = mongoose.model('User', userSchema);

var ta= new User({role: 'marker'});
var student =new User({role: 'student'});
ta.save(function(error){
  if(error) console.log('Addition error');
});
student.save(function(error){
  if(error) console.log('Addition error');
});
//assignment
var assignmentSchema = new Schema({
	title: String,
  desc: String,
  mark: Number,
  dueDate: Date,
  weight: Number
}, {collection: 'Assignment'});
var Assignment = mongoose.model('Assignment', assignmentSchema);

var assignment1=new Assignment({title: 'Assignment 1', desc: 'blah', weight: 10});
assignment1.save(function(error){
  if(error) console.log('Addition error');
});

//submission
var submissionSchema = new Schema({
	assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {collection: 'Submission'});
var Submission = mongoose.model('Submission', submissionSchema);

//mark
var markSchema = new Schema({
	assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  marker: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  score: Number,
  comment: String
}, {collection: 'Mark'});
var Mark = mongoose.model('Mark', markSchema);

//routes (map URI ->code)
app.get('/', function(request,response){
  response.render('upload');
});

app.post("/fileuploadhandle", function(req, res){

  if (req.url == '/fileuploadhandle') {
    var form = new formidable.IncomingForm();
    var filename=uuid.v4();
    form.parse(req, function (err, fields, files) {
      var submission1=new Submission({assignment: assignment1.id, student: student.id});
      submission1.save(function(error){
        if(error) console.log('Addition error');
      });

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
          actual_code+=data;
        });

        // create docker container

        var createOptions = {
          Tty: true,
          'Binds': ['/c/Users/MrE_0/Documents/university/web-based_auto-grader-master/uploadedFiles:/data']
        };

        //run uploaded file

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
              var mark=new Mark({assignment: assignment1.id, marker: ta.id, score: 0});
            }else{
              msg='Outputs are the same';
              var mark=new Mark({assignment: assignment1.id, marker: ta.id, score: 1});
            }
            mark.save(function(error){
              if(error) console.log('Addition error');
            });
            console.log(mark.score);
            //res.writeHead(200);

						console.log('Code: ***' + actual_code + '***');

            res.render('feedback', { Actual_output: 'Your code output: '+actual_output, Message: msg, Expected_output: 'Expected code output: '+expected_output, Code: actual_code });
            return res.end();


            //return container.remove();
          });
          //return container.remove();

        });


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
