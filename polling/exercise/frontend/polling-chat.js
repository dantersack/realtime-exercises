const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

// let's store all current messages here
let allChat = [];

// the interval to poll at in milliseconds
const INTERVAL = 3000;

let failedTries = 0;
const BACKOFF = 5000;

// a submit listener on the form in the HTML
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMsg(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMsg(user, text) {
  // post to /poll a new message
  // write code here
  try {
    await fetch("/poll", {
      method: "POST",
      body: JSON.stringify({ user: user, text: text }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("an error occurred", error);
  }
}

async function getNewMsgs() {
  // poll the server
  // write code here
  let json;
  try {
    const res = await fetch("/poll");
    json = await res.json();
    console.log(json);
    console.log(res.status);

    if (res.status >= 400) {
      throw new Error("request did not succeed", res.status);
    }

    allChat = json.messages;
    render();
    failedTries = 0;
  } catch (error) {
    // backoff code
    console.error("an error occurred", error);
    failedTries++;
  }
}

function render() {
  // as long as allChat is holding all current messages, this will render them
  // into the ui. yes, it's inefficent. yes, it's fine for this example
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

// given a user and a msg, it returns an HTML string to render to the UI
const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

let timeToMakeNextRequest = 0;

// requestAnimationFrame Timer
async function rafTimer(time) {
  if (timeToMakeNextRequest <= time) {
    await getNewMsgs();
    // console.log({ perf: performance.now() });
    // console.log({ tml: document.timeline.currentTime });
    timeToMakeNextRequest =
      document.timeline.currentTime + INTERVAL + failedTries * BACKOFF;
  }

  requestAnimationFrame(rafTimer);
}

// make the first request
requestAnimationFrame(rafTimer);
