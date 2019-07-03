import React from 'react';
import openSocket from 'socket.io-client';
import $ from 'jquery';


class App extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            connect: { status: false, type: null }
        }
		this.onConnect = this.onConnect.bind(this);
		this.onChoose = this.onChoose.bind(this);
    }

    onConnect() {
        let _position = this.state.connect.type;
        console.log(_position);
        // WebRTC
        let namespace = 'space';
        let link = 'tensy.org';
        const socket_io = openSocket( link + namespace);

        const stun = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
        const peer = new RTCPeerConnection(stun);

        let yourDescription;
        let otherDescription;
        let yourCandidate;
        let newCandidate;
        let candidatee;

        function addcandidate(_data,_type) {
        	console.log(_type, _data);

        	setTimeout(function() {
        		if (candidatee) {
        			console.log('CONNECT', candidatee);
                    document.getElementById('connect').classList.remove('fa-error');
                    document.getElementById('connect').classList.add('fa-success');
        			peer.addIceCandidate(JSON.parse(candidatee));
        		} else {
        			addcandidate(candidatee,_type);
        		}
        	}, 10);
        }

        //student
        if(_position === 'Student') {
            localStorage.setItem(this.props.user.id, 'host');
            peer.onicecandidate = e => {
            	if(e.candidate && localStorage.getItem(this.props.user.id) === 'host' && e.candidate.type === localStorage.getItem(this.props.user.id)) {
                    localStorage.setItem(this.props.user.id, 'srflx');
            		yourCandidate = e.candidate;
            		socket_io.emit('cand1', {description: JSON.stringify(yourCandidate)});
            	} else if(e.candidate && localStorage.getItem(this.props.user.id) === 'srflx' && e.candidate.type === localStorage.getItem(this.props.user.id)) {
                    localStorage.setItem(this.props.user.id, 'none');
            		yourCandidate = e.candidate;
            		socket_io.emit('cand1', {description: JSON.stringify(yourCandidate)});
                }
            }

            navigator.mediaDevices.getUserMedia({ video:true, audio:true })
            .then(stream => {
            	const video_local = document.getElementById("local");
                video_local.autoplay = true;
                video_local.muted = true;
                video_local.srcObject = stream;
            	peer.addStream(stream);
            	return peer.createOffer();
            })
            .then(offer => {
            	peer.setLocalDescription(new RTCSessionDescription(offer));
            	yourDescription = peer.localDescription;
            	socket_io.emit('call', {description: JSON.stringify(yourDescription)});
            })

            peer.ontrack = e => {
            	document.getElementById("remote").srcObject = e.streams[0];
            }

            $(document).ready(function() {
            	socket_io.on('answer', function(mes) {
            		peer.setRemoteDescription(JSON.parse(mes['description']))
            		.then(() => addcandidate(candidatee,'teacher'))
            	});

            	socket_io.on('cand2', function(mes) {
            		candidatee = mes['description'];
            	});
            });
        } else {
            //teacher
            peer.onicecandidate = e => {
            	if(e.candidate && e.candidate.type === 'srflx') {
            		yourCandidate = e.candidate;
            		socket_io.emit('cand2', {description: JSON.stringify(yourCandidate)});
            	}
            }
            $(document).ready(function() {
            	socket_io.on('call', function(mes) {
            		navigator.mediaDevices.getUserMedia({ video:true, audio:true })
            		.then(stream => {
                        const video_local = document.getElementById("local");
                        video_local.autoplay = true;
                        video_local.muted = true;
                        video_local.srcObject = stream;
            			peer.addStream(stream);
            			peer.setRemoteDescription(JSON.parse(mes['description']));
            		})
            		.then(() => addcandidate(candidatee,'student'))
            		.then(() => peer.createAnswer())
            		.then(answer => {
            			peer.setLocalDescription(new RTCSessionDescription(answer));
            			yourDescription = peer.localDescription;
            			socket_io.emit('answer', {description: JSON.stringify(yourDescription)});
            		})

            		peer.ontrack = e => {
            			document.getElementById("remote").srcObject = e.streams[0];
            		}
            	});
            	socket_io.on('cand1', function(mes) {
            		candidatee = mes['description'];
            	});
            });
        }
    }
    onChoose(_type) {
        this.setState({ connect: { status: true, type: _type } });
        setTimeout(()=>{
            this.onConnect();
        }, 1000)
    }


    render() {
        return (
            <div id="videos">
                {this.state.connect.status ?
                    <div className="videos">
                        <video id="local" autoPlay></video>
                        <video id="remote" autoPlay></video>
                    </div>
                    :
                    <div className="panel">
                        <div className="option" onClick={()=>{this.onChoose('Teacher')}}>Teacher</div>
                        <div className="option" onClick={()=>{this.onChoose('Student')}}>Student</div>
                    </div>
                }
            </div>
        );
    }
}

export default App;
