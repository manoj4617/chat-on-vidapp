const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const sendbtn = document.getElementById("send-button");
const leave = document.getElementById("leave-meeting");
const part_list = document.getElementById("part-list");
const modal = document.getElementById("modal");
const span = document.getElementsByClassName("close")[0];
myVideo.muted = true;

var peer = new Peer(undefined, {
});

// path: "/peerjs",
//   host: "/",
//   port: 4000
let myVideoStream;
const peersJoined = {};
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

     document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", {
          message: chatInputBox.value,
          username: username
        });
        chatInputBox.value = "";
       }

     sendbtn.addEventListener('click', ()=>{
        if(chatInputBox.value != ""){
          socket.emit("message", {
            message: chatInputBox.value,
            username: username
          });
          chatInputBox.value = "";
        }
      })
    });

    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = '<p><strong>'+msg.username +' : </strong>' + msg.message+ '</p>';
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    })
  })
 
  
  socket.on('user-disconnected', userId => {
      if (peersJoined[userId]) peersJoined[userId].close()
  })
  



peer.on("call", function (call) {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  //console.log(call);
  var video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    //console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  })
  call.on('close',()=>{
    video.remove()
  })
  peersJoined[userId] = call;
  console.log(userId)
}

const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });
  
  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};

// for(p in peersJoined){
//   console.log(p);
// }

//popup window for participants
const openModalButtons = document.querySelectorAll('[data-modal-target]')
const closeModalButtons = document.querySelectorAll('[data-close-button]')
const overlay = document.getElementById('overlay')

const openModal = (modal) => {
  if (modal == null) return
  modal.classList.add('active')
  overlay.classList.add('active')
}

openModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = document.querySelector(button.dataset.modalTarget)
    if(Object.keys(peersJoined).length){
      for(p in peersJoined){
        const node = document.createElement("li");
        const textnode = document.createTextNode(p);
        node.appendChild(textnode);
        document.querySelector(".modal-body").appendChild(node)
      }
    }
    else{
      const node = document.createElement("h3");
      node.innerHTML = "You're alone here!!!"
      document.querySelector(".modal-body").appendChild(node)
    }
    openModal(modal)
  })
})

overlay.addEventListener('click', () => {
  const modals = document.querySelectorAll('.modal.active')
  modals.forEach(modal => {
    const plist = document.querySelector('.modal-body');
    while(plist.firstChild){
      plist.removeChild(plist.firstChild);
    }
    closeModal(modal)
  })
})

closeModalButtons.forEach(button => {
  button.addEventListener('click', () => {
    const modal = button.closest('.modal')
    const plist = document.querySelector('.modal-body');
    while(plist.firstChild){
      plist.removeChild(plist.firstChild);
    }
    closeModal(modal)
  })
})

const closeModal = (modal) =>{
  if (modal == null) return
  modal.classList.remove('active')
  overlay.classList.remove('active')
}

