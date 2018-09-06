import uuid from 'uuid'
import { mat4 } from 'gl-matrix'
import QS from 'query-string'
import LocalMedia from 'localmedia'
import sono from 'sono'
import Socket from 'common/socket'
import Regl from 'desktop/regl'
import GeometryInteraction from 'desktop/regl/geometry-interaction'
import DesktopInteraction from 'desktop/interaction'
import AppEmitter from 'common/emitter'
import MSRecorder from 'desktop/recording/mediaStreamRecorder'
import Facebook from 'desktop/media/facebook'
import Instagram from 'desktop/media/instagram'
import Webcam from 'desktop/media/webcam'
import ObserveViewer from 'desktop/media/observe'
import Record from 'desktop/recording/record'
import Recorder from 'desktop/recording/soundRecorder'
import Sound from 'desktop/recording/sound'
import Gui from 'common/gui'
import Server from 'common/server'
import { first, last, find, map, findIndex, filter, flatten, compact } from 'lodash'
import { cover, contain } from 'intrinsic-scale'
import loop from 'raf-loop'
import {
  IS_MOBILE,
  IS_DEV,
  M_SCREEN_ORIEN,
  M_DEVICE_MOTION,
  M_DEVICE_ORIEN,
  M_SCREEN_SIZE,
  WIDTH,
  HEIGHT,
  KEY_W,
  KEY_H,
  ALPHA_SENS,
  AUDIO_EXP,
  AUDIO_EXP_TYPE,
  FUDGE_VIDEO_DELAY,
  RECORD_FRAMES_DELAY,
  FPS,
  FPS_I,
  hasPeer,
  findPeer,
  numberDesktops,
  logError,
  logInfo,
  logInfoB,
  logSuccess,
  postMsg,
  createVideoElFromStream,
} from 'common/constants'

const Desktop = (webrtc, state, emitter) => {
  if (IS_MOBILE) return

  const peers = new Set()
  const peerIds = new Map()

  const localData = {
    id: null,
    uuid: webrtc.config.nick.uuid,
  }

  const remoteDesktopPeer = {
    peer: null,
    id: null,
  }
  const remoteDesktopVideo = {
    isReady: false,
    el: null,
    targetKey: null,
  }

  const keyVideo = {
    isReady: false,
    el: null,
    targetKey: null,
  }

  const createPairedMobile = (data = {}) => ({
    el: null,
    secret: null,
    targetKey: null,
    id: null,
    peer: null,
    engaged: false,
    isReady: false,
    ...data,
  })
  const pairedMobiles = [createPairedMobile()]

  const localmedia = new LocalMedia()
  localmedia.on('localStreamRequestFailed', () => {
    pairedMobiles.push(createPairedMobile())
  })
  localmedia.start({ video: true })

  const RENDERING_KEYS = ['mainVideo', 'keyVideo']
  const renderSettings = {
    single: false,
    multi: false,
    [RENDERING_KEYS[0]]: {
      isReady: false,
      el: null,
    },
    [RENDERING_KEYS[1]]: {
      isReady: false,
      el: null,
    },
  }

  const keyColors = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
  let isReady = false
  let _timeCounter = 0

  const videoEl = document.getElementById('localVideo')
  videoEl.setAttribute('muted', true)
  if (state.useWebcam) {
    videoEl.addEventListener('loadeddata', () => {
      logInfo(`local video ready`)
      setVideoToKey(videoEl)
    })
  }

  const remoteVideoEl = document.getElementById('remoteVideos')
  videoEl.style.display = 'none'
  remoteVideoEl.style.display = 'none'

  const roomEl = document.body.querySelector('.room')
  const canvasEl = document.getElementById('c_output')
  canvasEl.width = WIDTH
  canvasEl.height = HEIGHT

  const canvasKey = document.createElement('canvas')
  canvasKey.width = KEY_W
  canvasKey.height = KEY_H

  const reset = () => {
    interaction.removeKeyboardCommunication()
    localVideo.isReady = false
    isReady = false
    pairedMobiles.forEach(pairedMobile => (pairedMobile = createPairedMobile()))
  }

  const keyCtx = canvasKey.getContext('2d')

  const regl = Regl(canvasEl)
  const interaction = DesktopInteraction(webrtc, canvasEl)
  interaction.setOnFileDropped(urlBlob => {
    const video = document.createElement('video')
    video.setAttribute('autoplay', 'true')
    video.setAttribute('crossorigin', 'anonymous')
    video.setAttribute('muted', true)
    video.src = urlBlob
    setVideoToKey(video)
  })
  const webcam = Webcam(webrtc)
  const observeViewer = ObserveViewer()
  const instagram = Instagram(videoEl)
  const facebook = Facebook(videoEl)
  const sound = Sound()
  const record = Record()
  const geoInteraction = new GeometryInteraction(window)
  geoInteraction.on('mousemove', () => regl.setDesktopEyeMatrix(geoInteraction.lookAt))

  const send = (msg, payload) => webrtc.sendToAll(msg, payload)
  const sendChannel = (msg, payload) => webrtc.sendDirectlyToAll(state.room.id, msg, payload)

  //****************
  // INIT
  //****************

  const tryStarting = peerValues => {
    pairedMobiles.forEach(pairedMobile => {
      console.log(`tryStarting: pairedMobile.id: ${pairedMobile.id} pairedMobile.isReady: ${pairedMobile.isReady}`)
      if (pairedMobile.id && !pairedMobile.isReady) {
        console.log(`${peerValues.size} peers`)
        for (let peer of peerValues) {
          if (pairedMobile.id === peer.id) {
            console.log(`pairedMobile id ${pairedMobile.id} === peer id ${peer.id}`)

            pairedMobile.peer = peer

            /*************
             *  first time, no secret
             ************ */
            if (!pairedMobile.secret) {
              pairedMobile.secret = uuid.v4()
              Gui.secret = pairedMobile.secret
              send('local:desktop:secret', pairedMobile.secret)
              logInfo(`Created and sent new secret ${pairedMobile.secret}`)
            }

            if (!pairedMobile.peer.videoEl) return

            pairedMobile.engaged = true

            logInfo(`pairedMobile videoEl ready`)

            function _onProgress() {
              setPairedMobileReady(pairedMobile.peer.videoEl, peer.id)
              postMsg(`connected with your phone`)
              logSuccess(`localMobile playing!`)
              pairedMobile.peer.videoEl.removeEventListener('progress', _onProgress)
            }

            pairedMobile.peer.videoEl.addEventListener('progress', _onProgress)

            sound.init(peer.stream)
            logSuccess(`Start!`)
          } else {
            /*peer.stream.getVideoTracks().forEach(s => s.stop())
            peer.stream.getAudioTracks().forEach(s => s.stop())
            peer.videoEl.stop()
            peer.videoEl.style.display = "none"*/
          }
        }
      }
    })
  }

  /*************
   *  VALIDATE
   ************ */

  const pairedMobileLeftRoom = id => (getPairedMobile(id) ? (pairedMobiles[findIndex(pairedMobiles, { id })] = createPairedMobile()) : null)

  const isValidMobileKey = (key, value) => pairedMobiles.filter(pairedMobile => pairedMobile[key] === value).length === 1

  const getPairedSecretUsed = secret => (!!secret ? findIndex(pairedMobiles, { secret }) > -1 : false)

  const getPairedMobile = id => pairedMobiles.filter(pairedMobile => pairedMobile.id === id)[0]

  const acceptStreams = () => pairedMobiles.filter(({ isReady }) => !isReady).length

  const needsToForceMobile = () => pairedMobiles.length > 1 && pairedMobiles.filter(pairedMobile => !!pairedMobile.el).length > 1

  //****************
  // MEDIA STREAMS
  //****************

  const isPlayingMedia = () => keyVideo.isReady || pairedMobiles.filter(({ isReady }) => isReady).length

  const toggleMediaStream = (stream, enabled = false) => null
  //stream.getVideoTracks().forEach(t => (t.enabled = enabled))

  const createCanvasStream = () => {
    const stream = canvasEl.captureStream(FPS)
    webrtc.webrtc.localStreams.unshift(stream)
    //toggleMediaStream(false)
    logSuccess(`Created canvas stream (createCanvasStream) ${stream.id}. localStreams length: ${webrtc.webrtc.localStreams.length}`)
    /*const v = document.createElement("video")
    v.width = WIDTH
    v.height = HEIGHT
    v.srcObject = stream
    v.classList.add("canvas")
    document.body.appendChild(v)*/
  }

  const cancelStream = stream => {
    if (!stream) return
    stream.getTracks().forEach(track => track.stop())
    logError(`cancelStream ${stream.id}`)
  }

  const cancelStreamFromPeer = peer => {
    if (!peer) return
    if (!peer.stream) return
    cancelStream(peer.stream)
    logError(`cancelStreamFromPeer ${peer.id}`)
  }

  const stopWebcam = () => {
    //has webcam
    if (state.useWebcam && webrtc.webrtc.localStreams.length > 1) {
      webrtc.webrtc.stopStream(last(webrtc.webrtc.localStreams))
      webrtc.webrtc.localStreams.pop()
    }
    webcam.stop()
  }

  //**********************
  // HANDLE media
  //**********************

  const setPairedMobileReady = (el, id) => {
    const pairedMobile = getPairedMobile(id)
    pairedMobile.el = el
    pairedMobile.isReady = true
    pairedMobile.targetKey = addRenderingMedia(pairedMobile.el, 'mainVideo', needsToForceMobile())
    geoInteraction.enable(false)
    send('local:desktop:request:mesh')
  }

  const setVideoToKey = el => {
    keyVideo.el = el
    keyVideo.isReady = true
    keyVideo.targetKey = addRenderingMedia(keyVideo.el, 'keyVideo')
    logSuccess(`keyVideo.isReady ${true}`)
  }

  const stopKeyVideo = () => {
    keyVideo.isReady = false
    onVideoStopped(keyVideo.el)
  }

  const stopPairedMobile = id => {
    if (!id) {
      pairedMobiles.forEach(pairedMobile => (pairedMobile.isReady = false))
    } else {
      getPairedMobile(id).isReady = false
    }
  }

  const setRemoteDesktopStream = (el, id) => {
    remoteDesktopVideo.el = el
    remoteDesktopVideo.isReady = true
    // TODO
    const targetKey = keyVideo.isReady ? 'mainVideo' : 'keyVideo'
    // if (webcam.started) {
    //   stopWebcam();
    // }
    remoteDesktopVideo.targetKey = addRenderingMedia(remoteDesktopVideo.el, targetKey, true)
    logInfoB(`setRemoteDesktopStream() - targetKey: ${remoteDesktopVideo.targetKey}`)
  }

  const stopRemoteDesktopStream = () => {
    remoteDesktopVideo.isReady = false
    observeViewer.stop()
    if (remoteDesktopVideo.targetKey === 'keyVideo') {
      onVideoStopped(remoteDesktopVideo.el)
    }
  }

  const addRenderingMedia = (videoEl, targetKey, force = false) => {
    if (renderSettings[targetKey].isReady) {
      logError(`ALREADY RENDERING ON ${targetKey}, will slot into available spot. Force? ${force}`)
      if (!force) {
        return slotIntoRenderingMedia(videoEl)
      } else {
        onVideoStopped(renderSettings[targetKey].el)
      }
    }
    renderSettings[targetKey].el = videoEl
    renderSettings[targetKey].isReady = true
    if (renderSettings.single) {
      renderSettings.multi = true
    } else if (!renderSettings.single) {
      renderSettings.single = true
    }
    logInfo(`addRenderingMedia() - using ${targetKey}`)
    console.log(renderSettings)
    return targetKey
  }

  const onVideoStopped = videoEl => {
    if (renderSettings.mainVideo.el === videoEl) {
      renderSettings.mainVideo.el = null
      renderSettings.mainVideo.isReady = false
      renderSettings.multi = false
    } else if (renderSettings.keyVideo.el === videoEl) {
      renderSettings.keyVideo.el = null
      renderSettings.keyVideo.isReady = false
      renderSettings.multi = false
    }

    if (!renderSettings.multi && renderSettings.single) {
      renderSettings.single = true
    }
    logInfo(`onVideoStopped() - renderSettings:`)
    console.log(renderSettings)
  }

  const slotIntoRenderingMedia = videoEl => {
    const availableSlots = RENDERING_KEYS.filter(key => !renderSettings[key].isReady)
    const targetKey = first(availableSlots)
    logInfoB(`slotIntoRenderingMedia() - using ${targetKey}`)
    if (targetKey) {
      renderSettings[targetKey].isReady = true
      renderSettings[targetKey].el = videoEl
      if (availableSlots.length === 1) {
        logInfoB(`slotIntoRenderingMedia() - rendering multi`)
        renderSettings.multi = true
      } else {
        logInfoB(`slotIntoRenderingMedia() - rendering single`)
        renderSettings.single = true
      }
    } else {
      logError(`NO AVAILBLE PLACE FOR VIDEO EL`)
      return null
    }
    return targetKey
  }

  const connectToOtherDesktop = (peer, id) => {
    if (!peer) return
    remoteDesktopPeer.peer = peer
    remoteDesktopPeer.id = id || peer.id
    logSuccess(`connectToOtherDesktop ${remoteDesktopPeer.id}`)
  }

  const disconnectTromOtherDesktop = () => {
    logSuccess(`disconnectTromOtherDesktop ${remoteDesktopPeer.id}`)
    remoteDesktopPeer.peer = null
    remoteDesktopPeer.id = null
  }

  //***************
  // effecs

  const addKeyColor = color => {
    keyColors.push(color)
    keyColors.shift()

    AppEmitter.emit('local:addKeyColor', keyColors)
    send('local:desktop:addKeyColors', keyColors)

    var id = keyCtx.createImageData(KEY_W, KEY_H)

    for (var x = 0; x < id.width; x++) {
      const k = Math.floor((x / id.width) * keyColors.length)
      for (var y = 0; y < id.height; y++) {
        var index = (y * id.width + x) * 4
        id.data[index] = keyColors[k][0]
        id.data[index + 1] = keyColors[k][1]
        id.data[index + 2] = keyColors[k][2]
        id.data[index + 3] = 255
      }
    }

    keyCtx.putImageData(id, 0, 0)
  }

  //**************
  //**** MESSAGED
  //**************

  const pp = {
    x: 0,
    y: 0,
    z: 0,
  }
  const firstp = {
    x: 0,
    y: 0,
    z: 0,
  }

  function addListeners() {
    webrtc.connection.on('message', function(data) {
      switch (data.type) {
        /*
        from other desktops
        */
        case 'local:desktop:handshake': {
          const { secret, id, isPlayingMedia } = data.payload
          console.log(`Got desktop handshake from  ${data.from} mobile secret: ${secret}`)
          if (!peerIds.get(data.from)) {
            peerIds.set(data.from, {
              desktop: true,
              isPlayingMedia: isPlayingMedia,
              id: data.from,
            })
            logInfo(`Set peer ${data.from}`)
          }

          const numDesktops = numberDesktops(peerIds.values())

          logInfo(`numDesktops ${numDesktops}`)

          interaction.addKeyboardCommunication()

          if (numDesktops) {
            const foundPeer = findPeer(peerIds.values(), data.from)
            connectToOtherDesktop(foundPeer, data.from)
          }

          break
        }
        /*
        createdPeer() on mobile sends
        */
        case 'local:mobile:hello': {
          logSuccess(`local:mobile:hello. Their id: ${data.from} `)
          sendHandshake()
          break
        }
        /*
        mobile gets handshake from desktop and send handshake back
        */
        case 'local:mobile:handshake': {
          const { secret, id } = data.payload

          logInfo(`local:mobile:handshake ${data.from} & secret: ${secret} pairedMobiles.length: ${pairedMobiles.length}`)
          console.log(pairedMobiles)
          pairedMobiles.forEach(pairedMobile => {
            console.log(
              `Got mobile handshake from  ${data.from} with secret ${secret} acceptStreams()?: ${acceptStreams()}.
              pairedMobile.secret: ${pairedMobile.secret}`,
            )
            if (!peerIds.get(data.from)) {
              peerIds.set(data.from, {
                desktop: false,
                id: data.from,
              })
              console.log(`\t peerIds was set ${data.from} ${JSON.stringify(Array.from(peerIds.values()))}`)
            }
            console.log('getPairedSecretUsed(secret)', getPairedSecretUsed(secret))
            if (secret && pairedMobile.secret) {
              console.log(`\t has payload ${secret} and local secret ${pairedMobile.secret}`)
              if (secret === pairedMobile.secret) {
                console.log(`\t payload secret matches local secret`)
                localData.id = id
                pairedMobile.id = data.from
                logSuccess(`localMobile peer id : ${pairedMobile.id}`)
                postMsg(`paired with your phone...`)
                tryStarting(peers.values())
              }
            } else if ((!pairedMobile.secret || (!secret && !pairedMobile.isReady)) && !getPairedSecretUsed(secret)) {
              console.log(`\t No local secret or no payload secret`)
              postMsg(`paired with your phone...`)
              pairedMobile.id = data.from
              localData.id = id
              tryStarting(peers.values())
            } else if (secret && !pairedMobile.secret) {
              logError(`Not for you! ${data.from} (mobile)`)
              peerIds.get(data.from).stopStream = true
              cancelStreamFromPeer(findPeer(peers.values(), data.from))
            } else if (!secret && !acceptStreams()) {
              logError(`You got a partner!`)
              logSuccess(`localMobile peer id : ${pairedMobile.id}`)
            }
          })
          break
        }
        /*
        confirmation from mobile that it is paired
        */
        case 'local:mobile:secret:set':
          {
            const { id } = data.payload
            localData.id = id
            logSuccess(`Secret was set on ${data.from} by ${id}`)
            tryStarting(peers.values())
          }
          break
        /*
        confirmation from mobile that it joinging room
        */
        case 'local:mobile:joiningRoom': {
          if (isValidMobileKey('secret', data.payload.secret) && isValidMobileKey('id', data.from)) {
            logInfo(`Mobile ${data.from} is joining ${data.payload.roomId} so joing too`)
            emitter.emit('webrtc:connect', {
              roomId: data.payload.roomId,
            })
          }
          break
        }

        case 'local:desktop:message': {
          AppEmitter.emit('desktop:communcation:remote', data.payload)
          break
        }
        case 'local:desktop:addKeyColors': {
          AppEmitter.emit('remote:addKeyColor', data.payload)
          break
        }
        case 'local:mobile:addKeyColor': {
          addKeyColor(data.payload)
          break
        }
        case M_SCREEN_ORIEN: {
          Gui.mobileDeviceOrientation = data.payload
          break
        }
        case M_DEVICE_MOTION: {
          /*if (!firstp) {
            firstp.x = data.payload.x
            firstp.y = data.payload.y
            firstp.z = data.payload.z
          }
          pp.x += data.payload.x
          pp.y += data.payload.y
          pp.z += data.payload.z*/
          if (!Gui.rendering) return
          Gui.deviceMotion = data.payload
          Gui.echo = {
            ...Gui.echo,
            ...{ delay: Math.abs(data.payload.z) + 0.5 },
          }
          break
        }
        case M_DEVICE_ORIEN: {
          if (!Gui.rendering) return
          Gui.deviceOrien = data.payload
          if (data.payload.landscape) {
            //look up down
            Gui.uSaturation = Math.abs(data.payload.gamma / 90 + 1)
            Gui.panner = {
              value: data.payload.alpha,
            }
          } else {
            //look up down
            Gui.uSaturation = Math.abs(data.payload.beta / 45 + 1)
          }
          break
        }
        case M_SCREEN_SIZE: {
          break
        }
        case 'local:mobile:mesh': {
          if (isValidMobileKey('id', data.from) && data.payload) {
            logInfo(`local:mobile:mesh received!`)
            regl.addMesh(data.payload)
          }
          break
        }
        case 'local:mobile:quaternion': {
          regl.setEyeMatrixDeviceQuaternion(data.payload)
          break
        }
        case 'local:desktop:gl': {
          if (remoteDesktopPeer.id) {
            Gui.remoteDesktopGL = data.payload
          }
          break
        }

        //*** DEBUG
        case 'local:mobile:mesh:log': {
          console.log(data.payload)
        }
        case 'rotationvector': {
          console.log(data.payload)
        }
      }
    })

    logInfo('Added Listeners')
  }

  const sendHandshake = () =>
    send('local:desktop:handshake', {
      secret: null,
      //secret: pairedMobile.secret,
      isPlayingMedia: true, // isPlayingMedia(),
      uuid: localData.uuid,
    })

  webrtc.on('createdPeer', peer => {
    console.log(`Found peer! ${peer.id}`)
    peers.add(peer)
    sendHandshake()
  })

  webrtc.on('leftRoom', roomId => {
    reset()
    peerIds.clear()
    peers.clear()
  })

  webrtc.on('peerRemoved', peer => {
    const foundPeer = findPeer(peerIds.values(), peer.id)
    if (foundPeer && foundPeer.desktop) {
      stopRemoteDesktopStream()
      disconnectTromOtherDesktop()
    }
    peers.delete(peer)
    peerIds.delete(peer.id)
    cancelStreamFromPeer(peer)
    console.log(`Peer left ${peer.id}`)
    console.log(`Peers remaining: ${peerIds.size}`)
    pairedMobileLeftRoom(peer.id)
    console.log(pairedMobiles)
  })

  webrtc.on('videoRemoved', (videoEl, peer) => {
    logInfoB(`videoRemoved ${peer.id}`)
    onVideoStopped(videoEl)
  })

  webrtc.on('videoAdded', function(video, peer) {
    video.setAttribute('autoplay', true)
    video.setAttribute('crossorigin', 'anonymous')
    video.setAttribute('muted', true)
    video.style.display = 'none'
    const foundPeer = findPeer(peerIds.values(), peer.id)

    console.log(`foundPeer: ${JSON.stringify(foundPeer)}`)

    if (foundPeer) {
      console.log(`foundPeer dekstop: ${foundPeer.desktop}`)
      console.log(`foundPeer isPlayingMedia: ${foundPeer.isPlayingMedia}`)
    }

    console.log(peer)

    if (foundPeer && foundPeer.stopStream) {
      //mobile stream not belonging to you
      logInfo(`videoAdded: you were told to stop this stream`)
      cancelStream(peer.stream)
      //video.parent.removeChild(video)
    } else if (foundPeer && acceptStreams() && foundPeer.desktop && foundPeer.isPlayingMedia) {
      logInfo(`videoAdded: connected to another desktop, webcam started?: ${webcam.started}`)
      postMsg(`connected to another desktop`)
      connectToOtherDesktop(peer, peer.id)
      setTimeout(() => {
        setRemoteDesktopStream(peer.videoEl)
      }, FUDGE_VIDEO_DELAY)
    } else if (isValidMobileKey('id', peer.id) && foundPeer.desktop && foundPeer.isPlayingMedia) {
      logInfo(`videoAdded: connected to your phone`)
      postMsg(`connected with your phone`)
      /*
      //another desktops stream, you have a mobile
      */
      //keyVideo.el = peer.videoEl
      //console.log(peer.videoEl);

      //setVideoToKey(peer.videoEl)

      setTimeout(() => {
        setPairedMobileReady(peer.videoEl, peer.id)
      }, FUDGE_VIDEO_DELAY)
    }

    logInfo(`VideoAdded from ${peer.id}`)

    tryStarting(peers.values())
  })

  const resizeCanvas = (w = WIDTH, h = HEIGHT) => {
    let { width, height, x, y } = cover(window.innerWidth, window.innerHeight, w, h)
    const scale = Math.max(width / w, height / h)
    canvasEl.style.transform = `scale3d(${scale},${scale},1) translate3d(0, 0, 0)`
    canvasEl.style.webkitTransform = `scale3d(${scale},${scale},1) translate3d(0,0, 0)`
    canvasEl.style.top = `${y / 2}px`
    canvasEl.style.left = `${x / 2}px`
  }

  window.addEventListener('resize', () => resizeCanvas(WIDTH, HEIGHT))

  resizeCanvas(WIDTH, HEIGHT)

  //*************
  // RECORDING
  //*************

  const recordFinalStart = () => {
    sound.recordMasterStart()

    setTimeout(() => {
      logSuccess(`recordFinalStart recording!`)
      Gui.recording = true
    }, RECORD_FRAMES_DELAY)

    emitter.emit('desktop:render:start')
  }

  const recordFinalStop = () => {
    emitter.emit('desktop:render:stop')
    if (videoEl) videoEl.pause()
    postMsg(`converting frames to video`)
    webrtc.webrtc.localStreams.forEach(cancelStream)
    webrtc.webrtc.peers.forEach(peer => cancelStream(peer.stream))
    Gui.recording = false
    Gui.rendering = false
    sono.stopAll()
    sono.destroyAll()
    sound.recordMasterStop((blob, duration) => {
      sound.destroy()
      logInfo(`audio complete, duration: ${duration}`)
      record.addAudio(blob, duration)
      record.start(canvasKey).then(video => {
        emitter.emit('desktop:render:completed')
        Server.upload(video)
          .then(uploadResp => {
            console.log(uploadResp)
            emitter.emit('desktop:render:uploaded')
          })
          .catch(err => {
            console.log(err)
          })
      })
    })
  }

  //*************
  // LOOP
  //*************

  const renderMulti = () => {
    regl.drawKey({
      mobile: {
        source: renderSettings.mainVideo.el,
        width: WIDTH,
        height: HEIGHT,
      },
      keyVideo: {
        source: renderSettings.keyVideo.el,
        width: WIDTH,
        height: HEIGHT,
      },
      keyColors: {
        source: canvasKey,
        format: 'rgba',
        width: KEY_W,
        height: KEY_H,
      },
    })
  }

  const renderSingle = source => {
    regl.drawSingle({
      mobile: {
        source: source,
        flipX: true,
        width: WIDTH,
        height: HEIGHT,
      },
    })
  }

  const engine = loop(function(dt) {
    const p = performance.now()
    if (Gui.rendering) {
      if (p - _timeCounter >= FPS_I) {
        if (renderSettings.multi && renderSettings.mainVideo.isReady && renderSettings.keyVideo.isReady) {
          if (renderSettings.mainVideo.el.readyState === 4 && renderSettings.keyVideo.el.readyState === 4) {
            renderMulti()
          } else if (renderSettings.mainVideo.el.readyState !== 4 && renderSettings.keyVideo.el.readyState === 4) {
            // webcam active and remote desktop not
            renderSingle(renderSettings.keyVideo.el)
          }
        } else if (renderSettings.single && !renderSettings.multi) {
          const source = renderSettings.mainVideo.el || renderSettings.keyVideo.el
          if (source) {
            if (source.readyState === 4) {
              renderSingle(source)
            }
          }
        }

        if (Gui.recording) {
          record.addFrame(regl.read())
        }

        _timeCounter = p
      }
    }
  })

  //DEV
  Gui.recordFinalStart = recordFinalStart
  Gui.recordFinalStop = recordFinalStop

  //*************
  // LISTRENES
  //*************

  AppEmitter.on('addKeyColor', ({ color }) => addKeyColor(color))

  AppEmitter.on('changerooms', ({ roomId }) => {
    engine.stop()
    stopPairedMobile()
    pairedMobiles.forEach(pairedMobile => {
      if (pairedMobile.peer) {
        logInfo('sending local:desktop:joinRoom' + roomId)
        webrtc.sendToAll('local:desktop:joinRoom', {
          roomId,
          secret: pairedMobile.secret,
        })
      }
    })
    emitter.emit('webrtc:connect', { roomId })
  })

  AppEmitter.on('webcam:start', () => {
    webcam
      .start()
      .then(stream => {
        setVideoToKey(createVideoElFromStream(stream))
      })
      .catch(err => {})
  })

  AppEmitter.on('webcam:stop', () => {
    logInfo(`webcam:stop`)
    stopWebcam()
    stopKeyVideo()
  })

  AppEmitter.on('insta:loaded', () => {
    setVideoToKey(videoEl)
  })

  AppEmitter.on('record:final:start', () => {
    recordFinalStart()
  })

  AppEmitter.on('record:final:stop', () => {
    recordFinalStop()
  })

  AppEmitter.on('regl:mesh:removed', () => {
    logInfo(`Mesh removed, requesting a new one`)
    send('local:desktop:request:mesh')
    regl.addMesh(geoInteraction.getGeometry(), geoInteraction.modelMatrix)
  })

  AppEmitter.on('record:frame:start', () => {})

  AppEmitter.on('desktop:communcation', str => send('local:desktop:message', str))
  AppEmitter.on('observeviewer:start', () => (remoteDesktopPeer.id ? observeViewer.addStream(remoteDesktopPeer.peer.stream) : null))

  Gui.on('disconnect', v => {
    if (v) {
      engine.stop()
      stopPairedMobile()
      logInfo('desktop: Disconnected')
    }
  })

  Gui.on('connect', v => {
    if (v && !QS.parse(location.search).norender) {
      Gui.rendering = true
      engine.start()
      logInfo('desktop: Connected')
    }
  })

  const updatePeersOfGL = () =>
    send('local:desktop:gl', {
      tolerance: Gui.tolerance,
      slope: Gui.slope,
    })
  Gui.on('tolerance', v => updatePeersOfGL())
  Gui.on('slope', v => updatePeersOfGL())

  addListeners()
  createCanvasStream()

  logSuccess(`STARTED A NEW DESKTOP SESSION`)

  return {
    addListeners,
  }
}

export default Desktop
