var audio = {};
var frequencyBuffer, frequencyBuffer2;
var biquadFilter = {};
var bufferLength;
var audioEnable = false;
var analyserType = "byte"; // byte, float
var fftSize = 4096;
var sampleRate = 48000;

function getMicrophone() {
  function onError(res) {
    console.log("callback res:", res);
  }
  function onSuccess(stream) {
    audioEnable = true;
    audio.stream = stream;

    var myAudioContext = new window.AudioContext();

    document.querySelector("#sampleRate").value = myAudioContext.sampleRate;
    sampleRate = myAudioContext.sampleRate;

    audio.gainNode = myAudioContext.createGain();
    audio.gainNode.gain.value = 5;

    audio.source = myAudioContext.createMediaStreamSource(stream);

    audio.analyser = myAudioContext.createAnalyser();
    audio.analyser.minDecibels = -90;
    audio.analyser.maxDecibels = -10;
    audio.analyser.fftSize = fftSize;
    //     audio.analyser.smoothingTimeConstant = 0; //0 to 1, default is 0.8;

    bufferLength = audio.analyser.frequencyBinCount;

    switch (analyserType) {
      case "byte":
        frequencyBuffer = new Uint8Array(bufferLength);
        break;
      case "float":
        frequencyBuffer = new Float32Array(bufferLength);
        break;
    }

    // Connect speaker to audio source
    audio.source.connect(audio.analyser);
    audio.analyser.connect(audio.gainNode);
    audio.gainNode.connect(myAudioContext.destination);

    drawFreqDomain();
  }
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(onSuccess)
    .then(onError);
}

function stop() {
  audioEnable = false;
  // audio.stream.stop();
  audio.stream.getAudioTracks()[0].stop();
}

function mute() {
  audio.stream.getAudioTracks()[0].enabled =
    !audio.stream.getAudioTracks()[0].enabled;
}

function changeVolume() {
  audio.gainNode.gain.value = Number(
    document.querySelector("#gainNodeVolume").value
  );
}

//-----------------Canvas start-------------------
var freqDomainCell = {};
var timeDomainCell = {};

function initCanvas() {
  freqDomainCell.canvas = document.getElementById("freqDomain");
  freqDomainCell.ctx = freqDomainCell.canvas.getContext("2d");
  freqDomainCell.canvas.width = 600;
  freqDomainCell.canvas.height = 200;
}

function drawFreqDomain() {
  freqDomainCell.ctx.clearRect(
    0,
    0,
    freqDomainCell.canvas.width,
    freqDomainCell.canvas.height
  );
  if (!audioEnable) return;

  switch (analyserType) {
    case "byte":
      audio.analyser.getByteFrequencyData(frequencyBuffer);
      break;
    case "float":
      audio.analyser.getFloatFrequencyData(frequencyBuffer);
      break;
  }

  var barWidth = (freqDomainCell.canvas.width / bufferLength) * 2.5;
  var barHeight;
  var x = 0;

  var freqStep = sampleRate / fftSize;
  document.querySelector("#maxFreq").value =
    frequencyBuffer.indexOf(Math.max(...frequencyBuffer)) * freqStep;

  for (var i = 0; i < bufferLength; i++) {
    barHeight = frequencyBuffer[i];

    freqDomainCell.ctx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
    freqDomainCell.ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
    freqDomainCell.ctx.fillRect(
      x,
      freqDomainCell.canvas.height - barHeight / 2,
      barWidth,
      barHeight / 2
    );

    x += barWidth + 1;
  }

  window.requestAnimationFrame(drawFreqDomain);
}

initCanvas();
// animeloop();
//-----------------Canvas end---------------------
