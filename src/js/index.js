// creating required number of slices for fill data (name and value)

const createDataForm = nr => {
  const chartContainer = document.querySelector('.article--chart')
  const formContent = document.querySelector('.form__content')
  const sectionDetails = document.querySelector('.section--itemsData')
  sectionDetails.style.display = "block"

  const currentNrOfSlices = document.querySelectorAll('.form__slice').length

  if (currentNrOfSlices > nr) {
    formContent.removeChild(formContent.lastChild)
    createDataForm(nr)
  } else {
    for (let i = currentNrOfSlices; i < nr; i++) {
      const divSlice = document.createElement('div')
      divSlice.classList.add('form__slice')

      divSlice.innerHTML = `
        <h3 class="title">Slice ${ i + 1 }</h3>
        <divclass="form__data">
          <label for="inputName${ i }" class="form__label">Name: </label>
          <input id="inputName${ i }" type="text" class="form__input sliceName"></input>
        </div>
        <div class="form__data data data--value">
          <label for="inputValue${ i }" class="form__label">Value: </label>
          <input id="inputValue${ i }" type="number" class="form__input sliceValue" placeholder="Write only numbers"></input>
        </div>
      `

      formContent.appendChild(divSlice)
    }
  }

  if (currentNrOfSlices <= nr && chartContainer.style.display === "flex") {
    drawPieChart()
  }
}

// event for sumbit first form

const buttonMainData = document.querySelector('.button--mainData')

buttonMainData.addEventListener('click', () => {
  const chosenOption = document.querySelector('.select--numberOfItems')
  createDataForm(chosenOption.selectedIndex + 2)
})

// creating chart

const drawPieChart = () => {
  const chartContainer = document.querySelector('.article--chart')
  chartContainer.style.display = "flex"

  // sending title
  const chartTitle = document.querySelector('#chartTitle').value
  const titleContainer = document.querySelector('.title--chart')
  titleContainer.textContent = chartTitle

  // getting data

  const dataNamesLabels = document.querySelectorAll('.sliceName')
  let dataNames = []

  dataNamesLabels.forEach(label => {
    dataNames.push(label.value)
  })

  const dataValuesLabels = document.querySelectorAll('.sliceValue')
  let dataValues = []

  dataValuesLabels.forEach(label => {
    dataValues.push(label.value)
  })
  const numberOfValues = dataValues.length
  const leadingColor = document.querySelector('.input--color').value

  // Colors functions generating table of colors for slices

  const getColorsTable = () => {
    const hexToDec = val => parseInt(val, 16)
    const decToHex = val => val !== 0 ? val.toString(16) : '00'
    const leadingColorRGB = leadingColor.match(/../g).map(hexToDec)

    const getHexaColorsTable = rgb => {
      const step = ~~((255 - Math.min(...rgb)) / numberOfValues)
      const getNewColor = (rgb, i) => rgb.map(x => Math.min(x + step * i, 255))
      const getNewRGB = (leadingColor, nrOfColors) => Array(nrOfColors).fill(leadingColor).map(getNewColor)
      const newRGB = getNewRGB(rgb, numberOfValues)
      return newRGB.map(rgb => ['#', ...rgb.map(decToHex)].join(''))
    }

    return getHexaColorsTable(leadingColorRGB)
  }

  const colors = getColorsTable()

  // creating data array

  const sum = dataValues.reduce((a, b) => a * 1 + b * 1, 0)
  const percentage = dataValues.map(x => Math.round(x * 1000 / sum / 10))

  const getData = i => {
    return {
      name: dataNames[i],
      value: dataValues[i],
      percent: percentage[i]
    }
  }

  const getBasicValuesForArr = x => {
    for (let i in dataNames) {
      x.push(getData(i))
    }
  }
  const addColorToArr = arr => arr.map((x, i) => (x.color = colors[i]))

  const dataForDrawChart = []
  getBasicValuesForArr(dataForDrawChart)
  dataForDrawChart.sort((a, b) => a.value - b.value).reverse()
  addColorToArr(dataForDrawChart)

  // Creating SVG chart

  const radius = svg.style.width.slice(0, -2) / 2

  const calculateDeg = percent => 360 * percent / 100
  const calculateBaseDeg = deg => deg > 180 ? 360 - deg : deg
  const calculateRadian = baseDeg => baseDeg * Math.PI / 180

  const calculateRatios = (percent) => {
    const deg = calculateDeg(percent)
    const baseDeg = calculateBaseDeg(deg)
    const radians = calculateRadian(baseDeg)
    const sweep = radians > Math.PI ? '1' : '0'

    const valueZ = Math.sqrt(2 * Math.pow(radius, 2) * (1 - Math.cos(radians)))
    const baseValX = baseDeg <= 90 ? radius * Math.sin(radians) : radius * Math.sin((180 - baseDeg) * Math.PI / 180)
    const valueX = deg <= 180 ? baseValX + radius : radius - baseValX
    const valueY = Math.sqrt((Math.pow(valueZ, 2)) - Math.pow(baseValX, 2))

    return [deg, sweep, valueX, valueY]
  }

  const drawSegment = (data, i) => {
    const [deg, sweep, valueX, valueY] = calculateRatios(data.percent)

    const newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    newPath.setAttributeNS(null, 'fill', data.color)
    newPath.setAttributeNS(null, 'd', `M${ radius },${ radius } L${ radius },0 A${ radius },${ radius } ${ sweep } 1,1 ${ valueX }, ${ valueY } z`)
    newPath.textContent = `Name: ${ data.name }, Value: ${ data.value }, Percent: ${ data.percent }%`
    newPath.setAttributeNS(null, 'transform', `rotate(${ rotation }, ${ radius }, ${ radius })`)

    rotation += deg
    svg.appendChild(newPath)
  }

  let rotation = 0
  for (let i = 0; i < numberOfValues; i++) {
    drawSegment(dataForDrawChart[i], i)
  }
}

// invoking drawing pie chart (check validate inputs)

const buttonCreateChart = document.querySelector('.button--createChart')

buttonCreateChart.addEventListener('click', () => {
  const valueInputs = document.querySelectorAll('.sliceValue')
  let dataValues = []

  valueInputs.forEach(input => {
    dataValues.push(input.valueAsNumber)
  })

  if (dataValues.every(x => !isNaN(x))) {
    drawPieChart()
  }
})

// Tooltip

const svg = document.querySelector('.svg')
const tooltip = document.querySelector('.tooltip')

svg.addEventListener('mousemove', (e) => {
  if (e.target.nodeName === 'path') {
    tooltip.style.left = `${ e.clientX + 20 }px`
    tooltip.style.top = `${ e.clientY - 30 }px`
    tooltip.style.display = 'block'
    tooltip.textContent = e.target.textContent
  }
})

svg.addEventListener('mouseout', (e) => {
  if (e.target.nodeName === 'path') {
    tooltip.style.display = 'none'
  }
})
