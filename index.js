
window.addEventListener('load', () => {

  const obs = new OBSWebSocket()

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
  const pararScreenshotButton = document.getElementById('parar-screenshot')

  
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
  pararScreenshotButton.addEventListener('click', pararScreenshot)



  async function conectar() {
    // Connect to OBS to OBS
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

  // Lista de cenas
  async function getSceneList() {
    const getSceneList = await obs.call('GetSceneList');
    results.innerHTML = JSON.stringify(getSceneList.scenes, null, 2)
    console.log(`Total scenes amount: ${getSceneList.scenes.length}`)
    console.log('List of scenes:', getSceneList.scenes)
	
	sendToCl1p(getSceneList)
	
	async function sendToCl1p(data) {
	  const information = JSON.stringify(data, null, 2)
    
    const cl1pFetch = await fetch('https://api.cl1p.net/clipname', { //https://cl1p.net/sys/api.jsp
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
	
	
  }

  // Cena atual
  async function getCurrentScene() {
    const getCurrentScene = await obs.call('GetCurrentProgramScene');
    results.innerHTML = getCurrentScene.currentProgramSceneName
    console.log('Current scene: ', getCurrentScene.currentProgramSceneName)
  }

  // Fontes de uma cena
  async function getSceneItems() {
    const getSceneItems = await obs.call('GetSceneItemList', { sceneName: 'Jogo' })
    results.innerHTML = JSON.stringify(getSceneItems.sceneItems, null, 2)
    console.log(getSceneItems.sceneItems)
  }

  // Habilitar/desabilitar fonte
  async function setDisableSource() {
    if (results.innerHTML === 'Item disabled') {
      await obs.call('SetSceneItemEnabled', { sceneName: 'Just Chatting', sceneItemId: 6, sceneItemEnabled: true })
      results.innerHTML = 'Item enabled'
      return
    }
    await obs.call('SetSceneItemEnabled', { sceneName: 'Just Chatting', sceneItemId: 6, sceneItemEnabled: false })
    results.innerHTML = 'Item disabled'
  }

  async function getSpecialInputs() {
	const getInputSettings = await obs.call('GetInputList', {inputName: 'Mic/Aux'})
	results.innerHTML = JSON.stringify(getInputSettings, null, 2)
	console.log(getInputSettings)
    // const getSpecialInputs = await obs.call('GetSpecialInputs')
	// results.innerHTML = JSON.stringify(getSpecialInputs, null, 2)
  }


  // Mutar/desmutar microfone
  async function setToggleMic() {
    const isMuted = await obs.call('GetInputMute', { inputName: "Mic/Aux" })
    if (isMuted.inputMuted) {
      await obs.call('SetInputMute', { inputName: "Mic/Aux", inputMuted: false })
      results.innerHTML = 'Mic unmuted'
      return
    }
    await obs.call('SetInputMute', { inputName: "Mic/Aux", inputMuted: true })
    results.innerHTML = 'Mic muted'
  }

  // Mutar/desmutar desktop audio
  async function setToggleDesktopAudio() {
    const isMuted = await obs.call('GetInputMute', { inputName: "Desktop Audio" })
    if (isMuted.inputMuted) {
      await obs.call('SetInputMute', { inputName: "Desktop Audio", inputMuted: false })
      results.innerHTML = 'Audio unmuted'
      return
    }
    await obs.call('ToggleInputMute', { inputName: "Desktop Audio", inputMuted: true })
    results.innerHTML = 'Audio muted'
  }

  // Trocar de cena
  async function setChangeScene() {
    await obs.call('SetCurrentProgramScene', { sceneName: "Just Chatting" })
    getCurrentScene()
  }

  // Transform
  async function transformItem() {
    const position = await obs.call('GetSceneItemTransform', { sceneName: "Jogo", sceneItemId: 10 })
    console.log(position.sceneItemTransform.positionX)
    if (position.sceneItemTransform.positionX > 100) {
      await obs.call('SetSceneItemTransform', { sceneName: "Jogo", sceneItemId: 10, sceneItemTransform: { positionX: 50 } })
      results.innerHTML = JSON.stringify(position, null, 2)
      //position = 50
      return
    }
    await obs.call('SetSceneItemTransform', { sceneName: "Jogo", sceneItemId: 10, sceneItemTransform: { positionX: 1920 - position.sceneItemTransform.sourceWidth - 30 } })
    results.innerHTML = JSON.stringify(position, null, 2)
    console.log(position)
  }



  // Tirar screenshot
  async function getScreenshot() {
    results.style.display = 'none'
    screenshotInterval = setInterval(async () => {
      const getScreenshot = await obs.call('GetSourceScreenshot', { sourceName: "Just Chatting", imageFormat: "jpeg", imageWidth: 640, imageHeight: 400, imageCompressionQuality: 1 })
      image.src = getScreenshot.imageData
      //console.log(image)
    }, 200)
  }

  // Parar screenshot
  async function pararScreenshot() {
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


  document.addEventListener('mousedown', (event) => {
    if (event.button === 4) {
      //console.log(`key=${event.key},code=${event.code}`);
      results.style.display = 'none'
      image.src = './loudspeaker.png'
      console.log('Mouse button pressed: ', event.button)
    }
  });


  document.addEventListener('mouseup', (event) => {
    if (event.button === 4) {
      //console.log(`key=${event.key},code=${event.code}`);
      image.src = ''
      results.style.display = 'block'
      console.log('Mouse button released: ', event.button)
    }
  });

})