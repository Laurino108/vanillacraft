const allowedChars = ` abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.:,;'"()!?+-*/=`;
var localLocation = "/";
var UserID = Math.floor(Math.random() * (9999 - 1e3) + 1e3);
var hasAuthenticated = false;
var User = "";
var Password = "";
let UserUID = "-";
var loadingDotsCount = 1;
$.ajax({
  url: "/requestuid",
  async: true,
  success: (data) => {
    UserUID = data.userUID;
  },
  error: (_) => {
  }
});
$("#console").draggable();
$(document).on("dragstart", function(e) {
  var consoleEl = document.getElementById("console");
  if (consoleEl?.contains(e.target)) {
    if (consoleEl.classList.contains("consoleFocused")) {
      return;
    }
    consoleEl.classList.add("consoleFocused");
    $("#flash").addClass("flash");
  } else {
    consoleEl?.classList.remove("consoleFocused");
    $("#flash").removeClass("flash");
  }
});
$(document).on("click", function(e) {
  var consoleEl = document.getElementById("console");
  var buttonEl = document.getElementById("terminal-button");
  if (buttonEl?.contains(e.target)) {
    return;
  }
  if (consoleEl?.contains(e.target)) {
    setConsoleFocus(consoleEl, true);
  } else {
    setConsoleFocus(consoleEl, false);
  }
});
$("#terminal-button").on("click", () => {
  $("#console").toggle();
  const consoleEl = document.getElementById("console");
  if (consoleEl === void 0) {
    return;
  }
  if (consoleEl.style.display != "none") {
    setConsoleFocus(consoleEl, true);
  } else {
    setConsoleFocus(consoleEl, false);
  }
});
function setConsoleFocus(consoleEl, focus) {
  if (focus) {
    consoleEl.classList.add("consoleFocused");
    $("#flash").addClass("flash");
  } else {
    consoleEl.classList.remove("consoleFocused");
    $("#flash").removeClass("flash");
  }
}
function addKeyToConsole(key) {
  if (!allowedChars.includes(key)) {
    return;
  }
  const consoleInput = $("#console-input");
  const text = consoleInput.text();
  if (text.length < 255) {
    consoleInput.text(text + key);
  }
}
$(document).on("keydown", function(e) {
  if ($("#console").hasClass("consoleFocused")) {
    e.preventDefault();
    if (e.ctrlKey && e.key == "v") {
      navigator.permissions.query({name: "clipboard-read"}).then((result) => {
        if (result.state == "granted" || result.state == "prompt") {
          const clipboard = navigator.clipboard;
          clipboard.readText().then((data) => {
            data.split("").forEach((c) => {
              addKeyToConsole(c);
            });
          });
        }
      });
    } else if (allowedChars.includes(e.key)) {
      addKeyToConsole(e.key);
    } else {
      const consoleInput = $("#console-input");
      const text = consoleInput.text();
      switch (e.code) {
        case "Home":
        case "Escape":
          $("#console").hide();
          break;
        case "Delete":
        case "Backspace":
          consoleInput.text(text.slice(0, -1));
          break;
        case "Insert":
        case "Enter":
          sendConsoleCommand();
          break;
      }
    }
  }
});
function sendConsoleCommand() {
  const consoleInput = $("#console-input");
  const text = consoleInput.text();
  var newLine = $("<code />").addClass("green");
  newLine.text($("#location").text() + "> " + text);
  newLine.insertBefore("#console-input-container");
  consoleInput.text("");
  document.getElementById("console-input-container")?.scrollIntoView();
  sendCommand(text);
}
function sendCommand(command) {
  clientOnlyCommands(command.split(" "), localLocation, function() {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState === XMLHttpRequest.DONE) {
        const status = xhttp.status;
        if (status == 200) {
          if (!hasAuthenticated) {
            hasAuthenticated = true;
            setTimeout(() => {
              sendCommand("mod");
            }, 500);
          }
          consoleResponse(JSON.parse(this.responseText));
        } else if (status == 401) {
          consoleResponse({data: [{new: false, color: "red", content: "Invalid authentication"}], location: localLocation});
        } else if (status == 403) {
          consoleResponse({data: [{new: false, color: "red", content: "Access denied"}], location: localLocation});
        } else if (status == 429) {
          consoleResponse({data: [{new: false, color: "red", content: "You are being rate-limited. Please don't spam!"}], location: localLocation});
        } else {
          consoleFailed();
        }
      }
    };
    xhttp.timeout = 1e3;
    xhttp.ontimeout = function() {
      consoleFailed();
    };
    xhttp.open("POST", "/submitConsole");
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify({user: User, pass: Password, input: command, location: localLocation, userUID: UserUID}));
  });
}
function clientOnlyCommands(args, loc, callback) {
  if (!hasAuthenticated) {
    if (args[0] != null) {
      var args2 = args[0].split(":");
      User = args2[0] || "";
      Password = args2[1] || "";
    }
    callback();
    return;
  }
  var isClientOnly = false;
  switch (args[0]) {
    case "cls":
      $("#bye").children().each(function(_, e) {
        if (!$(e).hasClass("stay")) {
          e.remove();
        }
      });
      isClientOnly = true;
      break;
    case "date":
      consoleResponse({data: [{new: false, color: "pink", content: new Date().toLocaleDateString()}], location: loc});
      isClientOnly = true;
      break;
    case "echo":
      args.shift();
      consoleResponse({data: [{new: false, color: "pink", content: args.join(" ")}], location: loc});
      isClientOnly = true;
      break;
    case "archive":
      clientOnlyCommands(["cls"], loc, callback);
      consoleResponse({data: [{new: false, color: "pink", content: "<Grumbot.terminal> Loading hermatrix 1.4 log book"}], location: loc});
      sendLoadingDots();
      $("#console-input-container").hide();
      loadingDots(function() {
        $("#console-input-container").show();
        $(".loadingDots").remove();
        var br2 = document.createElement("br");
        var line2 = document.querySelector("#console-input-container");
        line2?.parentNode?.insertBefore(br2, line2);
        document.getElementById("console-input-container")?.scrollIntoView();
        callback();
      });
      isClientOnly = true;
      break;
    case "exit":
      $("#console").hide();
      $("#bye").children().each(function(_, e) {
        if (!$(e).hasClass("stay")) {
          e.remove();
        }
      });
      isClientOnly = true;
      break;
    case "hostname":
      consoleResponse({data: [{new: false, color: "pink", content: "Grumbot_SuperComputer"}], location: loc});
      isClientOnly = true;
      break;
    case "time":
      consoleResponse({data: [{new: false, color: "pink", content: Date.now().toString()}], location: loc});
      isClientOnly = true;
      break;
    case "title":
      args.shift();
      $("#console-title").text(args.join(" "));
      consoleResponse({data: [{new: false, color: "pink", content: ""}], location: loc});
      isClientOnly = true;
      break;
    case "user":
      consoleResponse({data: [{new: false, color: "pink", content: UserID.toString()}], location: loc});
      isClientOnly = true;
      break;
    case "version":
    case "ver":
      consoleResponse({data: [{new: false, color: "pink", content: "Hermatrix Version: v1.4"}], location: loc});
      isClientOnly = true;
      break;
    case "ping":
      if (args[1] != null) {
        var start = Date.now();
        ping(args[1], function(success) {
          if (success) {
            consoleResponse({data: [{new: false, color: "pink", content: "Success - " + (Date.now() - start).toString() + "ms"}], location: loc});
          } else {
            consoleResponse({data: [{new: false, color: "pink", content: "Timeout"}], location: loc});
          }
        });
      }
      isClientOnly = true;
      break;
    case "help":
      SingleConsoleResponse("Available commands:");
      SingleConsoleResponse(" - archive");
      SingleConsoleResponse(" - cls");
      SingleConsoleResponse(" - date");
      SingleConsoleResponse(" - echo <string>");
      SingleConsoleResponse(" - exit");
      SingleConsoleResponse(" - hostname");
      SingleConsoleResponse(" - time");
      SingleConsoleResponse(" - title <string>");
      SingleConsoleResponse(" - version");
      SingleConsoleResponse(" - ping <string>");
      SingleConsoleResponse(" - help");
      var br = document.createElement("br");
      var line = document.querySelector("#console-input-container");
      line?.parentNode?.insertBefore(br, line);
      document.getElementById("console-input-container")?.scrollIntoView();
      isClientOnly = true;
      break;
  }
  if (!isClientOnly) {
    callback();
  }
}
function loadingDots(callback) {
  setTimeout(function() {
    var LoadingDotsInst = $(".loadingDots");
    LoadingDotsInst.text(LoadingDotsInst.text() + ".");
    loadingDotsCount++;
    if (loadingDotsCount < 30) {
      loadingDots(callback);
    } else {
      callback();
    }
  }, 500);
}
function ping(ip, callback) {
  var timer = setTimeout(function() {
    callback(false);
  }, 1500);
  var img = new Image();
  img.onload = function() {
    clearTimeout(timer);
    callback(true);
  };
  img.onerror = function(_) {
    clearTimeout(timer);
    callback(false);
  };
  img.src = "http://" + ip;
}
function consoleResponse(consoleInfo) {
  if (consoleInfo.data.length >= 1) {
    var firstLine = consoleInfo.data.shift();
    if (firstLine !== void 0) {
      var newLine = $("<code />").addClass(firstLine.color);
      newLine.html(firstLine.content);
      newLine.insertBefore("#console-input-container");
      newLine.on("click", consoleLineClicked);
      for (let key in consoleInfo.data) {
        if (consoleInfo.data[key]?.new) {
          newLine = $("<code />").addClass(consoleInfo.data[key]?.color || "pink");
          newLine.html(consoleInfo.data[key]?.content || "");
          newLine.insertBefore("#console-input-container");
        } else {
          newLine.append("<span class='" + (consoleInfo.data[key]?.color || "pink") + "'>" + (consoleInfo.data[key]?.content || "") + "</span>");
        }
      }
    }
  }
  var br = document.createElement("br");
  var line = document.querySelector("#console-input-container");
  line?.parentNode?.insertBefore(br, line);
  document.getElementById("console-input-container")?.scrollIntoView();
  localLocation = consoleInfo.location;
  $("#location").text(localLocation);
}
function SingleConsoleResponse(str) {
  var newLine = $("<code />").addClass("pink");
  newLine.text(str);
  newLine.insertBefore("#console-input-container");
  return newLine;
}
function sendLoadingDots() {
  var newLine = $("<code />").addClass("pink").addClass("loadingDots");
  newLine.text(".");
  newLine.insertBefore("#console-input-container");
}
function consoleFailed() {
  var newLine = $("<code />").addClass("red");
  newLine.text("AN UNKNOWN ERROR HAS OCCURED!");
  newLine.insertBefore("#console-input-container");
  var br = document.createElement("br");
  var line = document.querySelector("#console-input-container");
  line?.parentNode?.insertBefore(br, line);
  document.getElementById("console-input-container")?.scrollIntoView();
}
$(".whatisthis").on("click", function() {
  console.log("Checking touch keyboard warning");
  if ("ontouchstart" in document.documentElement)
    alert("The terminal is unforunately not supported on touch-devices yet :(");
});
function consoleLineClicked(e) {
  if (e.target == null) {
    return;
  }
  const spanmod = document.getElementById("mod");
  if (spanmod?.contains(e.target)) {
    const keys = "hda".split("");
    console.log(keys);
    const addKey = (idx) => {
      if (idx < keys.length) {
        addKeyToConsole(keys[idx]);
        setTimeout(addKey, 250, ++idx);
      } else {
        sendConsoleCommand();
      }
    };
    addKey(0);
  }
}
export {clientOnlyCommands, ping, consoleResponse, SingleConsoleResponse, consoleFailed};
