//database setup
//var mongoose=require('mongoose');
//mongoose.connect('localhost:27017/gradr');
var MongoClient = require('mongodb').MongoClient;

function countProperties(obj) {
    var count = 0;

    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            ++count;
    }

    return count;
}

window.onload=function(){
  var list=document.getElementById('submissions');
  MongoClient.connect('localhost:27017/gradr', function(err, db){
    if (err) throw err;
    var userDB=db.db("gradr");
    var users=userDB.collection("User");
    var submissions=userDB.collection("Submission");
    var marks=userDB.collection("Mark");
    console.log(users.length);
    console.log(countProperties(users));
    //iterate through each student
    for (user in users){
      var userDiv=document.createNewElement('div');
      var userLabel=document.createNewElement('p');
      var name=document.createTextNode(user.username);
      userLabel.appendChild(name);
      userDiv.innerHTML+=userLabel;
      //find student's submission
      submissions.findOne({assignment.student.type: user.id}, function(err, result){
        if (err) throw err;
        //add student's code
        var codeDiv=document.createNewElement('div#editor');
        var code=document.createTextNode(result.code);
        codeDiv.appendChild(code);
        userDiv.innerHTML+=codeDiv;

        //add resulting output of student's code
        var outputLabel=document.createNewElement('p');
        var output=document.createTextNode(result.output);
        outputLabel.appendChild(output);
        userDiv.innerHTML+=outputLabel;

        //add comment box
        var commentForm=document.createNewElement('form(action=\"/modifySubmission\", method=\"post\", class=\"form-horizontal\")');
        var commentLabel=document.createNewElement('label(class=\"control-label col-md-1\")');
        var commentText=document.createTextNode('Comment');
        commentLabel.appendChild(commentText);
        commentForm.appendChild(commentLabel);
        var commentDiv=document.createNewElement('div(class="col-md-4 form-group")');
        var input=document.createNewElement('input(type="text", name="comment", id="comment", placeholder="comment", class="form-control")');
        commentDiv.appendChild(input);
        commentForm.appendChild(commentDiv);

        //add mark box
        var markLabel=document.createNewElement('label(class=\"control-label col-md-1\")');
        var markText=document.createTextNode('Mark');
        markLabel.appendChild(markText);
        commentForm.appendChild(markLabel);
        var markDiv=document.createNewElement('div(class="col-md-4 form-group")');
        var mark;
        marks.findOne({submission.type: result.id}, function(err, res){
          if(err) throw err;
          mark=res.score;
        });
        input=document.createNewElement('input(type="text", name="mark", id="mark", placeholder="'+mark+'", class="form-control")');
        markDiv.appendChild(input);
        commentForm.appendChild(markDiv);
        


      });
      list.innerHTML+=userDiv;

    }
  });

};
