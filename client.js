import "./console.js";
$("form").on("submit", function(event) {
  event.preventDefault();
  const code = $("#codes").val();
  if (!code)
    return;
  console.log("sending code", code);
  const loadInterval = setInterval(() => {
    $("#submit").val((_, t) => {
      if (t.length == 3)
        return ".";
      return t + ".";
    });
  }, 170);
  const failedAttempt = function() {
    $("#submit").val("Invalid");
    setTimeout(() => {
      $("#submit").css({
        background: "",
        borderColor: ""
      });
      clearInterval(loadInterval);
      $("#submit").val("Submit");
    }, 490);
  };
  $("#codes").val("");
  $("#submit").css({
    background: "rgb(154 63 63)",
    borderColor: "rgb(89 26 26)"
  });
  $("#submit").val(".");
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === XMLHttpRequest.DONE) {
      var status = xhttp.status;
      if (status === 0 || status >= 200 && status < 400) {
        resolveAnswer(JSON.parse(this.responseText));
      } else {
        failedAttempt();
      }
    }
  };
  xhttp.timeout = 1500;
  xhttp.ontimeout = function() {
    failedAttempt();
  };
  xhttp.open("POST", "/submitCode");
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify({code}));
});
import MatrixCanvas from "./components/MatrixCanvas.js";
const matrixElement = MatrixCanvas.new({fontSize: 12, refreshRate: 33});
document.getElementById("content-wrap").appendChild(matrixElement);
var matrix = "abcdefghijklmnopqrstuvwxyz".split("");
function resolveAnswer(answer) {
  $("form").animate({height: "toggle", opacity: "toggle"}, 300);
  (function revealStep(content, callback) {
    const textElement = document.getElementsByTagName("h3")[0];
    let [revealed, gibberish, concealed] = Array.from(textElement.childNodes).map((node) => node.textContent || "");
    if (revealed === void 0)
      return;
    if (gibberish === void 0) {
      concealed = revealed;
      revealed = "";
      gibberish = "";
    } else if (concealed === void 0) {
      if (revealed !== "content") {
        concealed = gibberish;
        gibberish = revealed;
        revealed = "";
      } else {
        concealed = "";
      }
    }
    if (revealed === "" && gibberish.length < 3) {
      gibberish += matrix[Math.floor(Math.random() * matrix.length)];
      concealed = concealed.substring(1);
    } else if (revealed !== content || concealed !== "") {
      revealed = content.substring(0, revealed.length + 1);
      concealed = concealed.substring(1);
    } else {
      gibberish = gibberish.substring(1);
    }
    if (revealed === content && gibberish === "" && concealed === "") {
      textElement.innerHTML = revealed;
      callback();
    } else {
      textElement.innerHTML = `<span>${revealed}</span><span class="gibberish">${gibberish}</span><span>${concealed}</span>`;
      setTimeout(() => revealStep(content, callback), 200);
    }
  })(answer.content, () => {
    $(".clear").text(answer.header);
    $(".gibberish").text((_index, text) => text.substring(answer.header.length));
    $("title").removeClass("gibberish");
    $("title").text(answer.title);
  });
}
function randomizeOne(text) {
  const randomChar = matrix[Math.floor(Math.random() * matrix.length)];
  const randomIndex = Math.floor(Math.random() * text.length);
  text = text.substr(0, randomIndex) + randomChar + text.substr(randomIndex + 1, text.length - 1);
  return text;
}
$(".gibberish").text("hermatrix");
function setGibberishInterval() {
  return setInterval(function() {
    $(".gibberish").text((_index, text) => randomizeOne(text));
  }, 80);
}
function clearGibberishInterval() {
  clearInterval(gibberishInterval);
}
var gibberishInterval = setGibberishInterval();
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    gibberishInterval = setGibberishInterval();
  } else {
    clearGibberishInterval();
  }
});
