
window.addEventListener('load', () => {

  const obs = new OBSWebSocket()

  const scanQRCode = document.getElementById('scan-qr-code')
  const obsPort = document.getElementById('obs-port')
  const obsPassword = document.getElementById('obs-password')
  const connect = document.getElementById('submit')
  const results = document.getElementById('results')
  const sceneList = document.getElementById('scene-list')
  const currentScene = document.getElementById('current-scene')
  const sceneItems = document.getElementById('scene-items')
  const disableSource = document.getElementById('disable-source')
  const specialInputs = document.getElementById('special-inputs')
  const toggleMic = document.getElementById('toggle-mic')
  const toggleDesktopAudio = document.getElementById('toggle-desktop-audio')
  const changeScene = document.getElementById('change-scene')
  const transform = document.getElementById('transform')
  const screenshot = document.getElementById('screenshot')
  const image = document.getElementById('image')
  const stopScreenshotButton = document.getElementById('stop-screenshot')

  scanQRCode.addEventListener('click', readQRCode)
  connect.addEventListener('click', conectar)
  sceneList.addEventListener('click', getSceneList)
  currentScene.addEventListener('click', getCurrentScene)
  sceneItems.addEventListener('click', getSceneItems)
  disableSource.addEventListener('click', setDisableSource)
  specialInputs.addEventListener('click', getSpecialInputs)
  toggleMic.addEventListener('click', setToggleMic)
  toggleDesktopAudio.addEventListener('click', setToggleDesktopAudio)
  changeScene.addEventListener('click', setChangeScene)
  transform.addEventListener('click', transformItem)
  screenshot.addEventListener('click', getScreenshot)
  stopScreenshotButton.addEventListener('click', stopScreenshot)


  async function readQRCode() {
    let htmlscanner = new Html5QrcodeScanner("my-qr-reader", { fps: 10 /*, qrbox: 250 */ });
    htmlscanner.render(onScanSuccess);

    function onScanSuccess(decodeText, decodeResult) {
      if (!decodeText.startsWith("obsws://")) {
        alert("This is not a valid obs-websocket QRCode");
        console.log(decodeResult)
        return
      }
      console.log(decodeText.split('/')[2].split(':')[1])
      obsPort.value = decodeText.split('/')[2].split(':')[1];
      obsPassword.value = decodeText.split('/')[3];
      conectar()
      console.log(decodeResult)
      htmlscanner.clear();
      const button = document.createElement("button")
      button.id = "scan-qr-code"
      const text = "Scan another QR Code"
      button.textContent = text
      document.getElementById("my-qr-reader").appendChild(button)
      document.getElementById("scan-qr-code").addEventListener('click', readQRCode)
    }
  }

  async function conectar() {
    // Connect to OBS
    await obs.connect(`ws://localhost:${obsPort.value}`, `${obsPassword.value}`)
      .then(async () => {
        const version = await obs.call('GetVersion')
        results.innerHTML = `Connected to OBS ${version.obsVersion} on port ${obsPort.value} using WebSocket version ${version.obsWebSocketVersion}. \nOperational System: ${version.platformDescription}`
        connect.style.backgroundColor = 'green'
        console.log(`Connected to OBS on port ${obsPort.value}...`);

        console.log(version)
      }).catch((error) => {
        results.innerHTML = `Error connecting to OBS: ${error}`
        console.log(`Error connecting to OBS: ${error}`);
      })
  }

  // Get Scene list and send the output to cl1p.net
  async function getSceneList() {
    const getSceneList = await obs.call('GetSceneList');
    results.innerHTML = JSON.stringify(getSceneList.scenes, null, 2)
    console.log(`Total scenes amount: ${getSceneList.scenes.length}`)
    console.log('List of scenes:', getSceneList.scenes)

    sendToCl1p(getSceneList)
  }

  // Send the output to cl1p, which is like a notepad website, but with an API so you can send text programatically
  // More info: https://cl1p.net/sys/api.jsp
  async function sendToCl1p(data) {
    const information = JSON.stringify(data, null, 2)

    const cl1pFetch = await fetch('https://api.cl1p.net/clipname', {
      'method': 'POST',
      'mode': 'no-cors',
      'headers': {
        'content-type': 'text/html; charset=UTF-8',
        'cl1papitoken': 'YOUR_CL1P_API_TOKEN'
      },
      'body': information
    })
    console.log(cl1pFetch)
  }

  // Get Current Scene
  async function getCurrentScene() {
    const getCurrentScene = await obs.call('GetCurrentProgramScene');
    results.innerHTML = getCurrentScene.currentProgramSceneName
    console.log('Current scene: ', getCurrentScene.currentProgramSceneName)
  }

  // Sources of a scene. Put the name of the scene into the variable 'chosenScene'. I.e.: 'Game'
  async function getSceneItems() {
    const chosenScene = 'Game'
    const getSceneItems = await obs.call('GetSceneItemList', { sceneName: chosenScene })
    results.innerHTML = JSON.stringify(getSceneItems.sceneItems, null, 2)
    console.log(getSceneItems.sceneItems)
  }

  // Enable / Disable source. Put the name of the scene into the variable 'chosenScene'. I.e.: 'Just Chatting'
  async function setDisableSource() {
    const chosenScene = 'Just Chatting'
    if (results.innerHTML === 'Item disabled') {
      await obs.call('SetSceneItemEnabled', { sceneName: chosenScene, sceneItemId: 6, sceneItemEnabled: true })
      results.innerHTML = 'Item enabled'
      return
    }
    await obs.call('SetSceneItemEnabled', { sceneName: chosenScene, sceneItemId: 6, sceneItemEnabled: false })
    results.innerHTML = 'Item disabled'
  }

  // Get Inputs like 'Desktop Audio', 'Mic/Aux' or any other item from Audio Mixer dock
  async function getSpecialInputs() {
    const itemName = 'Mic/Aux'
    const getInputSettings = await obs.call('GetInputList', { inputName: itemName })
    results.innerHTML = JSON.stringify(getInputSettings, null, 2)
    console.log(getInputSettings)
    // const getSpecialInputs = await obs.call('GetSpecialInputs')
    // results.innerHTML = JSON.stringify(getSpecialInputs, null, 2)
  }


  // Mute / unmute microphone. Usually the mic is the item called 'Mic/Aux', but you can change it to reflect yours.
  async function setToggleMic() {
    const itemName = 'Mic/Aux'
    const isMuted = await obs.call('GetInputMute', { inputName: itemName })
    if (isMuted.inputMuted) {
      await obs.call('SetInputMute', { inputName: itemName, inputMuted: false })
      results.innerHTML = 'Mic unmuted'
      return
    }
    await obs.call('SetInputMute', { inputName: itemName, inputMuted: true })
    results.innerHTML = 'Mic muted'
  }

  // Mute / Unmute Desktop audio
  async function setToggleDesktopAudio() {
    const itemName = 'Desktop Audio'
    const isMuted = await obs.call('GetInputMute', { inputName: itemName })
    if (isMuted.inputMuted) {
      await obs.call('SetInputMute', { inputName: itemName, inputMuted: false })
      results.innerHTML = 'Audio unmuted'
      return
    }
    await obs.call('ToggleInputMute', { inputName: itemName, inputMuted: true })
    results.innerHTML = 'Audio muted'
  }

  // Change to scene and show the current scene
  async function setChangeScene() {
    const changeToScene = 'Just Chatting'
    await obs.call('SetCurrentProgramScene', { sceneName: changeToScene })
    getCurrentScene()
  }

  // Transform an item (aka 'Sources' in OBS). You can change position, size or any other value related to that.
  // You can use the function getSceneItems() to obtain the ID of the items/sources
  async function transformItem() {
    const nameOfScene = 'Game'
    const sourceId = 10
    const position = await obs.call('GetSceneItemTransform', { sceneName: nameOfScene, sceneItemId: sourceId })
    console.log(position.sceneItemTransform.positionX)
    if (position.sceneItemTransform.positionX > 100) {
      await obs.call('SetSceneItemTransform', { sceneName: nameOfScene, sceneItemId: sourceId, sceneItemTransform: { positionX: 50 } })
      results.innerHTML = JSON.stringify(position, null, 2)
      //position = 50
      return
    }
    await obs.call('SetSceneItemTransform', { sceneName: nameOfScene, sceneItemId: sourceId, sceneItemTransform: { positionX: 1920 - position.sceneItemTransform.sourceWidth - 30 } })
    results.innerHTML = JSON.stringify(position, null, 2)
    console.log(position)
  }

  // Take screenshot. In the example below, it is taking a screenshot every 2000 milisseconds (2 seconds)
  async function getScreenshot() {
    const sceneName = 'Just Chatting'
    results.style.display = 'none'
    screenshotInterval = setInterval(async () => {
      const getScreenshot = await obs.call('GetSourceScreenshot', { sourceName: sceneName, imageFormat: "jpeg", imageWidth: 640, imageHeight: 400, imageCompressionQuality: 1 })
      image.src = getScreenshot.imageData
      //console.log(image)
    }, 2000)
  }

  // Stop taking screenshot. We got the ID of the setInterval function above to clear it on screenshotInterval variable.
  async function stopScreenshot() {
    clearInterval(screenshotInterval)
    console.log(screenshotInterval)
    console.log("screenshot paused")
    image.src = ""
    //obs.call('TriggerHotkeyByKeySequence', {
    //  keyId: 'OBS_KEY_Z',
    //  keyModifiers: {
    //    control: true
    //  }
    //})
  }

  // Not related to OBS websocket. 
  // Show a loudspeaker image when button 4 from your mouse is pressed (usually the lateral button from gaming mice).
  document.addEventListener('mousedown', (event) => {
    if (event.button === 4) {
      //console.log(`key=${event.key},code=${event.code}`);
      results.style.display = 'none'
      image.src = './loudspeaker.png'
      console.log('Mouse button pressed: ', event.button)
    }
  });

  // Not related to OBS websocket
  // When mouse button 4 is released, hide the loudspeaker image.
  document.addEventListener('mouseup', (event) => {
    if (event.button === 4) {
      //console.log(`key=${event.key},code=${event.code}`);
      image.src = ''
      results.style.display = 'block'
      console.log('Mouse button released: ', event.button)
    }
  });

})
