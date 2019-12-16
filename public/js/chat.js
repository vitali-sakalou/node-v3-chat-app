const socket = io();

const messageForm = document.querySelector("#message-form");
const messageInput = messageForm.querySelector("input");
const messageButton = messageForm.querySelector("button");
const sendLocationButton = document.querySelector("#send-location");
const messages = document.querySelector("#messages");

//Templates
const messagesTemplate = document.querySelector("#messages-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const locationMessagesTemplate = document.querySelector(
  "#location-messages-template"
).innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  //New message element
  $newMessage = messages.lastElementChild;

  //height of the new nessage
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Visible height
  const visibleHeight = messages.offsetHeight;

  //height of messages container
  const containerHeight = messages.scrollHeight;

  //how far have I scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }

  console.log(
    "$newMessage",
    containerHeight - newMessageHeight <= scrollOffset
  );
};

socket.on("message", message => {
  console.log(message);
  const html = Mustache.render(messagesTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", url => {
  console.log("url", url);
  const html = Mustache.render(locationMessagesTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("h:mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  console.log(room, users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector("#sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", e => {
  e.preventDefault();
  messageButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, error => {
    messageButton.removeAttribute("disabled");
    messageInput.value = "";
    messageInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message delivered!");
  });
});

sendLocationButton.addEventListener("click", e => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(position => {
    console.log(position);
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude
      },
      () => {
        sendLocationButton.removeAttribute("disabled");
        console.log("Location shared!");
      }
    );
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
