//basic node

//library/package imports
var express=require('express');

//express setup
var app=express();
app.set('port',process.env.PORT || 3000);

var st=require('node-static');
var http=require('http')
var file=new st.Server('./public');

//routes (map URI ->code)
//app.get('/', function(request,response){
//  response.send('hello world');
//});

http.createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
}).listen(8080);
//setup HTTP listener

app.listen(app.get('port'),function(){
  console.log('listening on port'+app.get('port'));
});
