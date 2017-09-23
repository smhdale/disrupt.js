const html2canvas = require('../vendor/html2canvas.min.js')

class DISRUPT {
  constructor () {
    this.DOMURL = window.URL || window.webkitURL || window

    this.targetClass = 'disrupt'
    this.disruptables = {}

    this.disruptionCounter = 0

    this.GENERATORS = {
      randomRect: canvas => {
        let x = canvas.width * Math.random()
        let y = canvas.height * Math.random()
        let w = (canvas.width - x) * Math.random()
        let h = (canvas.height - y) * Math.random()

        return {
          sx: x,
          sy: y,
          w: w,
          h: h,
          dx: x,
          dy: y
        }
      }
    }

    // Disruption animations
    this.DISRUPTIONS = {
      /**
       * Horizontal bars that shake left-to-right
       */
      'dsrpt-horizontal': {
        setup: canvas => {
          let numLines = 7
          let lineHeight = canvas.height / numLines
          let lines = []
          for (let i = 0; i < numLines; i++) {
            lines.push({
              sx: 0,
              sy: lineHeight * i,
              w: canvas.width,
              h: lineHeight,
              dx: 0,
              dy: lineHeight * i,
              nextMovement: 0,
              offset: 0
            })
          }

          return {
            runtime: 2000,
            lines: lines
          }
        },
        animate: (canvas, domImage, setupData, progress) => {
          let ctx = canvas.getContext('2d')
          let lines = setupData.lines
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Animate lines
          for (let i = 0; i < lines.length; i++) {
            let line = lines[i]

            // Should this line move this frame?
            if (progress > line.nextMovement) {
              // Offset should be 0 if animation is finished
              if (progress >= 1) {
                line.offset = 0
              } else {
                let offset = Math.random() * line.h * 2 - line.h
                let dampener = Math.max(0, 1 - progress)
                line.offset = offset * dampener
              }

              // Set time for next movement
              line.nextMovement += Math.random() * 0.3
              line.nextMovement = Math.min(1, line.nextMovement)
            }

            // Draw the line
            ctx.drawImage(domImage, line.sx, line.sy, line.w, line.h, line.dx + line.offset, line.dy, line.w, line.h)
          }
        }
      },

      /**
       * A distorted checkerboard effect that slowly dissolves in
       */
      'dsrpt-dissolve': {
        setup: canvas => {
          let rows = 30
          let columns = 8

          let w = canvas.width / rows
          let h = canvas.height / columns

          let grid = []
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
              grid.push({
                x: r * w,
                y: c * h,
                w: w,
                h: h,
                xOff: w * (Math.random() * 2 - 1),
                yOff: h * (Math.random() * 2 - 1),
                showAt: Math.random(),
                correctAt: Math.random()
              })
            }
          }

          return {
            runtime: 1500,
            grid: grid
          }
        },
        animate: (canvas, domImage, setupData, progress) => {
          let ctx = canvas.getContext('2d')
          let grid = setupData.grid
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          /* ANIMATION CODE */
          for (let i = 0; i < grid.length; i++) {
            let square = grid[i]
            let x = square.x
            let y = square.y
            if (progress > square.showAt) {
              if (progress < square.correctAt) {
                x += square.xOff
                y += square.yOff
              }
              ctx.drawImage(domImage, square.x, square.y, square.w, square.h, x, y, square.w, square.h)
            }
          }
        }
      },

      /**
       * Blocks of the source image render "incorrectly" then snap into place
       */
      'dsrpt-blocks': {
        setup: (canvas, domImage, generators) => {
          let numblocks = 15
          let blocks = []
          for (let i = 0; i < numblocks; i++) {
            let block = generators.randomRect(canvas)

            let maxOffset = 20

            let xOff = Math.random() * maxOffset * 2 - maxOffset
            let yOff = Math.random() * maxOffset * 2 - maxOffset
            block.dx += xOff
            block.dy += yOff
            block.showAt = Math.random() * 0.1
            block.repositionAt = Math.random() * 0.9 + 0.1

            blocks.push(block)
          }

          return {
            runtime: 2500,
            blocks: blocks
          }
        },
        animate: (canvas, domImage, setupData, progress) => {
          let ctx = canvas.getContext('2d')
          let blocks = setupData.blocks

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Draw base image and erase sections
          ctx.drawImage(domImage, 0, 0)

          // Clear areas behind blocks
          for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block.repositionAt > progress) {
              ctx.clearRect(block.sx, block.sy, block.w, block.h)
            }
          }

          // Draw blocks
          for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block.repositionAt > progress) {
              ctx.drawImage(domImage, block.sx, block.sy, block.w, block.h, block.dx, block.dy, block.w, block.h)
            }
          }
        }
      },

      /**
       * The source images fades in and scales down, with some sections
       * glitching & freezing along the way
       */
      'dsrpt-scale-down': {
        setup: (canvas, domImage, generators) => {
          let numBlocks = 15
          let blocks = []
          for (let i = 0; i < numBlocks; i++) {
            let block = generators.randomRect(canvas)
            block.animTime = Math.min(0.4 + Math.random() * 0.7, 1)
            block.stopAt = Math.random() * block.animTime
            block.stopLength = Math.random() * Math.min(0.4, block.animTime)
            block.stopScale = 0
            blocks.push(block)
          }

          return new function () {
            // Props
            this.runtime = 1500
            this.blocks = blocks
            this.scale = {
              min: 1,
              max: 1.5
            }

            this.baseX = scale => -canvas.width * (scale - 1) / 2,
            this.baseY = scale => -canvas.height * (scale - 1) / 2,
            this.getScale = progress => this.scale.max - this.parabola(progress) * (this.scale.max - this.scale.min),
            this.scaleProgress = (progress, max) => Math.min(progress / max, 1),
            this.parabola = x => -Math.pow(x - 1, 2) + 1
          }
        },
        animate: (canvas, domImage, setupData, progress) => {
          let ctx = canvas.getContext('2d')
          let blocks = setupData.blocks

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Animate base image
          let baseProgress = setupData.scaleProgress(progress, 0.3)
          let baseScale = setupData.getScale(baseProgress)

          ctx.globalAlpha = baseProgress
          ctx.drawImage(
            domImage, 0, 0, canvas.width, canvas.height,
            setupData.baseX(baseScale), setupData.baseY(baseScale), canvas.width * baseScale, canvas.height * baseScale
          )

          for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]

            // Remove section from base image
            ctx.globalAlpha = 1
            ctx.clearRect(setupData.baseX(baseScale) + block.sx * baseScale, setupData.baseY(baseScale) + block.sy * baseScale, block.w * baseScale, block.h * baseScale)

            let myProg = setupData.scaleProgress(progress, block.animTime)
            let scale = setupData.getScale(myProg)
            let finalScale = scale

            if (block.stopAt < progress && progress <= block.stopAt + block.stopLength) {
              if (block.stopScale === 0) {
                block.stopScale = scale
              }
              finalScale = block.stopScale
            }

            ctx.globalAlpha = myProg
            ctx.drawImage(
              domImage, block.sx, block.sy, block.w, block.h,
              setupData.baseX(finalScale) + block.sx * finalScale, setupData.baseY(finalScale) + block.sy * finalScale, block.w * finalScale, block.h * finalScale
            )
          }
        }
      },

      /**
       * Okay let's give RGB shifting a go again
       */
      'dsrpt-rgb-shift': {
        setup: (canvas, domImage) => {
          let ctx = canvas.getContext('2d')

          // Set up colour-shifted images
          let colourNames = [ 'red', 'green', 'blue' ]
          let colours = []


          for (let i = 0; i < colourNames.length; i++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw basic image
            ctx.globalCompositeOperation = 'source-over'
            ctx.drawImage(domImage, 0, 0)

            // Recolour it
            ctx.globalCompositeOperation = 'source-in'
            ctx.fillStyle = colourNames[i]
            ctx.rect(0, 0, canvas.width, canvas.height)
            ctx.fill()

            let img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = canvas.toDataURL('image/png')

            colours.push({
              image: img,
              x: 0,
              dx: 0,
              changeFreq: 0.1,
              changeAt: 0
            })
          }

          // Reset comp mode
          ctx.globalCompositeOperation = 'source-over'

          return new function () {
            this.runtime = 2500
            this.colours = colours
            this.amplitude = 5

            this.glitchAt = 0
            this.glitchTime = 0.05

            this.maxGlitchDelay = 0.8
            this.glitchAmplitudeModifier = 10

            this.isGlitching = progress => (progress > this.glitchAt && progress <= this.glitchAt + this.glitchTime)
            this.setGlitchAt = progress => {
              this.glitchAt = progress + Math.random() * this.maxGlitchDelay
            }
            this.setGlitchAt(0)

            // Glitch bars
            let numBars = 3
            this.glitchBars = []
            for (let i = 0; i < numBars; i++) {
              this.glitchBars.push(new function () {
                this.w = 0
                this.h = 1
                this.x = 0
                this.y = 0
                this.dx = 0
                this.maxOffset = 20
                this.maxMoveTime = 0.03
                this.moveAt = 0

                this.update = progress => {
                  if (progress > this.moveAt) {
                    this.updateSize()
                    this.updatePos()
                    this.moveAt = progress + this.maxMoveTime * Math.random()
                  }
                }

                this.updateSize = () => {
                  this.w = Math.random() * canvas.width
                  let xLeft = canvas.width - this.w
                  this.x = Math.random() * xLeft
                }

                this.updatePos = () => {
                  this.y = Math.floor(Math.random() * (canvas.height - this.h))
                  this.dx = this.maxOffset * (Math.random() * 2 - 1)
                }
              })
            }
          }
        },
        animate: (canvas, domImage, setupData, progress) => {
          let ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          /* ANIMATION CODE */

          // Draw colours
          ctx.globalAlpha = 1/3

          for (let colour of setupData.colours) {
            // Update dx every now and then
            if (progress > colour.changeAt) {
              colour.changeAt = progress + Math.random() * colour.changeFreq
              colour.x = setupData.amplitude * (Math.random() * 2 - 1)
              colour.dx = colour.x * (setupData.isGlitching(progress) ? setupData.glitchAmplitudeModifier : 1)
            }

            ctx.drawImage(colour.image, colour.dx, 0)
          }

          if (!setupData.isGlitching(progress)) {
            ctx.globalAlpha = 2/3
            ctx.drawImage(domImage, 0, 0)
          }

          // When glitch has finished, schedule another
          if (progress > setupData.glitchAt + setupData.glitchTime) {
            setupData.setGlitchAt(progress)
          }

          // Glitch bars
          for (let bar of setupData.glitchBars) {
            // Update bar
            bar.update(progress)

            ctx.globalAlpha = 1
            ctx.clearRect(bar.x, bar.y, bar.w, bar.h)

            // Re-draw source image but offset
            ctx.globalAlpha = 1/3
            for (let colour of setupData.colours) {
              ctx.drawImage(colour.image, bar.x, bar.y, bar.w, bar.h, bar.x + bar.dx + colour.dx, bar.y, bar.w, bar.h)
            }

            if (!setupData.isGlitching(progress)) {
              ctx.globalAlpha = 2/3
              ctx.drawImage(domImage, bar.x, bar.y, bar.w, bar.h, bar.x + bar.dx, bar.y, bar.w, bar.h)
            }
          }
        }
      }
    }
  }

  get disruptionTypes () {
    return Object.keys(this.DISRUPTIONS)
  }

  getDisruption (id) {
    return this.disruptables[id]
  }

  removeDisruption (id) {
    let disruption = this.disruptables[id]

    // Stop animation
    disruption.disruptionAnim.stop()

    // Re-show source element
    disruption.elem.style.visibility = 'visible'

    // Remove disruption canvas
    disruption.canvas.parentElement.removeChild(disruption.canvas)

    // Delete disruption
    delete this.disruptables[id]
  }

  forceStopDisruptions () {
    Object.keys(this.disruptables).forEach(key => {
      let d = this.disruptables[key]
      this.removeDisruption(d.id)
    })
  }

  /* DISRUPTION FUNCTIONS */

  addDisruptions () {
    let me = this

    // Scan through DOM and find disruptable elements
    let disruptables = Array.from(document.getElementsByClassName(this.targetClass))

    let canvasLoads = disruptables.map(elem => {
      // Determine disruption type - pick first found class
      let disruptionType = 'dsrpt-horizontal'
      for (let anim of this.disruptionTypes) {
        if (elem.classList.contains(anim)) {
          disruptionType = anim
          break
        }
      }

      let disruption = {
        id: this.disruptionCounter++,
        elem: elem,
        disruptionType: disruptionType,
        loop: elem.classList.contains('loop')
      }

      // Use html2canvas to create canvas and image
      return new Promise((resolve, reject) => {
        html2canvas(elem, {
          onrendered: canvas => {
            let img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = canvas.toDataURL('data/image')

            disruption.image = img
            disruption.canvas = canvas

            me.disruptables[disruption.id] = disruption

            // Position canvas
            this.positionCanvas(elem, disruption.canvas)
            elem.parentNode.insertBefore(disruption.canvas, elem)
            resolve()
          }
        })
      })
    })

    Promise.all(canvasLoads).then(() => {
      me.triggerDisrupt()
    })
  }

  positionCanvas (elem, canvas) {
    // Get element bounds
    let bounds = elem.getBoundingClientRect()
    let parentBounds = elem.parentElement.getBoundingClientRect()

    // Position the canvas
    let scroll = document.body.scrollTop
    canvas.style.position = 'absolute'
    canvas.style.top = `${bounds.top + scroll - parentBounds.top}px`
    canvas.style.left = `${bounds.left - parentBounds.left}px`
  }

  triggerDisrupt () {
    Object.keys(this.disruptables).forEach(key => {
      let d = this.disruptables[key]
      let disruption = this.DISRUPTIONS[d.disruptionType]

      // Run setup
      let setupData = disruption.setup(d.canvas, d.image, this.GENERATORS)
      let animFunction = disruption.animate

      // Hide original element
      d.elem.style.visibility = 'hidden'

      // Do animation
      d.disruptionAnim = new DisruptAnimation(this, d.id, setupData, animFunction, d.loop)
    })
  }
}

class DisruptAnimation {
  constructor (parent, disruptionId, setupData, animFunction, loop) {
    this.parent = parent
    this.data = parent.getDisruption(disruptionId)
    this.setupData = setupData
    this.animFunction = animFunction
    this.loop = loop

    this.running = true

    this.animStart = null
    this.currentFrame = window.requestAnimationFrame(this.doAnimation.bind(this))
  }

  get animationFrame () {
    return this.currentFrame
  }

  stop () {
    window.cancelAnimationFrame(this.currentFrame)
  }

  doAnimation (timestamp) {
    if (this.animStart === null) {
      this.animStart = timestamp
    }

    // Determine animation progress (from 0 to 1)
    let progress = (timestamp - this.animStart) / this.setupData.runtime

    // Run custom animation function
    this.animFunction(this.data.canvas, this.data.image, this.setupData, progress)

    if (progress < 1 || this.loop) {
      this.currentFrame = window.requestAnimationFrame(this.doAnimation.bind(this))
    } else {
      this.stop()

      // Delete self from parent
      this.parent.removeDisruption(this.data.id)
    }
  }
}

// Auto-create global instance and trigger disruptions
window.DISRUPT = new DISRUPT()

// TODO: add ability to wait until revealed by scroll
window.DISRUPT.addDisruptions()
