const displayText = document.getElementById('disrupt')
const inputText = document.getElementById('disrupt-edit')
const playForm = document.getElementById('play-form')
const editForm = document.getElementById('edit-form')
const effectsSelect = document.getElementById('effects')

function doDisrupt () {
  // Apply class to disrupt header
  // For demonstration purposes only!
  displayText.className = `disrupt ${effectsSelect.value}`

  // Run disruptions manually
  window.DISRUPT.forceStopDisruptions()
  window.DISRUPT.addDisruptions()
}

inputText.addEventListener('keydown', evt => {
  if (evt.keyCode === 13) {
    finishEdit()
  }
})

// Edit buttons
function startEdit () {
  // Kill any running disruptions
  window.DISRUPT.forceStopDisruptions()

  displayText.classList.add('hidden')
  inputText.classList.remove('hidden')

  playForm.classList.add('hidden')
  editForm.classList.remove('hidden')

  // Focus on editable area
  inputText.focus()
  inputText.selectionStart = inputText.selectionEnd = inputText.value.length
}

function finishEdit () {
  // Update display text from editor
  if (inputText.value.length > 0) {
    let text = document.createTextNode(inputText.value)
    displayText.innerHTML = ''
    displayText.appendChild(text)

    displayText.classList.remove('hidden')
    inputText.classList.add('hidden')

    playForm.classList.remove('hidden')
    editForm.classList.add('hidden')
  } else {
    alert('Please enter some text!')
  }
}

/* Recoloring function

function recolour (canvas, image, color) {
  let ctx = canvas.getContext('2d')
  let recoloured = new Image()

  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.rect(0, 0, canvas.width, canvas.height)
  ctx.fill()

  // Save image and restore canvas
  recoloured.setAttribute('crossOrigin', 'anonymous')
  recoloured.src = canvas.toDataURL()
  ctx.restore()

  // Return recoloured image
  return recoloured
}*/
