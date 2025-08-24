import './style.css'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Test Application</h1>
    <div class="card">
      <button id="counter" type="button">Count: 0</button>
      <button id="reset" type="button">Reset</button>
    </div>
    <div class="test-section">
      <h2>Feature Tests</h2>
      <div class="test-grid">
        <div class="test-item">
          <label for="text-input">Text Input:</label>
          <input type="text" id="text-input" placeholder="Type something...">
          <span id="text-output">Output will appear here</span>
        </div>
        <div class="test-item">
          <label for="color-picker">Color Picker:</label>
          <input type="color" id="color-picker" value="#3b82f6">
          <div id="color-display" class="color-display"></div>
        </div>
        <div class="test-item">
          <button id="api-test">Test API Call</button>
          <div id="api-result">Click to test</div>
        </div>
      </div>
    </div>
  </div>
`

// Counter functionality
let counter = 0
const counterBtn = document.querySelector('#counter')
const resetBtn = document.querySelector('#reset')

function updateCounter() {
  counterBtn.textContent = `Count: ${counter}`
}

counterBtn.addEventListener('click', () => {
  counter++
  updateCounter()
})

resetBtn.addEventListener('click', () => {
  counter = 0
  updateCounter()
})

// Text input test
const textInput = document.querySelector('#text-input')
const textOutput = document.querySelector('#text-output')

textInput.addEventListener('input', (e) => {
  textOutput.textContent = `You typed: "${e.target.value}"`
})

// Color picker test
const colorPicker = document.querySelector('#color-picker')
const colorDisplay = document.querySelector('#color-display')

function updateColor() {
  const color = colorPicker.value
  colorDisplay.style.backgroundColor = color
  colorDisplay.textContent = color
}

colorPicker.addEventListener('change', updateColor)
updateColor()

// API test
const apiTestBtn = document.querySelector('#api-test')
const apiResult = document.querySelector('#api-result')

apiTestBtn.addEventListener('click', async () => {
  apiResult.textContent = 'Loading...'
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
    const data = await response.json()
    apiResult.innerHTML = `
      <strong>API Test Successful!</strong><br>
      Title: ${data.title}<br>
      User ID: ${data.userId}
    `
  } catch (error) {
    apiResult.textContent = `API Test Failed: ${error.message}`
  }
})