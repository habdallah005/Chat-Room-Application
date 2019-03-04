const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;
// import ChatRoom Schema
var { ChatRoom } = require('./models/ChatRoom')
// connect using m.lab
const url = "mongodb://101087205:Chat123456@ds351455.mlab.com:51455/chat-application"

//connect to mongodb
mongo.connect(url, { useNewUrlParser: true }, function(err, database) {
    if(err) { throw err }

    console.log('Mongodb Connected.....')

    //connect to socket.io
    client.on('connection', function(socket) {
        // connection to the database
        var db = database.db('chat-application')
        // create the collection
        const chat = db.collection('chats');
        const event = db.collection('events')
        const rooms = db.collection('rooms')
        const chat_history = db.collection('chat_history');


        // console.log("A user connected")
        // create function to send status
        sendStatus = function(s){
            socket.emit('status', s)
        }

        //Gets Chats from mongo collection
        /*chat_history.find().limit(100).sort({_id:1}).toArray(function(err,res) {
            if(err){ throw err;  }
            socket.emit('output', res);
        });*/

        // handle input events 
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;
            let date = data.date;
            let room = data.room;

            console.log(name + " " + message + " " + date)
            // check for name and message
            if( name == '' || message == '' || date == ''){
                //send error status
                sendStatus('Please enter a name and message')
            }
            else {
                chat_history.insertOne({name: name, message: message, room:room, date: date}, function(){
                   client.emit('output', [data]);
                    //send status object
                    sendStatus({
                        message:'Message Sent',
                        clear: true
                    })
                })
            }
        });

        // handle new User events
        socket.on('join', function(data){

            let name = data.name;
            let message = data.message;
            let date = data.date;
            let room = data.room;

            if( name == '' || message == '' || date == '' || room == ''){
                sendStatus('Please enter a name and message');
            } else {

                // find the name and the room in the room history
                // if the result not found send the message to the screen Join
                // else the message send to the screen connected

                chat_history.find({name:name, room:room}).toArray(function(err, res){
                    if(err) throw err
                    else {
                        if(res.length == 0){
                            message = `Joined`;
                            console.log("CONNECTED")
                            // insert to the chat_history the new user who joined
                            chat_history.insertOne({name:name, message: message, room:room, date: date}, function(){
                                // emit to the output the user
                                client.emit('output', [{name:name, message: message, room:room, date: date}]);
                                sendStatus({
                                    clear:true
                                })
                            })
                        } else {
                            // select all message from the room
                            // if no message in the room
                            chat_history.find({room:room}).limit(100).sort({_id:1}).toArray(function(err,doc) {
                                if(err){ throw err;  }
                                else {
                                doc.push(data)
                                socket.emit('output', doc);
                                }
                            })
                        }
                        
                    }
                })
            }

        })

        // handle on left events
        socket.on('leftRoom', function(data){
            
            let name = data.name;
            let message = data.message;
            let date = data.date;
            let room = data.room;

            if( name == '' || message == '' || date == '' || room == ''){
                sendStatus('Please enter a name and message');
            }else{
                    client.emit('output', [data]);
                    sendStatus({
                        clear:true
                    })
            }
        })


        socket.on('clear', function(data){
            // remove all chats from collection
            chat_history.remove({}, function(){
            //emit cleared
                socket.emit('cleared')
            })
        });

        socket.on('logout', function(data){
            let name = data.name;
            let message = data.message;
            let date = data.date;
            let room = data.room;

            console.log(name)
            console.log(message)
            console.log(room)
                
            if( name == '' || message == '' || date == '' || room == ''){
                //sendStatus('Please enter a name and message');
                console.log("Empty")
            }else{
                chat_history.insertOne({name:name, message: message, date: date, room: room}, function(){
                    client.emit('output', [data]);
                    sendStatus({
                        clear:true
                    })
                })
            }
         })
     
    })
});

