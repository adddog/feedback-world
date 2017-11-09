import Peer from 'peerjs-client'
import Config from './config'

export default () => {
  var peer = new Peer(Config.id, {
    key: 'myapikey',
    host: Config.host,
    path: "api",
    secure: false
  });

peer.on('connection', function(conn) {
  conn.on('data', function(data){
    // Will print 'hi!'
    console.log(data);
  });
});

  return peer
}
